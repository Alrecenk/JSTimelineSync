class MovePlayer extends TEvent{

    constructor(time, params){
        super(time);
        this.parameters = params;
    }

    run(timeline){
        let player = timeline.get(this.parameters.player_id);
        player.x += player.vx * this.parameters.interval;
        player.y += player.vy * this.parameters.interval;
        timeline.addEvent(new MovePlayer(this.time+this.parameters.interval, {player_id:this.parameters.player_id, interval:this.parameters.interval }));
        //console.log("Event("+this.time+"): Moved player " + this.parameters.player_id + "interval");
    }
}