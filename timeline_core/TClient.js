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

    // time to wait before responding (can be used with TServer response_time to simulate latency for testing)
    sync_delay = 0; 
    update_delay = 0 ;

    constructor(timeline, port){
        client_global = this ;
        this.timeline = timeline ;
        this.address = "ws://" + location.hostname + ":" + port;
        this.socket = new WebSocket(this.address);
        this.socket.onmessage = function(message) {
            client_global.receive(message.data);
        };
        this.timeline.client = this ;
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
        setTimeout(this.respond, this.sync_delay, message);
    }

    async respond(message){
        let in_packet = JSON.parse(message);
        if(in_packet.hash_data && in_packet.update){ // A Sync packet
            let out_packet = client_global.timeline.synchronize(in_packet.hash_data, in_packet.update, true, client_global.timeline.current_time-Timeline.sync_base_age);
            client_global.send(JSON.stringify(out_packet));
            // Not fully connected until clock has been sycnrhonzied, which takes 2 hops
            client_global.connected |= client_global.timeline.current_time >= in_packet.update.current_time;
        }else if(in_packet.update){ // update only packet doesn't respond
            client_global.timeline.applyUpdate(in_packet.update, false);
        }
    }

    send(message){
        client_global.socket.send(message);
    }

    sendUpdate(message){
        setTimeout(this.send, this.update_delay, message);
    }



    
}