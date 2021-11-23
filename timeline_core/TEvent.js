// A Timeline event
//Override this class to implement timeline syncable events

class TEvent{
    time; // time event occurs
    parameters ; // A JSON friendly representation of the paramters to run this event
    done = false ;

    read_ids = {};
    write_ids = {};
    spawned_by = undefined; // The hash of the event that created this event if it was created by another event

    constructor(time, params){
        this.time = time;
        this.parameters = params;
    }

    serialize(){
        return JSON.stringify({event:this.constructor.name, time:this.time, spawned_by:this.spawned_by, parameters:this.parameters});
    }

    hash(){
        let serial = this.serialize();
        //TODO is this hash actually any good here?
        this.last_hash = TEvent.hashSerial(serial)              
        return this.last_hash ;
    }

    run(timeline){
        console.log("Run called on abstract event. You need to override run in your event class!") ;
        console.log(this);
    }

    // Makes it possible to initialize an object by the string name of its class
    static getEventBySerialized(serial){
        let p = JSON.parse(serial);
        let ev ;
        //TODO this is so bad
        let es = "ev = new "+p.event+"(" + p.time +", " + JSON.stringify(p.parameters) +");" ;
        //console.log(es);
        eval(es); // TODO got to be a better way also every class needs an empty constructor for this to work
        ev.spawned_by = p.spawned_by;
        return ev ;
    }

    static hashSerial(serial){
        return serial.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0); ;
    }

}
