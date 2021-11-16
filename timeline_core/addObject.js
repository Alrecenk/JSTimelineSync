//All eits ot objects have to take place as events so adding objects to the timeline must alos be an event.
// You can all addObject on the timelines and itwill create this for you
class addObject extends TEvent{

    constructor(obj, time){
        this.time = time ;
        params = {type : obj.constructor.name, serial:obj.serialize()};
    }

    run(timeline){
        let cl = stringToFunction(params.type);
        let obj = new cl(); // TODO every class needs an empty construcor for this to work

        obj.set(params.serial);
        obj.ID = timeline.getNextID();
        timeline.instant[obj.ID] = [[this.time, obj]];
        timeline.instant_read_index = 0;

        //TODO  Dirty all events that have read this value after this time (this could be executed again after a rollback and it won't trigger through the regular event execute)
    }
}