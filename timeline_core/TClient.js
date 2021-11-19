// A Wrapper class for a timeline sync client in a webpage
var client_global ;
class TClient{
    timeline ; // Timeline being synchronized
    //The address with protocol and port
    address = null;
    //The websocket
    socket = null ; 
    active = false;

    constructor(timeline, port){
        client_global = this ;
        this.timeline = timeline ;
        this.address = "ws://" + location.hostname + ":" + port;
        this.socket = new WebSocket(this.address);
        this.socket.onmessage = function(message) {
            client_global.receive(message.data);
        };
    }



    ready(){
        return this.socket.readyState == WebSocket.OPEN ;
    }

    receive(message){
        console.log("Got message from server:" + message);
    }

    send(message){
        this.socket.send(message);
    }
    
}