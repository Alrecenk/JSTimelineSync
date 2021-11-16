class MovePlayer{

    constructor(time, player_id, interval){
        this.time = time;
        params = {playuer_id:player_id, interval:interval };
    }

    run(timeline){
        let player = timeline.get(params.player_id);
        player.x += player.vx * params.interval;
        player.y += player.vy * params.interval;
        timeline.addEvent(new MovePlayer(time+params.interval, params.player_id, params.interval));
    }
}