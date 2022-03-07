class MoveBullet extends TEvent{
    run(timeline){
        //console.log("moveplayer " + this.parameters.player_id +" : " + this.time);
        let bullet = timeline.get(this.parameters.bullet_id);
        if(!(bullet instanceof Bullet)){
            return ;
        }
        bullet.x += bullet.vx*this.parameters.interval;
        bullet.y += bullet.vy*this.parameters.interval;
        if(this.time < bullet.birth_time + Bullet.lifetime){
            timeline.addEvent(new MoveBullet({bullet_id:this.parameters.bullet_id, interval:this.parameters.interval }, this.time+this.parameters.interval));
        }else{
            timeline.deleteObject(this.parameters.bullet_id, this.time+this.parameters.interval);
        }
    }
}