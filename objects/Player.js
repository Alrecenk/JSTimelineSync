// A "player" for the 2D chat example
class Player extends TObject{
    static radius = 35 ;
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
}