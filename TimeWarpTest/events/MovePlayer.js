class MovePlayer extends TEvent{
    run(timeline){
        //console.log("moveplayer " + this.parameters.player_id +" : " + this.time);
        let player = timeline.get(this.parameters.player_id);
        if(!(player instanceof Player)){
            return ;
        }

        if(player.moving){
            let dx = player.tx - player.x;
            let dy = player.ty - player.y;
            let d = Math.sqrt(dx*dx + dy*dy);
            if(d < Player.speed*this.parameters.interval){
                player.x = player.tx ;
                player.y = player.ty ;
                player.moving = false;
            }else{
                let n = Player.speed*this.parameters.interval/d ;
                player.x += dx*n;
                player.y += dy*n;
            }
        }

        timeline.addEvent(new MovePlayer({player_id:this.parameters.player_id, interval:this.parameters.interval }, this.time+this.parameters.interval));
    }
}