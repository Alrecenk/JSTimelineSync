// A root container for the world of the chat application
class World extends TObject{
    static ID = -1;
    static player_timeout = 3 ; // Time without heartbeat before a player is deleted


    heartbeat = {} ; // Set of players objects and the last game time they checked in
    send_delay = 5 ; // ms to wait before sending data (simulated latency)
    max_info_speed = 1000000; // maximum sped of information in pixels per second (used for time warp)
   
    constructor(){
        super();
    }

    // Serialize this object to a string
    serialize(){
        let s = {heartbeat:this.heartbeat, send_delay:this.send_delay,max_info_speed:this.max_info_speed};
        return JSON.stringify(s);
    }

    // Set this object to a serialized string created with serialize.
    set(serialized){
        let s = JSON.parse(serialized);
        this.heartbeat = s.heartbeat;
        this.send_delay = s.send_delay;
        this.max_info_speed = s.max_info_speed;
    }
}