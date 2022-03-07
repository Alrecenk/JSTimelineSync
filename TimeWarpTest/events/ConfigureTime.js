// An event to configure simulatd latency and time warp
class ConfigureTime extends TEvent{
    run(timeline){
        let world = timeline.get(World.ID);
        if(! (world instanceof World) ){
            console.log("Not a world!");
            console.log(world);
            return ;
        }
        world.max_info_speed = this.parameters.max_info_speed;
        world.send_delay = this.parameters.send_delay ;
    }
}