
var vm = require("vm");
var fs = require("fs");
var WebSocket = require('ws');

function include(f) {
    var data = fs.readFileSync(f);
    const script = new vm.Script(data);
    script.runInThisContext();
}

include('../timeline_core/TObject.js');
include('../timeline_core/TEvent.js');
include('../timeline_core/IntHashSet.js');
include('../timeline_core/Timeline.js');
include('../timeline_core/AddObject.js');
include('../timeline_core/DeleteObject.js');
include('../timeline_core/TServer.js');

include('./objects/Player.js');
include('./objects/Bullet.js');
include('./objects/World.js');

include('./events/MovePlayer.js');
include('./events/MoveBullet.js');
include('./events/Fire.js');
include('./events/UpdatePlayerTarget.js');
include('./events/Heartbeat.js');
include('./events/WorldTick.js');
include('./events/ConfigureTime.js');

var timeline ;

var port = 8081;
var tserver ;

function setUpGame(){
    timeline = new Timeline();
    let world = new World();
    timeline.addObject(world, World.ID, 0.01);
    timeline.addEvent(new WorldTick({interval:1.0/60.0}, 0.1));
}

function tick(){
    timeline.run();
    if(TServer.aggressive_event_forward){
        tserver.forwardAggressiveEvents();
    }
    // Simulate latency based on World settings via ConfigureTime
    let world = timeline.getObserved(World.ID) ;
    if(world){
        TServer.response_delay =  world.send_delay ;
    }
}

setUpGame();
tserver = new TServer(timeline, port, WebSocket);
setInterval(tick, 10);