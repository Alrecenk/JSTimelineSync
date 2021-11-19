// The core execution timeline used for synchronization

class Timeline{
    //base_state ; // Hash List of base state
    //base_time ; // Time base state snapshot was taken

    events ; // Events after base_time

    current_time; 
    next_execute = 0 ;
    instants ; // map<id, vector<{time,obj}> of value of each object immediately after each change for time between base_time and current_time
    instant_read_index ; // map<id,int> points to position in instant sub vectors last read (starting from here allows fast access for temporally coherent reads)

    get_instances ; // a temporary variable to hold references to objects returned by get

    constructor(time){
        this.current_time = time ;
        //this.base_time = time;
        this.instants = {};
        this.instant_read_index = {};
        this.events = []; // TODO use a more efficient structure for random insert and sorted access (like a tree)
        //this.base_state = new HashList();
    }

    // returns an editable copy of an object's value at the current time
    // logs the access to reads when occuring inside an event run
    get(id){
        return this.getInstant(id, this.current_time)
    }

    // returns an editable copy of an object's value at the given time
    // logs the access to reads when occuring inside an event run (and will return the cached value if multiple accesses occur in an event)
    getInstant(id, time){
        //console.log(this.instants);
        if(id in this.get_instances){
            return this.get_instances[id];
        }
        if(!(id in this.instants)){
            return null ;
        }
        // Walk the pointer until it points at the last value before the current_time
        while(this.instant_read_index[id] > 0 && this.instants[id][this.instant_read_index[id]].time > time){
            this.instant_read_index[id]--;
        }
        while(this.instant_read_index[id] < this.instants[id].length - 1 && this.instants[id][this.instant_read_index[id]+1].time < time){
            this.instant_read_index[id]++;
        }

        
        this.get_instances[id] = TObject.copy(this.instants[id][this.instant_read_index[id]].obj) ;
        return this.get_instances[id]
    }

    // Adds a new event
    addEvent(new_event){
        // TODO make sure events at the ame time have their order set deterministically(maybe by hash) not by whenthe ywere added.
        let place = this.events.length;
        while(place > 0 && this.events[place-1].time > new_event.time){
            place--;
        }
        this.events.splice(place,0,new_event);
        this.next_execute = Math.min(place,this.next_execute);
        //console.log(this.events);
        //TODO track events spawned from other events so they can be deleted if a rerun doesn't spawn them
    }

    // Add an object
    addObject(obj, time){
        this.addEvent(new addObject(time, {type : obj.constructor.name, serial:obj.serialize()})) ;
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
        this.current_time = event.time ;
        this.get_instances = {};
        event.run(this);
        event.read_ids = {};
        let data_dirtied = event.write_ids; // make sure to dirty data we wrote from a past execution that might not be written this time
        event.write_ids = {};
        //TODO track spawned events so they can be removed if an event reruns differently!
        for(let read_id in this.get_instances){
            event.read_ids[read_id] = true;
            if(this.get_instances[read_id].hash() != this.instants[read_id][this.instant_read_index[read_id]].obj.last_hash){ // object was edited
                event.write_ids[read_id] = true;
                //Delete all instants after edited one
                this.instants[read_id].splice(this.instant_read_index[read_id], this.instants[read_id].length);
                //Add new edit to the end of instants at this time
                this.instants[read_id].push({time:this.current_time, obj:this.get_instances[read_id]});

                data_dirtied[read_id] = true; // dirty all IDs we edited this time
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
        
        return true;
    }

    // Returns hash information to detect differences in base state and the event queue
    getHashData(snapshot_time){
        //TODO this could be a lot faster
        let base_hashes = {};
        for(let id in this.instants){
            base_hashes[id] = this.getInstant(id, snapshot_time).hash() ;
        }
        let event_hashes = [];
        for(let k = 0; k < this.events.length; k++){
            if(this.events[k].time > snapshot_time){
                event_hashes.push(this.events[k].hash());
            }
        }

        return {time:snapshot_time, base:base_hashes, events: event_hashes};
    }

    synchronize(my_update, other_hashdata){
        this.applyUpdate(my_update);
        other_update = this.getUpdateFor(other_hashdata);
        return [other_update, this.getHashData()]
    }


    // Compare the hashes of the base state and event queue of an external timeline and build a packet to bring it into sync with this timeline
    getUpdateFor(other_hash_data){
        let event_updates = [];
        let snapshot_time = other_hash_data.time ;
        let has_event_hash = {};
        //TODO this could be a lot faster
        for(let k=0;k<other_hash_data.events; k++){
            has_event_hash[other_hash_data.events[k]] = true;
        }
        for(let k = 0; k < this.events.length; k++){
            if(this.events[k].time > snapshot_time){
                if(!has_event_hash[this.events[k].hash()]){
                    event_updates.push(this.events[k].serialize()); // TODO duplicate serialize
                }
            }
        }

        let obj_updates = {};
        for(let id in this.instants){
            let base_obj = this.getInstant(id, snapshot_time) ;
            if(base_obj != null && base_obj.hash() != other_hash_data.base[id]){
                obj_updates[id] = {type:base_obj.constructor.name, serial:base_obj.serialize()} ; // TODO duplicate serialize
            }
        }
        return {time: snapshot_time, events:event_updates, base:obj_updates} ;
    }

    // Apply an update to the event queue and/or base state 
    // Note: the server should not allow external updates to its base state
    applyUpdate(update, allow_base_change){

        for(let k = 0 ; k < update.events.length; k++){ 
            // TODO check if event has been added since the request was sent to avoid duplicate events
            this.addEvent(TEvent.getEventBySerialized(update.events[k])) ;
        }
        if(allow_base_change){
            let data_dirtied = {} ;
            this.get_instances = {};
            // Base update follows same logic as event rolback data updates
            for(let read_id in update.base){
                let obj = this.get(read_id, update.time);
                if(obj == null){
                    obj = TObject.getObjectBySerialized(update.base[read_id].type, read_id, update.base[read_id].serial) ;
                    this.instant_read_index[read_id] = 0 ;
                    this.instants[obj.ID] = [] ;
                }else{
                    obj.set(update.base[read_id]);
                    
                }
                
                //Delete all instants after edited one
                this.instants[read_id].splice(this.instant_read_index[read_id], this.instants[read_id].length);
                
                //Add new edit to the end of instants at this time
                this.instants[read_id].push({time:update.time, obj:obj});

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
        }
    }

     // advances the base time, deleting all but one instant before base_time for each variable
    // Does not execute events, so new_base_time cannot exceed current_time
    advanceBaseTime(new_base_time){
        for(let id in this.instants){
            
            // Find first index past new_base time
            let i = 0 ;
            while(i < this.instants.length && this.instants[id][i].time < new_base_time){
                i++;
            }
            let to_delete = i - 2 ;
            //console.log("deleting: " + to_delete + " from " + this.instants[id].length);
            if(to_delete > 0){
                this.instants[id].splice(0,to_delete);  
            }
        }

        let i = 0 ;
        while(i < this.events.length && this.events[i].time < new_base_time){
            i++;
        }
        let to_delete = i ;
        if(to_delete > 0){
            this.events.splice(0,to_delete);  
            this.next_execute -= to_delete ;
        }

        this.base_time = new_base_time ;

        //TODO update hash data for base state atthis point?
    }

    // execute events and compute object instants up to new current_time
    executeToTime(new_current_time){
        let has_more = true;
        while(has_more){
            has_more = this.executeNext(new_current_time);
        }
    }

    getNextID(){
        //TODO should be more efficient and network race condition tolerant somehow
        let max_id = -1 ;
        for(let id in this.instants){
            max_id = Math.max(id, max_id);
        }
        //console.log("next id : " + (max_id+1));
        return max_id+1;
    }

    getAllIDs(){
        //console.log(this.instants);
        let ids =[];
        for(let id in this.instants){
            ids.push(id);
        }
        return ids ;
    }
}