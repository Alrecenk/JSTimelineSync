
var vm = require("vm");
var fs = require("fs");
var WebSocket = require('ws');

function include(f) {
    var data = fs.readFileSync(f);
    const script = new vm.Script(data);
    script.runInThisContext();
}

include('./timeline_core/TObject.js');
include('./timeline_core/TEvent.js');
include('./timeline_core/Timeline.js');
include('./timeline_core/AddObject.js');
include('./timeline_core/DeleteObject.js');
include('./timeline_core/TServer.js');

include('./objects/Player.js');
include('./objects/ChatLog.js');
include('./objects/World.js');

include('./events/MovePlayer.js');
include('./events/AddChatLine.js');
include('./events/UpdatePlayerTarget.js');
include('./events/Heartbeat.js');
include('./events/WorldTick.js');

var timeline ;

var port = 8081;
var tserver ;

function setUpGame(){
    timeline = new Timeline();
    let world = new World();
    timeline.addObject(world, World.ID, 0.01);
    let chat = new ChatLog();
    chat.max_lines = 5;
    chat.chat = [ "Welcome to the server!"];
    timeline.addObject(chat,0,0.02);
    timeline.addEvent(new WorldTick({interval:1.0/60.0}, 0.1));
}

function tick(){
    timeline.run();
    if(TServer.aggressive_event_forward){
        tserver.forwardAggressiveEvents();
    }
}

setUpGame();
tserver = new TServer(timeline, port, WebSocket);
setInterval(tick, 10);