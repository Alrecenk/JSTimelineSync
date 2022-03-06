// An event for a player to check in to show it is still connected
class Heartbeat extends TEvent{
    run(timeline){
        let world = timeline.get(World.ID);
        if(world == null){
            console.log("world id:" + World.ID);
            console.log(" null world wtr?");
            console.log("Time: " + this.time);
            console.log(JSON.stringify(timeline.instants[World.ID]));
        }else{
            world.heartbeat[this.parameters.player_id] = this.time;
        }
    }
}