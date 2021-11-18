
class UpdatePlayerVelocity extends TEvent{
    
    constructor(time, player_id, vx, vy){
        super(time);
        this.parameters = {player_id:player_id, vx:vx, vy:vy};
    }

    run(timeline){
        let player = timeline.get(this.parameters.player_id);
        player.vx = this.parameters.vx;
        player.vy = this.parameters.vy;
    }
}