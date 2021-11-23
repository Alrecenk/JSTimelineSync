class AddChatLine extends TEvent{
    
    /*constructor(time, params){
        super(time);
        this.parameters = params;
    }*/

    run(timeline){
        let chat_log = timeline.get(this.parameters.chat_id);
        chat_log.chat.push(this.parameters.line);
        if(chat_log.chat.length > chat_log.max_lines){
            chat_log.chat.shift(1);
        }
    }
}