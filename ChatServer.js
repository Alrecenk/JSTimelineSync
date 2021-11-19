
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
include('./timeline_core/TServer.js');

include('./objects/Player.js');
include('./objects/ChatLog.js');

include('./events/MovePlayer.js');
include('./events/AddChatLine.js');
include('./events/UpdatePlayerVelocity.js');

var interval = 1.0/30 ; // step size in seconds
var timeline ;
var current_time = 0 ;

var port = 8081;
var tserver ;

function setUpGame(){
    timeline = new Timeline();
    //console.log("Starting timeline:");
    //console.log(timeline);
    // TODO set up chat log
}

function tick(){
    current_time += interval ;
    timeline.executeToTime(current_time);
    timeline.advanceBaseTime(current_time-3);
}

setUpGame();
tserver = new TServer(timeline, port, WebSocket);
setInterval(tick, 1000*interval);