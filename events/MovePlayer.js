class MovePlayer extends TEvent{
    run(timeline){
        let player = timeline.get(this.parameters.player_id);
        if(!(player instanceof Player)){
            console.error("Move player event can't find player!");
            return ;
        }
        player.x += player.vx * this.parameters.interval;
        player.y += player.vy * this.parameters.interval;
        timeline.addEvent(new MovePlayer(this.time+this.parameters.interval, {player_id:this.parameters.player_id, interval:this.parameters.interval }));
    }
}