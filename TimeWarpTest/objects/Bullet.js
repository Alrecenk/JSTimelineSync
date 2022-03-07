// A "player" for the 2D chat example
class Bullet extends TObject{
    static lifetime = 3;
    static radius = 5 ;
    x = 0;
    y = 0;
    vx = 0 ;
    vy = 0 ;
    color  = '#D0D0D0';
    birth_time = 0 ;

    constructor(){
        super();
    }

    // Serialize this object to a string
    serialize(){
        let s = {name:this.name, x:this.x, y:this.y, vx:this.vx, vy:this.vy, color:this.color, birth_time:this.birth_time};
        return JSON.stringify(s);
    }

    // Set this object to a serialized string created with serialize.
    set(serialized){
        let s = JSON.parse(serialized);
        this.name = s.name;
        this.x = s.x;
        this.y = s.y ;
        this.vx = s.vx;
        this.vy = s.vy ;
        this.birth_time = s.birth_time;
        this.color = s.color ;
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