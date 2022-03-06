// A root container for the world of the chat application
class World extends TObject{
    static ID = -1;
    static player_timeout = 3 ; // Time without heartbeat before a player is deleted

    heartbeat = {} ; // Set of players objects and the last game time they checked in
   
    constructor(){
        super();
    }

    // Serialize this object to a string
    serialize(){
        return JSON.stringify(this.heartbeat);
    }

    // Set this object to a serialized string created with serialize.
    set(serialized){
        this.heartbeat = JSON.parse(serialized);
    }
}