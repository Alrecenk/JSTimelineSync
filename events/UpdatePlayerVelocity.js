class UpdatePlayerVelocity extends TEvent{
    
    /*constructor(time, params){
        super(time);
        this.parameters = params;
    }*/

    run(timeline){
        let player = timeline.get(this.parameters.player_id);
        player.vx = this.parameters.vx;
        player.vy = this.parameters.vy;
    }
}