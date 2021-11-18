// A Timeline event
//Override this class to implement timeline syncable events

class TEvent{
    time; // time event occurs
    parameters ; // A JSON friendly representation of the paramters to run this event
    done = false ;

    read_ids = {};
    write_ids = {};

    constructor(time){
        this.time = time;
    }

    serialize(){
        return JSON.stringify({event:this.constructor.name, time:this.time, paramters:parameters});
    }

    run(timeline){
        console.log("Run called on abstract event. You need to override run in your event class!") ;
        console.log(this);
    }

}