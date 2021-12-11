// A Timeline event
//Override this class to implement timeline syncable events

class TEvent{
    time; // time event occurs
    parameters ; // A JSON friendly representation of the paramters to run this event
    done = false ;

    read_ids = {};
    write_ids = {};

    serial ;
    hash ;

    constructor(params, time){
        this.time = time;
        this.parameters = params;
    }

    computeSerial(serial = undefined, hash = undefined){
        this.serial = serial ? serial : this.serialize();
        this.hash = hash ? hash : TEvent.hashSerial(this.serial);
    }

    serialize(){
        return JSON.stringify({event:this.constructor.name, time:this.time, spawned_by:this.spawned_by, parameters:this.parameters});
    }

    run(timeline){
        console.log("Run called on abstract event. You need to override run in your event class!") ;
        console.log(this);
    }

    // Makes it possible to initialize an object by the string name of its class
    static getEventBySerialized(serial, hash = undefined){
        let p = JSON.parse(serial);
        let ev ;
        //TODO don't use eval
        let es = "ev = new "+p.event+"(" + JSON.stringify(p.parameters)  +"," + p.time +");" ;
        eval(es); // TODO got to be a better way than eval
        ev.spawned_by = p.spawned_by;
        ev.computeSerial(serial, hash);
        return ev ;
    }

    static hashSerial(serial){
        return serial.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) ;
    }

}
