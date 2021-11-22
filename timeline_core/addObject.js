//All edits to objects have to take place as events so adding objects to the timeline must also be an event.
// You can use addObject on the timelines and it will create this for you.
class addObject extends TEvent{

    constructor(time, params){
        super(time);
        this.parameters = params;
    }

    run(timeline){
        let obj = TObject.getObjectBySerialized(this.parameters.type, this.parameters.ID, this.parameters.serial) ;
        timeline.instants[obj.ID] = [{time:this.time, obj:obj}];
        timeline.instant_read_index[obj.ID] = 0;
        this.write_ids = {};
        this.write_ids[obj.ID] = true; 
        this.read_ids = {};
        this.read_ids[obj.ID] = true;  // TODO unclear how this route around the core algorithm interacts with rollback, could be a bug source

        //console.log(" Event("+this.time+"): Added " + this.parameters.type + " to ID " + obj.ID);
    }
}