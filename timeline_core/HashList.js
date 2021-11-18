// A simple class to detect differences in a set of objects by comparing content hashes
// Consider using a hash-tree instead if the number of objects exceeds a few hundred

class HashList{
    hashes = {} ; // maps ID to hash of current data
    raw = {} ; // maps id to raw data
    serialized = {} // maps id to serialized
    
    constructor(){

    }

    get(id){
        return raw[id];
    }

    updateObj(id, obj){
        raw[id] = obj;
        serialized[id] = JSON.stringify(obj);
        hashes[id] = HashList.hash(serialized[id]);
    }

    updateJSON(id, json){
        serialized[id] = json;
        hashes[id] = HashList.hash(serialized[id]);
        raw[id] = JSON.parse(json);
    }


    //TODO add ability to delete objects

    getUpdateFor(other_hashes){
        packet = {}; // TODO check the behavior around deleted objects
        for(let id in hashes){
            if(!(id in other_hashes) || other_hashes[id] != hashes[id]){
                packet[id] = serialized[id];
            }
        }
        return packet ;
    }
}