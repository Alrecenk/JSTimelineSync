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
        console.log("TObject does not o0verride set!");
    }
}


var stringToFunction = function(str) {
    var arr = str.split(".");
  
    var fn = (window || this);
    for (var i = 0, len = arr.length; i < len; i++) {
      fn = fn[arr[i]];
    }
  
    if (typeof fn !== "function") {
      throw new Error("function not found");
    }
  
    return  fn;
  };