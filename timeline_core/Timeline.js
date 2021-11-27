
// The core execution timeline used for synchronization
class Timeline{

    events ; // Events after base time
    current_time;
    executed_time; 
    next_execute = 0 ;
    instants ; // map<id, vector<{time,obj}> of value of each object immediately after each change for time between base time and executed_time
    instant_read_index ; // map<id,int> points to position in instant sub vectors last read (starting from here allows fast access for temporally coherent reads)
    last_instant_time ; // Time of writing of the last instant read with get or getInstant
    get_instances = [] ; // a temporary variable to hold references to objects returned by get
    events_spawned = undefined; // A temporary variable to track what events are spawned by another running event
    last_run_time ; // the real clock time in milliseconds of the last time the run method was called
    last_update_current_time ; // the current_time of the last update received used to measure game time latency
    latency=-1;
    client = undefined; // A link to a TClient object if this timeline is attached to one
    aggressive_event_sending = true; // Whether user generated events are sent to the server aggressively

    static sync_base_age = 1 ; // time that synced base time is behind current time
    static base_age = 2; // Amount of history to keep on the timeline
    static execute_buffer = 0.5 ; // How far ahead of the current time to predictively execute instructions
    static smooth_clock_sync_rate = 0.2; // how fast to adjust client clock time when it's close to synchronized
    
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
        // TODO make sure events at the same time have their order set deterministically(maybe by hash) not by when they were added.
        let place = this.events.length;
        while(place > 0 && this.events[place-1].time > new_event.time){
            place--;
        }
        this.events.splice(place,0,new_event);
        this.next_execute = Math.min(place,this.next_execute);
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
    }

    // Add an object
    addObject(obj, ID, time){
        this.addEvent(new addObject(time, {type : obj.constructor.name, ID: ID, serial:obj.serialize()})) ;
    }

    // Executes the next event if it is not done and occurs before the given time
    // Returns whether there are more events to execute
    executeNext(new_time){

        if(this.next_execute >= this.events.length || this.events[this.next_execute].time > new_time){
            return false;
        }

        let event = this.events[this.next_execute] ;
        this.next_execute++;
        if(event.done){ // This event has already been run and it didn't read anything that has been rolled back
            return true ;
        }
        this.executed_time = event.time ;
        this.get_instances = {};
        this.executing_hash = event.hash;
        event.run(this);
        event.read_ids = {};
        let data_dirtied = event.write_ids; // make sure to dirty data we wrote from a past execution that might not be written this time
        event.write_ids = {};
        // Incorporate edited values fetched with get into the timeline instants
        for(let read_id in this.get_instances){
            event.read_ids[read_id] = true;
            //TODO don't hard crash if an event attempts to read somthing that is null
            if(this.get_instances[read_id].hash() != this.instants[read_id][this.instant_read_index[read_id]].obj.last_hash){ // object was edited
                event.write_ids[read_id] = true;
                //Delete all instants after edited one
                this.instants[read_id].splice(this.instant_read_index[read_id]+1, this.instants[read_id].length);
                //Add new edit to the end of instants at this time
                this.instants[read_id].push({time:this.executed_time, obj:this.get_instances[read_id]});

                data_dirtied[read_id] = true; // dirty all IDs we edited this time
            }
        }

        //Delete all events spawned by a previous run of this event
        let removed_spawners = {};
        removed_spawners[this.executing_hash] = true;
        for(let e = this.next_execute ; e < this.events.length;e++){ // TODO could probably save this and avoid a walk over all future events
            if(this.events[e].just_spawned){ // skip removal if we just made it
                this.events[e].just_spawned = undefined ; 
            }else if(removed_spawners[this.events[e].spawned_by]){
                removed_spawners[this.events[e].hash] = true ; // remove events spawned by events spawned by reexecuted event ad infinitum
                this.events.splice(e,1) ;
                e--;
            }
        }

        // Mark incomplete all events after this one that read any values that might have changed
        for(let e = this.next_execute ; e < this.events.length;e++){
            if(this.events[e].done){ // Don't check events already dirtied
                let read = this.events[e].read_ids ;
                for(let dirtied_id in data_dirtied){
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
        for(let k = 0; k < this.events.length; k++){
            if(this.events[k].time > base_time){
                event_hashes.push(this.events[k].hash);
            }
        }

        return {base_time:base_time, current_time: this.current_time, base:base_hashes, events: event_hashes};
    }

    synchronize(other_hashdata, my_update, allow_base_change, base_time){
        this.applyUpdate(my_update, allow_base_change);
        let other_update = this.getUpdateFor(other_hashdata, base_time);
        return {update:other_update, hash_data:this.getHashData(base_time)};
    }


    // Compare the hashes of the base state and event queue of an external timeline and build a packet to bring it into sync with this timeline
    getUpdateFor(other_hash_data, base_time){
        let event_updates = [];
        let has_event_hash = {};
        //TODO this could be a lot faster
        for(let k=0;k<other_hash_data.events.length; k++){
            has_event_hash[other_hash_data.events[k]] = true;
        }
        //TODO we could be sending events that haven't been spawned yet but will be due to clock differences
        for(let k = 0; k < this.events.length; k++){
            if(this.events[k].time >= base_time){
                // Don't send if they have it or if they have the event that spawned it
                if(!has_event_hash[this.events[k].hash] && !has_event_hash[this.events[k].spawned_by]){
                    event_updates.push(this.events[k].serial);
                }
            }
        }

        let obj_updates = {};
        for(let id in this.instants){
            let base_obj = this.getInstant(id, base_time) ;
            if(base_obj != null && base_obj.hash() != other_hash_data.base[id]){
                obj_updates[id] = {type:base_obj.constructor.name, time:this.last_instant_time, serial:base_obj.serialize()} ;
            }
        }
        return {base_time: base_time, current_time: this.current_time, events:event_updates, base:obj_updates} ;
    }

    // Apply an update to the event queue and/or base state 
    // Note: the server should not allow external updates to its base state
    applyUpdate(update, allow_base_change = true){

        let event_hashes = {}; // TODO could precompute this map

        for(let k = 0; k < this.events.length; k++){
            event_hashes[this.events[k].hash] = true;
        }

        for(let k = 0 ; k < update.events.length; k++){
            let hash = TEvent.hashSerial(update.events[k]) ;
            if(!event_hashes[hash]){ // Don't add duplicate events sent from server
                this.addEvent(TEvent.getEventBySerialized(update.events[k], hash)) ;
            }
        }
        if(allow_base_change){
            let data_dirtied = {} ;
            this.get_instances = {} ;
            // Base update follows same logic as event rollback data updates
            for(let read_id in update.base){
                let obj = this.getInstant(read_id, update.base[read_id].time);
                if(obj == null){
                    obj = TObject.getObjectBySerialized(update.base[read_id].type, read_id, update.base[read_id].serial) ;
                    this.instant_read_index[read_id] = 0 ;
                    this.instants[obj.ID] = [{time:update.base[read_id].time, obj:obj}] ;
                }else if(obj.hash()!= TObject.hashSerial(update.base[read_id].serial)){
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
                this.latency = (update.current_time - this.last_update_current_time)*0.5;
                let target_time = update.current_time + this.latency;
                // If we're totally out of sync then snap back into sync
                if(Math.abs(target_time-this.current_time) > Timeline.sync_base_age){
                    this.current_time = target_time ;
                    this.executeToTime(this.current_time + Timeline.execute_buffer);
                    this.advanceBaseTime(this.current_time - Timeline.base_age);
                }else{ // if we're only a little out of sync then gradually adjust clock to stay synced
                    this.current_time = this.current_time * (1-Timeline.smooth_clock_sync_rate) + target_time * Timeline.smooth_clock_sync_rate;
                }
            }
        }
        this.last_update_current_time = update.current_time;
    }

    

     // advances the base time, deleting all but one instant before base_time for each variable
    // Does not execute events, so new_base_time cannot exceed executed_time
    advanceBaseTime(new_base_time){
        for(let id in this.instants){
            
            // Find first index past new_base time
            let i = 0 ;
            while(i < this.instants.length && this.instants[id][i].time <= new_base_time){
                i++;
            }
            let to_delete = i - 1 ;
            if(to_delete > 0){
                this.instants[id].splice(0,to_delete);  
            }
        }

        // Delete all events that occur up to the new base data (we can now only make edits to the timeline after this point)
        let i = 0 ;
        while(i < this.events.length && this.events[i].time <= new_base_time){
            i++;
        }
        let to_delete = i ;
        if(to_delete > 0){
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
        this.executeToTime(this.current_time + Timeline.execute_buffer);
        this.advanceBaseTime(this.current_time - Timeline.base_age);
    }

    // execute events and compute object instants up to new executed_time
    executeToTime(new_executed_time){
        let has_more = true;
        while(has_more){
            has_more = this.executeNext(new_executed_time);
        }
    }

    getNextID(){
        //TODO should be more efficient and network race condition tolerant somehow
        let max_id = -1 ;
        for(let id in this.instants){
            max_id = Math.max(id, max_id);
        }
        return max_id+1;
    }

    getAllIDs(){
        let ids = [];
        for(let id in this.instants){
            ids.push(id);
        }
        return ids ;
    }
}