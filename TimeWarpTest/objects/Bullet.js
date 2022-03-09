// A "player" for the 2D chat example
class Bullet extends TObject{
    static lifetime = 3;
    static radius = 10 ;
    static speed = 400;
    x = 0;
    y = 0;
    vx = 0 ;
    vy = 0 ;
    shooter_id = 0 ;
    birth_time = 0 ;

    constructor(){
        super();
    }

    // Serialize this object to a string
    serialize(){
        let s = {x:this.x, y:this.y, vx:this.vx, vy:this.vy, shooter_id:this.shooter_id, birth_time:this.birth_time};
        return JSON.stringify(s);
    }

    // Set this object to a serialized string created with serialize.
    set(serialized){
        let s = JSON.parse(serialized);
        this.x = s.x;
        this.y = s.y ;
        this.vx = s.vx;
        this.vy = s.vy ;
        this.birth_time = s.birth_time;
        this.shooter_id = s.shooter_id ;
    }
    interpolateFrom(last_observed, last_time, this_time){
        if(!last_observed){
            return this ;
        }
        let distance = Math.sqrt((this.x-last_observed.x)*(this.x-last_observed.x)+(this.y-last_observed.y)*(this.y-last_observed.y));
        let dt = this_time-last_time ;
        if(distance/dt < Bullet.speed *1.3){
            return this ;
        }else{
            let ip = new Bullet();
            ip.set(this.serialize());
            let b = Bullet.speed *1.3*dt/distance ;
            let a = 1-b;
            ip.x = a*last_observed.x + b* this.x ;
            ip.y = a*last_observed.y + b* this.y ;
            return ip ;
        }
    }
}