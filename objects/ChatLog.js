// The ChatLog for the 2D chat example
class ChatLog extends TObject{
    chat = []; // lines of text chat
    max_lines ; 

    constructor(){
        super();
    }

    serialize(){
        return JSON.stringify({chat:this.chat, max_lines:this.max_lines});
    }

    set(serial){
        let s = JSON.parse(serial);
        this.chat = s.chat ;
        this.max_lines = s.max_lines ;
    }
}