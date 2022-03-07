class UpdatePlayerTarget extends TEvent{
    run(timeline){
        let player = timeline.get(this.parameters.player_id);
        if(!(player instanceof Player)){
            return ;
        }
        if(this.parameters.tx && this.parameters.ty){
            player.tx = this.parameters.tx;
            player.ty = this.parameters.ty;
            player.moving = true;
        }else{
            player.moving = false;
        }
    }
}