// A wrapper class for a Node server providing timeline sync over a websocket
class TServer{
    
    timeline;
    port;

    web_socket_server ;

    response_delay = 10; // Time to wait before responding (reduces load from lowl latency clients)


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
        //console.log("Received message => " + message);

        setTimeout(this.respond, this.response_delay, message, socket, timeline);
        
    }

    respond(message, socket, timeline){
        //console.log(this);
        let in_packet = JSON.parse(message);
        //console.log(in_packet.update);
        let out_packet = timeline.synchronize(in_packet.hash_data, in_packet.update, false, timeline.current_time-Timeline.sync_base_age);
        //console.log(timeline);
        socket.send(JSON.stringify(out_packet));

        //let response = "got: " + message;
        //socket.send(response);
    }
}