// A Timeline object
// Override this class with core data members to allow timeline synchronization.

class TObject{
    ID ; // Unique integer identifier

    // Serialize this object to a string
    serialize(){
        console.log("TObject doesn't override serialize!");
    }

    // Se6t this object to a serialized string created with serialize.
    set(serialized){
        console.log("TObject does not override set!");
    }

    hash(){
        let serial = this.serialize();
        //TODO cache hash     
        return TObject.hashSerial(serial);     
    }

    static hashSerial(serial){
        return serial.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);   
    }

    // Makes it possible to initialize an object by the string name of its class
    static getObjectBySerialized(class_name, id, serial){
        let obj ;
        let es = "obj = new "+class_name+"();" ;
        eval(es); // TODO got to be a better way also every class needs an empty constructor for this to work
        obj.set(serial);
        obj.ID = id ;
        return obj ;
    }

    static copy(obj){
        if(!obj){
            return null ;
        }
        return this.getObjectBySerialized(obj.constructor.name, obj.ID, obj.serialize());
    }
}