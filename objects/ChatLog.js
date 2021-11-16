// The ChatLog for the 2D chat example
class ChatLog extends TObject{
    chat = []; // lines of text chat
    max_lines ; 

    constructor(max_lines){
        this.max_lines = max_lines;
    }

}