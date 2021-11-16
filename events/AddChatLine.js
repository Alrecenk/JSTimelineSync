
class AddChatLine extends TEvent{
    constructor(time, chat_id, line){
        this.time = time;
        params = {chat_id:chat_id, line:line };
    }

    run(timeline){
        let chat_log= timeline.get(params.chat_id);
        chat_log.lines.push(params.line);
        if(chat_log.lines > chatlog_.max_lines){
            chat_log.shift();
        }
    }
}