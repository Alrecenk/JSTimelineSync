//Special event for deleting an object
// You can use deleteObject on the timeline and it will create this for you.
class DeleteObject extends TEvent{
    run(timeline){
        //console.log(this);
        let ID = this.parameters.ID ;
        // fetch the object to get the correct pointer for execute to place the value
        let obj = timeline.get(ID);
        if(obj!=null){
            // directly set the reference to the edited value to null to delete it in the timeline
            timeline.get_instances[ID] = null ;
        }else{
            console.error("Deleting object which doesn't exist at the time it is being deleted!");
            console.log("Deletion time:" + this.time + " ID:" + ID);
            console.log(timeline.instants[ID]);
            console.log("--------------------------------------------");
            
        }
    }
}