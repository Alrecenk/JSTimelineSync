
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
var kept_time = 3 ;

var port = 8081;
var tserver ;

function setUpGame(){
    timeline = new Timeline(0);
    //console.log("Starting timeline:");
    //console.log(timeline);
    // TODO set up chat log
}

function tick(){
    timeline.current_time += interval ;
    timeline.executeToTime(timeline.current_time);
    timeline.advanceBaseTime(timeline.current_time-kept_time);
}

setUpGame();

tserver = new TServer(timeline, port, WebSocket);
setInterval(tick, 1000*interval);