// A "player" for the 2D chat example
class Player extends TObject{
    static radius = 35 ;
    static speed = 400 ;
    static fire_delay = 0.3 ;
    x = 0;
    y = 0;
    tx = 0 ;
    ty = 0 ;
    moving = false;
    color  = '#D0D0D0';
    last_fire_time = 0 ;
    times_hit = 0 ;
    hits = 0 ;

    constructor(){
        super();
    }

    // Serialize this object to a string
    serialize(){
        let s = {x:this.x, y:this.y, tx:this.tx, ty:this.ty, moving:this.moving, color:this.color,last_fire_time:this.last_fire_time, hits:this.hits, times_hit:this.times_hit};
        return JSON.stringify(s);
    }

    // Set this object to a serialized string created with serialize.
    set(serialized){
        let s = JSON.parse(serialized);
        this.color = s.color ;
        this.x = s.x;
        this.y = s.y ;
        this.tx = s.tx;
        this.ty = s.ty ;
        this.moving = s.moving;
        this.color = s.color;
        this.last_fire_time = s.last_fire_time;
        this.hits = s.hits;
        this.times_hit = s.times_hit;
    }

    interpolateFrom(last_observed, last_time, this_time){
        if(!last_observed){
            return this ;
        }
        let distance = Math.sqrt((this.x-last_observed.x)*(this.x-last_observed.x)+(this.y-last_observed.y)*(this.y-last_observed.y));
        let dt = this_time-last_time ;
        if(distance/dt < Player.speed *1.1){
            return this ;
        }else{
            let ip = new Player();
            ip.set(this.serialize());
            let b = Player.speed *1.1*dt/distance ;
            
            let a = 1-b;
            ip.x = a*last_observed.x + b* this.x ;
            ip.y = a*last_observed.y + b* this.y ;
            ip.tx = a*last_observed.tx + b* this.tx ;
            ip.ty = a*last_observed.ty + b* this.ty ;
            return ip ;
        }
    }
}