
// The core execution timeline used for synchronization
class Timeline{

    events ; // Events after base time
    current_time;
    executed_time; 
    next_execute = 0 ;
    instants ; // map<id, vector<{time,obj}> of value of each object immediately after each change for time between base time and executed_time
    instant_read_index ; // map<id,int> points to position in instant sub vectors last read (starting from here allows fast access for temporally coherent reads)
    last_instant_time ; // Time of writing of the last instant read with get or getInstant
    get_instances = {} ; // a temporary variable to hold references to objects returned by get
    events_spawned = undefined; // A temporary variable to track what events are spawned by another running event
    last_run_time ; // the real clock time in milliseconds of the last time the run method was called
    last_update_current_time ; // the current_time of the last update received used to measure game time latency
    ping=-1;
    client = undefined; // A link to a TClient object if this timeline is attached to one
    aggressive_event_sending = true; // Whether user generated events are sent to the server aggressively
    default_event_delay = 0.01; // events added without time will be given current_time + this
    default_spawn_delay = 0.001; // events spawned in other events without time will be given executed_time + this

    observe_offset = {}; // Map from id to when that ID should be displayed relative to current_time
    default_observe_offset = -0.1 ; // default if observe_offset isn't set for a requested id
    last_observed = {} ; // map from id to last returned interpolation value for getObserved 
    last_observed_time = {} ; // timestamps for last_observed

    event_hashes = {} ; // map from event hashes to -> true for all events

    next_system_id = 5 ;
    next_free_id = -1 ;
    assigned_id_block = -1 ;
    static id_block_size = 10000

    static sync_base_age = 0.3 ; // time that synced base time is behind current time
    static base_age = 1; // Amount of history to keep on the timeline
    static execute_buffer = 0.3 ; // How far ahead of the current time to predictively execute instructions
    static smooth_clock_sync_rate = 0.2; // how fast to adjust client clock time when it's close to synchronized
    static event_write_delay = 0.0001; // time after event its data changes are written

    constructor(time = 0){
        this.current_time = time ;
        this.executed_time = time ;
        //this.base_time = time;
        this.instants = {};
        this.instant_read_index = {};
        this.events = [];
        this.last_run_time = new Date().getTime() ;
    }

    // returns an editable copy of an object's value at the current time
    // logs the access to reads and caches the copy when occuring inside an event run
    get(id){
        if(id in this.get_instances){
            return this.get_instances[id];
        }
        this.get_instances[id] = this.getInstant(id, this.executed_time);
        return this.get_instances[id] ;
    }

    // returns a copy of an object's value at the given time
    getInstant(id, time){
        if(!(id in this.instants)){
            return null ;
        }
        // Walk the pointer until it points at the last value before the executed_time
        while(this.instant_read_index[id] > 0 && this.instants[id][this.instant_read_index[id]].time > time){
            this.instant_read_index[id]--;
        }
        while(this.instant_read_index[id] < this.instants[id].length - 1 && this.instants[id][this.instant_read_index[id]+1].time <= time){
            this.instant_read_index[id]++;
        }
        if(this.instants[id][this.instant_read_index[id]].time <= time){ // don't pull newly created objects from the future
            this.last_instant_time = this.instants[id][this.instant_read_index[id]].time;
            return TObject.copy(this.instants[id][this.instant_read_index[id]].obj) ;
        }else{
            return null;
        }
        
    }

    // Adds a new event
    addEvent(new_event){
        if(!new_event.time){ // TODO note this means things that happen at time 0 don't actually
            if(this.executing_hash){ // if done inside another event
                new_event.time = this.executed_time + this.default_spawn_delay ; // use time of that event with delay
            }else{
                new_event.time = this.current_time + this.default_event_delay ; // if externally created use current time with delay
            }
        // Sometimes browsers that have been minimized will send very old packets and cause problems
        }else if(new_event.time < this.current_time-Timeline.sync_age){
            return ;
        }
        // TODO make sure events at the same time have their order set deterministically(maybe by hash) not by when they were added.
        let place = this.events.length;
        while(place > 0 && this.events[place-1].time > new_event.time){
            place--;
        }
        this.events.splice(place,0,new_event);
        let prev_next = this.next_execute;
        this.next_execute = Math.min(place,this.next_execute);
        /*
        if(this.next_execute < prev_next){
            console.log("rolled back " + (prev_next - this.next_execute));
            console.log(new_event);
        }*/
        //track events spawned from other events so they can be deleted if a rerun doesn't spawn them
        if(this.executing_hash){
            new_event.spawned_by = this.executing_hash ;
            new_event.computeSerial();
            new_event.just_spawned = true;
        }else if(this.aggressive_event_sending && this.client && this.client.connected){ // Send events created outside other events (i.e. player actions)
            new_event.computeSerial();
            let update = {current_time: this.current_time, events:[new_event.serial]} ;
            this.client.sendUpdate(JSON.stringify({update:update}));
        }else{
            new_event.computeSerial();
        }
        this.event_hashes[new_event.hash] = true;
        
    }

    // Add an object
    addObject(obj, ID, time = undefined){
        this.addEvent(new AddObject({type : obj.constructor.name, ID: ID, serial:obj.serialize()}, time)) ;
    }

    // Delete an object
    deleteObject(ID, time = undefined){
        this.addEvent(new DeleteObject({ID: ID}, time)) ;
    }


    // Executes the next event if it is not done and occurs before the given time
    // Returns whether there are more events to execute
    static removed_spawners = new IntHashSet();
    executeNext(new_time){

        if(this.next_execute >= this.events.length || this.events[this.next_execute].time > new_time){
            return false;
        }

        let event = this.events[this.next_execute] ;
        this.next_execute++; // must be before run because it may be referenced in the event if it adds events
        if(event.done){ // This event has already been run and it didn't read anything that has been rolled back
            return true ;
        }
        this.executed_time = event.time ;
        this.get_instances = {};
        this.executing_hash = event.hash;
        this.next_system_id = Math.abs(this.executing_hash)-1;
        event.read_ids = {};
        let data_dirtied = event.write_ids; // make sure to dirty data we wrote from a past execution that might not be written this time
        //event.write_ids = {};
        let new_write_ids = {};
        event.run(this);
        // Incorporate edited values fetched with get into the timeline instants
        for(let read_id in this.get_instances){
            event.read_ids[read_id] = true;
            if((this.get_instances[read_id] && // object was edited
                this.get_instances[read_id].hash() != this.instants[read_id][this.instant_read_index[read_id]].obj.hash())
                || (event instanceof DeleteObject)){ // object was deleted
                new_write_ids[read_id] = true;
                //Delete all instants after edited one
                this.instants[read_id].splice(this.instant_read_index[read_id]+1, this.instants[read_id].length);
                //Add new edit to the end of instants at this time
                this.instants[read_id].push({time:this.executed_time + Timeline.event_write_delay, obj:this.get_instances[read_id]});
                data_dirtied[read_id] = true; // dirty all IDs we edited this time
            }
        }

        // Clear out previously written data that is no longer written by this event
        if(!(event instanceof AddObject)){
            for(let previous_write_id in event.write_ids){
                if(! (previous_write_id in new_write_ids)){
                    // Fetch the value to adjust the pointer in case it wasn't read bythe event rerun
                    let value = this.getInstant(previous_write_id, event.time);
                    //Delete all instants after and including previously edited one
                    this.instants[previous_write_id].splice(this.instant_read_index[previous_write_id]+1, this.instants[previous_write_id].length);
                    data_dirtied[previous_write_id] = true; // dirty the newly unmodified data
                }
            }
            event.write_ids = new_write_ids;
        }

        //Delete all events spawned by a previous run of this event
        Timeline.removed_spawners.clear();
        Timeline.removed_spawners.add(this.executing_hash);
        for(let e = this.next_execute ; e < this.events.length;e++){ // TODO could probably save this and avoid a walk over all future events
            if(this.events[e].just_spawned){ // skip removal if we just made it
                this.events[e].just_spawned = undefined ; 
            }else if(Timeline.removed_spawners.contains(this.events[e].spawned_by)){
                Timeline.removed_spawners.add(this.events[e].hash); // remove events spawned by events spawned by reexecuted event ad infinitum
                // remove any data writes these removed events made
                for(let previous_write_id in this.events[e].write_ids){
                    // Fetch the value to adjust the pointer in case it wasn't read by the event rerun
                    let value = this.getInstant(previous_write_id, this.events[e].time);
                    //Delete all instants after and including previously edited one
                    if(this.instants[previous_write_id]){ // TODO why does this sometimes happen?
                        this.instants[previous_write_id].splice(this.instant_read_index[previous_write_id]+1, this.instants[previous_write_id].length);
                    }
                    data_dirtied[previous_write_id] = true; // dirty the newly unmodified data
                }
                
                if(this.events[e] instanceof AddObject){ // AddObject breaks the pattern and requires special logic to undo :(
                    // Can't actually delete or empty allocation since it can still be referenced so we set the object to null but leave the time
                    this.instants[this.events[e].parameters.ID][0].obj = null;
                }

                delete this.event_hashes[this.events[e].hash];
                this.events.splice(e,1) ;
                e--;
            }
        }

        // Mark incomplete all events after this one that read any values that might have changed
        let dirtied_array = Object.keys(data_dirtied);
        for(let e = this.next_execute ; e < this.events.length;e++){
            if(this.events[e].done){ // Don't check events already dirtied
                let read = this.events[e].read_ids ;
                for(let dirtied_id of dirtied_array){
                    if(read[dirtied_id]){
                        this.events[e].done = false; // dirty if read any of the (potentially) edited values
                        break ;
                    }
                }
            }
        }
        
        event.done = true ;
        this.executing_hash = undefined;
        return true;
    }

    static event_hashes_sent = 0 ;
    static sent = new IntHashSet() ;
    // Returns hash information to detect differences in base state and the event queue
    getHashData(base_time){
        //TODO this could be a lot faster
        let base_hashes = {};
        for(let id in this.instants){
            let obj = this.getInstant(id, base_time);
            if(obj != null){ // can happen if the first instant is after base_time
                base_hashes[id] = obj.hash() ;
            }
        }
        let event_hashes = [];
        Timeline.sent.clear();
        for(let k = 0; k < this.events.length; k++){
            // skip events generated by other events we're sending (update generation has logic to skip these as well)
            if(this.events[k].time > base_time && !Timeline.sent.contains(this.events[k].spawned_by)){
                event_hashes.push(this.events[k].hash);
                Timeline.event_hashes_sent++;
                Timeline.sent.add(this.events[k].hash);
            }
        }

        return {base_time:base_time, current_time: this.current_time, base:base_hashes, events: event_hashes};
    }

    synchronize(other_hashdata, my_update, allow_base_change){
        this.applyUpdate(my_update, allow_base_change);
        let base_time = this.current_time - Timeline.sync_base_age ;
        let other_update = this.getUpdateFor(other_hashdata, base_time);
        return {update:other_update, hash_data:this.getHashData(base_time)};
    }


    static has_event_hash = new IntHashSet();
    // Compare the hashes of the base state and event queue of an external timeline and build a packet to bring it into sync with this timeline
    getUpdateFor(other_hash_data, base_time){
        let event_updates = [];
        Timeline.has_event_hash.clear();
        for(let k=0;k<other_hash_data.events.length; k++){
            Timeline.has_event_hash.add(other_hash_data.events[k]);
        }
        for(let k = 0; k < this.events.length; k++){
            if(this.events[k].time >= base_time){
                // Don't send if they have it or if they have the event that spawned it
                if(!Timeline.has_event_hash.contains(this.events[k].hash) && !Timeline.has_event_hash.contains(this.events[k].spawned_by)){
                    event_updates.push(this.events[k].serial);
                }
                // Don't send events spawned by events spawned by events the server has ad infinitum
                Timeline.has_event_hash.add(this.events[k].hash); 
            }
        }
        let obj_updates = {};
        for(let id in this.instants){
            let base_obj = this.getInstant(id, base_time) ;
            if(base_obj != null && base_obj.hash() != other_hash_data.base[id]){
                obj_updates[id] = {type:base_obj.constructor.name, time:this.last_instant_time, serial:base_obj.serialize()} ;
            }else if(base_obj == null && other_hash_data.base[id]){ // if nulled out but other still has it
                obj_updates[id] = {time:this.last_instant_time} ; // send update of just time
            }
        }
        return {base_time: base_time, current_time: this.current_time, events:event_updates, base:obj_updates} ;
    }

    // Apply an update to the event queue and/or base state 
    // Note: the server should not allow external updates to its base state
    applyUpdate(update, allow_base_change = true){

        for(let k = 0 ; k < update.events.length; k++){
            let hash = TEvent.hashSerial(update.events[k]) ;
            if(!this.event_hashes[hash]){ // Don't add duplicate events sent from server
                this.addEvent(TEvent.getEventBySerialized(update.events[k], hash)) ;
            }
        }
        if(allow_base_change){
            let data_dirtied = {} ;
            this.get_instances = {} ;
            // Base update follows same logic as event rollback data updates
            for(let read_id in update.base){
                let obj = this.getInstant(read_id, update.base[read_id].time);
                if(!(update.base[read_id].serial) && obj != null){ // if update is sending a deletion to something we have
                    this.instants[read_id].splice(this.instant_read_index[read_id]+1, this.instants[read_id].length);
                    //Add new null to the end of instants at this time
                    this.instants[read_id].push({time:update.base[read_id].time, obj:null});
                }else if(update.base[read_id].serial && obj == null){ // update is adding new object we don't currently have
                    obj = TObject.getObjectBySerialized(update.base[read_id].type, read_id, update.base[read_id].serial) ;
                    this.instant_read_index[read_id] = 0 ;
                    this.instants[obj.ID] = [{time:update.base[read_id].time, obj:obj}] ;
                }else if(obj && obj.hash()!= TObject.hashSerial(update.base[read_id].serial)){ // update is a change to something w have
                    obj.set(update.base[read_id].serial);
                    //Delete all instants after edited one
                    this.instants[read_id].splice(this.instant_read_index[read_id]+1, this.instants[read_id].length);
                    //Add new edit to the end of instants at this time
                    this.instants[read_id].push({time:update.base[read_id].time, obj:obj});
                }
                data_dirtied[read_id] = true; // dirty all IDs we edited this time
            }

             // Mark incomplete all events that read any values that might have changed
            for(let e = 0 ; e < this.events.length;e++){
                if(this.events[e].done && this.events[e].time >= update.time){ // Don't check events already dirtied or before the change
                    let read = this.events[e].read_ids ;
                    for(let dirtied_id in data_dirtied){
                        if(read[dirtied_id]){
                            this.events[e].done = false; // dirty if read any of the (potentially) edited values
                            this.next_execute = Math.min(e, this.next_execute); // rollback the execution pointer if we edited data that could change an event result
                            break ;
                        }
                    }
                }
            }

            // Sync clock to server time + half round trip latency
            if(this.last_update_current_time){
                this.ping = update.current_time - this.last_update_current_time;
                let target_time = update.current_time + this.ping/2;
                // If we're totally out of sync then snap back into sync
                if(Math.abs(target_time-this.current_time) > Timeline.sync_base_age){
                    this.current_time = target_time ;
                    this.executeToTime(this.current_time + Timeline.execute_buffer);
                    this.advanceBaseTime(this.current_time - Timeline.base_age);
                }else{ // if we're only a little out of sync then gradually adjust clock to stay synced
                    this.current_time = this.current_time * (1-Timeline.smooth_clock_sync_rate) + target_time * Timeline.smooth_clock_sync_rate;
                }
            }
            this.last_update_current_time = update.current_time;
        }
    }

    

     // advances the base time, deleting all but one instant before base_time for each variable
    // Does not execute events, so new_base_time cannot exceed executed_time
    advanceBaseTime(new_base_time){
        for(let id in this.instants){
            // Find first index past new_base time
            let i = 0 ;
            while(i < this.instants[id].length && this.instants[id][i].time <= new_base_time){
                i++;
            }
            let to_delete = i - 1 ;
            if(to_delete > 0){
                this.instants[id].splice(0,to_delete);  
                this.instant_read_index[id] -= to_delete ;
            }
            if(this.instants[id].length == 1 && !(this.instants[id][0].obj)){
                delete this.instants[id] ; // If last remaining object is a deletion marker, remove from instants entirely
            }
        }

        // Delete all events that occur up to the new base data (we can now only make edits to the timeline after this point)
        let i = 0 ;
        while(i < this.events.length && this.events[i].time <= new_base_time){
            i++;
        }
        let to_delete = i ;
        if(to_delete > 0){
            // delete the hashes
            for(let k=0;k<to_delete;k++){
                let hash = this.events[this.events.length - k-1].hash ;
                delete this.event_hashes[hash];
            }
            // Delete the old events
            this.events.splice(0,to_delete); 
            // Adjust execution pointer
            this.next_execute -= to_delete ;
            // If we get base objects past where we've executed then we want to skip execution ahead to what wasn't deleted
            if(this.next_execute < 0){
                this.next_execute = 0;
            }
        }
    }

    run(interval = undefined){
        let time = new Date().getTime() ;
        if(!interval){
            interval = (time-this.last_run_time)/1000.0;
        }
        this.last_run_time = time ;
        this.current_time += interval;
        this.advanceBaseTime(this.current_time - Timeline.base_age);
        this.executeToTime(this.current_time + Timeline.execute_buffer);
        
    }

    // execute events and compute object instants up to new executed_time
    executeToTime(new_executed_time){
        let has_more = true;
        while(has_more){
            has_more = this.executeNext(new_executed_time);
        }
    }


    getNextID(){
        if(this.executing_hash){ // if done inside another event
            this.next_system_id++;
            return this.next_system_id ;
        }
        //if we don't have a block assigned yet
        if(this.assigned_id_block < 0){
            let max_id = -1 ;
            for(let id in this.instants){
                max_id = Math.max(id, max_id);
            }
            this.assigned_id_block = max_id + Timeline.id_block_size; // out block is block size past highest allocated item
            this.next_free_id = this.assigned_id_block;
        }
        // ID could be taken if we're looping and some objects have been deleted but others haven't
        while(this.next_free_id in this.instants){ // TODO could infinite loop if all IDs in block are taken
            this.next_free_id++;
            if(this.next_free_id >= this.assigned_id_block + Timeline.id_block_size){ // wrap around when we get to the end of the block
                this.next_free_id = this.assigned_id_block;
            }
        }
        return this.next_free_id;
    }

    getAllIDs(){
        let ids = [];
        for(let id in this.instants){
            ids.push(id);
        }
        return ids ;
    }

    setDefaultEventDelay(delay){
        this.default_event_delay = delay ;
    }

    setObservedOffset(offset, id = undefined){
        if(id){
            this.observe_offset[id] = offset ;
        }else{
            this.default_observe_offset = offset;
        }
    }

    // Returns a copy of the given id object at the proper time for visualizing
    // If enabled Interpolates from last interpolated object from this call using overridden TObject.interpolateFrom
    getObserved(id, interpolate = false){
        let fetch_time = this.current_time + (id in this.observe_offset ? this.observe_offset[id] : this.default_observe_offset) ;
        // If fetching at the same time as previously then pull from interpolation cache
        if(fetch_time == this.last_observed_time[id]){
            return this.last_observed[id] ;
        }
        let fetched = this.getInstant(id, fetch_time);
        if(fetched && interpolate && fetched.interpolateFrom){ // interpolate if possible
            this.last_observed[id] = fetched.interpolateFrom(this.last_observed[id], this.last_observed_time[id], fetch_time);
            this.last_observed_time[id] = fetch_time ;
            return this.last_observed[id];
        }else{ // return raw fetched data if no cache and can't interpolate
            this.last_observed[id] = fetched;
            this.last_observed_time[id] = fetch_time ;
            return fetched ;
        }
    }
}