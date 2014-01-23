//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//------------------------------------------------------------------------------
d3plus.utils.uniques = function(data,value) {
  var type = null
  return d3.nest().key(function(d) { 
      if (typeof value == "string") {
        if (!type) type = typeof d[value]
        return d[value]
      }
      else if (typeof value == "function") {
        if (!type) type = typeof value(d)
        return value(d)
      }
      else {
        return d
      }
    })
    .entries(data)
    .reduce(function(a,b){ 
      var val = b.key
      if (type == "number") val = parseFloat(val)
      return a.concat(val)
    },[]).sort(function(a,b){
      return a - b
    })
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds closest numeric value in array
//------------------------------------------------------------------------------
d3plus.utils.closest = function(arr,value) {
  var closest = arr[0]
  arr.forEach(function(p){
    if (Math.abs(value-p) < Math.abs(value-closest)) {
      closest = p
    }
  })
  return closest
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//------------------------------------------------------------------------------
d3plus.utils.merge = function(obj1, obj2) {
  var obj3 = {};
  function copy_object(obj,ret) {
    for (var a in obj) {
      if (typeof obj[a] != "undefined") {
        if (obj[a] instanceof Array) {
          ret[a] = obj[a]
        }
        else if (typeof obj[a] == "object") {
          if (!ret[a]) ret[a] = {}
          copy_object(obj[a],ret[a])
        }
        else {
          ret[a] = obj[a]
        }
      }
    }
  }
  if (obj1) copy_object(obj1,obj3)
  if (obj2) copy_object(obj2,obj3)
  // for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
  // for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
  return obj3;
}
d3plus.utils.copy = function(obj) {
  return d3plus.utils.merge(obj)
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Expands a min/max into a specified number of buckets
//------------------------------------------------------------------------------
d3plus.utils.buckets = function(arr, buckets) {
  var return_arr = [], step = 1/(buckets-1)*(arr[1]-arr[0]), i = step
  
  for (var i = arr[0]; i <= arr[1]; i = i + step) {
    return_arr.push(i)
  }
  if (return_arr.length < buckets) {
    return_arr[buckets-1] = arr[1]
  }
  if (return_arr[return_arr.length-1] < arr[1]) {
    return_arr[return_arr.length-1] = arr[1]
  }
  return return_arr
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get connection dictionary for specified links
//------------------------------------------------------------------------------
d3plus.utils.connections = function(vars,links) {
  var connections = {};
  links.forEach(function(d) {
    
    if (typeof d.source != "object") {
      d.source = vars.nodes.value.filter(function(n){return n[vars.id.key] == d.source})[0]
    }

    if (typeof d.target != "object") {
      d.target = vars.nodes.value.filter(function(n){return n[vars.id.key] == d.target})[0]
    }
    
    if (!connections[d.source[vars.id.key]]) {
      connections[d.source[vars.id.key]] = []
    }
    connections[d.source[vars.id.key]].push(d.target)
    if (!connections[d.target[vars.id.key]]) {
      connections[d.target[vars.id.key]] = []
    }
    connections[d.target[vars.id.key]].push(d.source)
  })
  return connections;
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Removes all non ASCII characters
//------------------------------------------------------------------------------
d3plus.utils.strip = function(str) {
    
  var removed = [ "!","@","#","$","%","^","&","*","(",")",
                  "[","]","{","}",".",",","/","\\","|",
                  "'","\"",";",":","<",">","?","=","+"]
  
  return str.replace(/[^A-Za-z0-9\-_]/g, function(chr) {
    
    if (" " == chr) {
      return "_"
    }
    else if (removed.indexOf(chr) >= 0) {
      return ""
    }
    
    var diacritics = [
        [/[\300-\306]/g, 'A'],
        [/[\340-\346]/g, 'a'],
        [/[\310-\313]/g, 'E'],
        [/[\350-\353]/g, 'e'],
        [/[\314-\317]/g, 'I'],
        [/[\354-\357]/g, 'i'],
        [/[\322-\330]/g, 'O'],
        [/[\362-\370]/g, 'o'],
        [/[\331-\334]/g, 'U'],
        [/[\371-\374]/g, 'u'],
        [/[\321]/g, 'N'],
        [/[\361]/g, 'n'],
        [/[\307]/g, 'C'],
        [/[\347]/g, 'c'],
    ];
    
    var ret = ""
    
    for (d in diacritics) {

      if (diacritics[d][0].test(chr)) {
        ret = diacritics[d][1]
        break;
      }
      
    }
    
    return ret;
      
  });
  
}
