class MovePlayer extends TEvent{
    run(timeline){
        //console.log("moveplayer " + this.parameters.player_id +" : " + this.time);
        let player = timeline.get(this.parameters.player_id);
        if(!(player instanceof Player)){
            //console.log("null player");
            return ;
        }
        player.x += player.vx * this.parameters.interval;
        player.y += player.vy * this.parameters.interval;
        //console.log(player);
        timeline.addEvent(new MovePlayer(this.time+this.parameters.interval, {player_id:this.parameters.player_id, interval:this.parameters.interval }));
    }
}