//All edits to objects have to take place in events so adding objects to the timeline must also be an event.
// You can use addObject on the timeline and it will create this for you.
class AddObject extends TEvent{

    run(timeline){
        let obj = TObject.getObjectBySerialized(this.parameters.type, this.parameters.ID, this.parameters.serial) ;
        timeline.instants[obj.ID] = [{time:this.time + Timeline.event_write_delay, obj:obj}];
        timeline.instant_read_index[obj.ID] = 0;
        this.write_ids = {};
        this.write_ids[obj.ID] = true; 
        this.read_ids = {};
        this.read_ids[obj.ID] = true;  // TODO unclear how this route around the core algorithm interacts with rollback, could be a bug source
    }
}
