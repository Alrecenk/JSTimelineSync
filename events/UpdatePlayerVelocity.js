
class UpdatePlayerVelocity extends TEvent{
    
    constructor(time, player_id, vx, vy){
        this.time = time;
        params = {playuer_id:player_id, vx,:vx, vy:vy};
    }

    run(timeline){
        let player = timeline.get(params.player_id);
        player.vx = params.vx;
        player.vy = params.vy;
    }
}