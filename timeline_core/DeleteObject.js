//Special event for deleting an object
// You can use deleteObject on the timeline and it will create this for you.
class DeleteObject extends TEvent{

    constructor(time, params){
        super(time);
        this.parameters = params;
    }

    run(timeline){
        let ID = this.parameters.ID ;
        // fetch the object to get the correct pointer for execute to place the value
        let obj = timeline.get(ID);
        if(obj!=null){
            //console.log("deleting " + ID + " with event.");
            // directly set the reference to the edited value to null to delete it in the timeline
            timeline.get_instances[ID] = null ;
        }else{
            console.error("Deleting object which doesn't exist at the time it is being deleted!");
        }
    }
}