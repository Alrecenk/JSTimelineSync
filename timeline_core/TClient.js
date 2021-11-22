// A Wrapper class for a timeline sync client in a webpage
var client_global ;
class TClient{
    timeline ; // Timeline being synchronized
    connected = false ; // Whether sycnrhonization is current connected
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

    async start(){
        let wait_time = 0 ;
        // wait until socket ready to send first packet
        while(!timeline_socket.ready() && wait_time < 2000){ 
            await sleep(100);
            wait_time+=100 ;
        }
        if(!timeline_socket.ready()){
            console.log("Socket connection timed out. Starting local only execution.");
            return;
        }
        let update = {base_time: -1, events:[], base:{}} ;
        let out_packet = {update:update, hash_data:timeline.getHashData(-1)};
        this.send(JSON.stringify(out_packet));
        // Wait until first response before botting app
        
        while(!timeline_socket.connected ){
            await sleep(100);
        }
        console.log("Sycnhronization connected.");

    }

    receive(message){
        //console.log("Got message from server:" + message);
        //console.log(this.timeline) ;
        let in_packet = JSON.parse(message);
        let out_packet= this.timeline.synchronize(in_packet.hash_data, in_packet.update, true, this.timeline.current_time-Timeline.sync_base_age);
        this.send(JSON.stringify(out_packet));
        this.connected = true;
    }

    send(message){
        //console.log("sent message: " + message);
        this.socket.send(message);
    }

    
}