
// A wrapper class for a Node server providing timeline sync over a websocket
class TServer{
    
    timeline;
    port;

    web_socket_server ;


    constructor(timeline, port, WebSocket){
        this.timeline = timeline ;
        this.port = port ;
        this.web_socket_server= new WebSocket.Server({ port: this.port });

        this.web_socket_server.on('connection', ws => {
            console.log("Got connection!");
            ws.on('message', message => {
                this.receive(message, ws) ;
            })
        });
        console.log("Socket server opened on port " + port);
    }

    receive(message, socket){
        console.log("Received message => " + message);

        setTimeout(this.respond,500, message, socket);
        
    }

    respond(message, socket){
        let response = "got: " + message;
        socket.send(response);
    }
}