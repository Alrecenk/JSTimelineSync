class MovePlayer extends TEvent{

    constructor(time, player_id, interval){
        super(time);
        this.parameters = {player_id:player_id, interval:interval };
    }

    run(timeline){
        let player = timeline.get(this.parameters.player_id);
        player.x += player.vx * this.parameters.interval;
        player.y += player.vy * this.parameters.interval;
        timeline.addEvent(new MovePlayer(this.time+this.parameters.interval, this.parameters.player_id, this.parameters.interval));
        //console.log("Event("+this.time+"): Moved player " + this.parameters.player_id + "interval");
    }
}