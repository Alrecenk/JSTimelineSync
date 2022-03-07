class Fire extends TEvent{
    run(timeline){
        //console.log("moveplayer " + this.parameters.player_id +" : " + this.time);
        let player = timeline.get(this.parameters.player_id);

        if(!(player instanceof Player)){
            return ;
        }

        // can't fire if fired too recently
        if(this.time < player.last_fire_time + Player.fire_delay){
            return ;
        }

        player.last_fire_time = this.time;
        let b = new Bullet();
        b.x = player.x;
        b.y = player.y;

        let dx = this.parameters.tx - player.x;
        let dy = this.parameters.ty - player.y;
        let d = Math.sqrt(dx*dx + dy*dy);
        let n = Bullet.speed/d ;
        b.vx = dx*n;
        b.vy = dy*n;
        b.shooter_id = this.parameters.player_id ;
        b.birth_time = this.time ;
        let bullet_ID = timeline.getNextID() ; // TODO fix possible race condition on getNextID being called by many clients at the same time
        timeline.addObject(b, bullet_ID);

        timeline.addEvent(new MoveBullet({bullet_id:bullet_ID, interval:this.parameters.interval }, this.time+this.parameters.interval));

    }
}