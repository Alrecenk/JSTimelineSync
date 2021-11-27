// A wrapper class for a Node server providing timeline sync over a websocket
class TServer{
    
    timeline;
    port;

    web_socket_server ;

    static response_delay = 5; // Time to wait before responding (reduces load from low latency clients)

    static quick_sends = [];
    static clients = []; // TODO finda cleaner way around this not being reliable on delayed events
    static aggressive_event_forward = true;

    constructor(timeline, port, WebSocket){
        this.timeline = timeline ;
        this.port = port ;
        this.web_socket_server= new WebSocket.Server({ port: this.port });
        this.web_socket_server.on('connection', ws => {
            console.log("New connection!");
            TServer.clients.push(ws);
            //TODO add an API hook for server app to do something on connect
            ws.on('message', message => {
                this.receive(message, ws, this.timeline) ;
            })
            ws.on('close', function(){
                for(let k=0; k < TServer.clients.length;k++){
                    if(TServer.clients[k] == ws){
                        TServer.clients.splice(k,1);
                        break;
                    }
                }
                //TODO add an API hook for server app to do something on client disconnect
            });
        });
        console.log("Timeline Sync server opened on port " + port);
    }

    receive(message, socket, timeline){
        setTimeout(this.respond, TServer.response_delay, message, socket, timeline);
    }

    respond(message, socket, timeline){
        let in_packet = JSON.parse(message);
        if(in_packet.hash_data && in_packet.update){ // A Sync packet
            let out_packet = timeline.synchronize(in_packet.hash_data, in_packet.update, false);
            socket.send(JSON.stringify(out_packet));
        }else if(in_packet.update){ // update only packet doesn't respond
            timeline.applyUpdate(in_packet.update, false);
            if(TServer.aggressive_event_forward){
                for(let e = 0; e < in_packet.update.events.length; e++){
                    // timeout simulates latency for aggressive forwarding
                    setTimeout(TServer.quick_sends.push, TServer.response_delay, {source:socket, event:in_packet.update.events[e]});
                }
            } 
        }else{
            console.log(in_packet);
        }
    }

    forwardAggressiveEvents(){
        for(let k=0;k<TServer.clients.length;k++){
            let update_events = [];
            for(let e=0;e<TServer.quick_sends.length;e++){
                if(TServer.quick_sends[e].source != TServer.clients[k]){ // don't send event back to source
                    update_events.push(TServer.quick_sends[e].event);
                }
            }
            if(update_events.length > 0){
                let update = {current_time:this.timeline.current_time, events:update_events};
                let out_packet = {update:update};
                TServer.clients[k].send(JSON.stringify(out_packet));
            }
        }
        TServer.quick_sends = [];
    }
}