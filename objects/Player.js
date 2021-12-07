// A "player" for the 2D chat example
class Player extends TObject{
    static radius = 35 ;
    static speed = 500 ;
    name = "";
    x = 0;
    y = 0;
    vx = 0 ;
    vy = 0 ;
    constructor(){
        super();
    }

    // Serialize this object to a string
    serialize(){
        let s = {name:this.name, x:this.x, y:this.y, vx:this.vx, vy:this.vy};
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
    }

    interpolateFrom(last_observed, last_time, this_time){
        if(!last_observed){
            console.log("no prev");
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
            ip.vx = a*last_observed.vx + b* this.vx ;
            ip.vy = a*last_observed.vy + b* this.vy ;
            return ip ;
        }
    }
}