//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//------------------------------------------------------------------------------
d3plus.util.merge = function(obj1, obj2) {
  var obj3 = {};
  function copy_object(obj,ret) {
    for (var a in obj) {
      if (typeof obj[a] != "undefined") {
        if (typeof obj[a] == "object" && !(obj[a] instanceof Array) && obj[a] !== null) {
          if (typeof ret[a] != "object") ret[a] = {}
          copy_object(obj[a],ret[a])
        }
        else if (obj[a] instanceof Array) {
          ret[a] = obj[a].slice(0)
        }
        else {
          ret[a] = obj[a]
        }
      }
    }
  }
  if (obj1) copy_object(obj1,obj3)
  if (obj2) copy_object(obj2,obj3)
  return obj3;
}
