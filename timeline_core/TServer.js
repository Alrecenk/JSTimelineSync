// A wrapper class for a Node server providing timeline sync over a websocket
class TServer{
    
    timeline;
    port;

    web_socket_server ;

    response_delay = 100; // Time to wait before responding (reduces load from low latency clients)


    constructor(timeline, port, WebSocket){
        this.timeline = timeline ;
        this.port = port ;
        this.web_socket_server= new WebSocket.Server({ port: this.port });

        this.web_socket_server.on('connection', ws => {
            console.log("New connection!");
            ws.on('message', message => {
                this.receive(message, ws, this.timeline) ;
            })
        });
        console.log("Timeline Sync server opened on port " + port);
    }

    receive(message, socket, timeline){
        setTimeout(this.respond, this.response_delay, message, socket, timeline);
    }

    respond(message, socket, timeline){
        let in_packet = JSON.parse(message);
        if(in_packet.hash_data && in_packet.update){ // A Sync packet
            let out_packet = timeline.synchronize(in_packet.hash_data, in_packet.update, false, timeline.current_time-Timeline.sync_base_age);
            socket.send(JSON.stringify(out_packet));
        }else if(in_packet.update){ // update only packet doesn't respond
            timeline.applyUpdate(in_packet.update, false);
        }else{
            console.log(in_packet);
        }
    }
}