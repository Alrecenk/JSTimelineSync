class IntHashSet{
    array;
    capacity ;
    filled;

    static rehash_percent = 0.75 ;
    static rehash_multiplier = 2 ;

    constructor(capacity = 2){
        this.capacity = capacity;
        this.filled = 0 ;
        this.array = new Int32Array(this.capacity);
    }

    add(hash){
        let index = Math.abs(hash)%this.capacity;
        while(this.array[index] != 0){
            index = (index+1)%this.capacity;
        }
        this.array[index] = hash ;
        this.filled++;
        if(this.filled > this.capacity*IntHashSet.rehash_percent){
            this.rehash(this.capacity * IntHashSet.rehash_multiplier);
        }
    }

    contains(hash){
        if (isNaN(hash)) {
            return false;
        }
        let index = Math.abs(hash)%this.capacity;
        while(this.array[index] != 0){
            if(this.array[index] == hash){
                return true;
            }else{
                index = (index+1)%this.capacity;
            }
        }
        return false;
    }

    rehash(new_capacity){
        this.capacity = new_capacity;
        let new_set = new IntHashSet(new_capacity);
        for(let k=0; k < this.array.length;k++){
            if(this.array[k] != 0){
                new_set.add(this.array[k]);
            }
        }
        this.array = new_set.array;
    }

    clear(){
        for(let k=0; k < this.array.length;k++){
            this.array[k] = 0 ;
        }
        this.filled = 0 ;
    }

    getCompactArray(){
        let compact = new Int32Array(this.filled);
        let i = 0 ;
        for(let k=0;k<this.capacity;k++){
            if(this.array[k] != 0){
                compact[i] = this.array[k];
                i++;
            }
        }
        return compact ;
    }

}
