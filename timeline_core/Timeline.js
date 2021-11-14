// The core execution timeline used for synchronization

class Timeline{
    base_state ; // Hash List of base state
    base_time ; // Time base state snapshot was taken

    events ; // Events after base_time

    current_time; // time up to which instants have been computed
    instants ; // map<id, vector<{time,obj}> of value of each object immediately after each change for time between base_time and current_time
    instant_read_index ; // map<id,int> points to position in instant sub vectors last read (starting from here allows fast access for temporally coherent reads)

    get_instances ; // a temporary variable to hold references to objects returned by get

    constructor(){

    }

    // gets a copy of an object's value at the current time
    // logs the access to reads
    get(id){

        if(id in get_instances){
            return get_instances[id];
        }

        // Walk the pointer until it points at the last value before the current_time
        while(instant_read_index[id] > 0 && instants[id][instant_read_index[id]].time > current_time){
            instant_read_index[id]--;
        }
        while(instant_read_index[id] < instants[id].length - 1 && instants[id][instant_read_index[id]+1].time < current_time){
            instant_read_index[id]++;
        }

        get_instances[id] = copy(instants[id][instant_read_index[id]]) ;

    }


    execute(event){
        current_time = event.time ;
        get_instances = {};
        event.run();
        event.read_ids = [];
        for( id in get_instances){
            event.read_ids.push(id);
            if(get_instances[id].obj != instants[id][instant_read_index[id]].obj){ // object was edited
                // TODO Delete all instants after read one
                //TODO Add new edit to the end of instants
                //TODO  Dirty all events that have read this value after this time
            }
        }

    }

    // Returns hash information to detect differences in base state and the event queue
    getHashData(){
        //TODO
    }

    synchronize(my_update, other_hashdata){
        this.applyUpdate(my_update);
        other_update = this.getUpdateFor(other_hashdata);
        return [other_update, this.getHashData()]
    }

    // Apply an update to the base state and/or event queue
    // Note: the server should not allow external updates to its base state
    applyUpdate(update){

    }

    // Compare the hashes ofthe base state and event queue of an external timeline and build a packet to bring it into sync with this timeline
    getUpdateFor(other_hashdata){

    }

     // advances the base time, deleting all but one instant before base_time for each variable
    // Does not execute events, so new_base_time cannot exceed current_time
    advanceBaseTime(new_base_time){
        //TODO
    }

    // execute events and compute object instants up to new current_time
    advanceCurrentTime(new_current_time){

    }
}