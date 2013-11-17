//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator (if no color is given)
//-------------------------------------------------------------------

d3plus.utils.color_scale = d3.scale.category20b()
d3plus.utils.rand_color = function(x) {
  var rand_int = x || Math.floor(Math.random()*20)
  return d3plus.utils.color_scale(rand_int);
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns appropriate text color based off of a given color
//-------------------------------------------------------------------

d3plus.utils.text_color = function(color) {
  var hsl = d3.hsl(color),
      light = "#ffffff", 
      dark = "#333333";
  if (hsl.l > 0.65) return dark;
  else if (hsl.l < 0.48) return light;
  return hsl.h > 35 && hsl.s >= 0.3 && hsl.l >= 0.41 ? dark : light;
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color if it's too light to appear on white
//-------------------------------------------------------------------

d3plus.utils.darker_color = function(color) {
  var hsl = d3.hsl(color)
  if (hsl.s > .9) hsl.s = .9
  if (hsl.l > .4) hsl.l = .4
  return hsl.toString();
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//-------------------------------------------------------------------
        
d3plus.utils.uniques = function(data,value) {
  return d3.nest().key(function(d) { 
    return d[value]
  }).entries(data).reduce(function(a,b,i,arr){ 
    return a.concat(parseInt(b['key']))
  },[])
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//-------------------------------------------------------------------

d3plus.utils.merge = function(obj1, obj2) {
  var obj3 = {};
  for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
  for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
  return obj3;
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Expands a min/max into a certain number of buckets
//-------------------------------------------------------------------

d3plus.utils.buckets = function(arr, buckets) {
  var i = 0.0, return_arr = [], step = 1/(buckets-1)
  while(i <= 1) {
    return_arr.push((arr[0]*Math.pow((arr[1]/arr[0]),i)))
    i += step
  }
  if (return_arr[0] > arr[0]) return_arr[0] = arr[0]
  if (return_arr[1] < arr[1]) return_arr[1] = arr[1]
  return return_arr
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get connection dictionary for specified links
//-------------------------------------------------------------------

d3plus.utils.connections = function(vars,links) {
  var connections = {};
  links.forEach(function(d) {
    
    if (typeof d.source != "object") {
      d.source = vars.nodes.filter(function(n){return n[vars.id] == d.source})[0]
    }

    if (typeof d.target != "object") {
      d.target = vars.nodes.filter(function(n){return n[vars.id] == d.target})[0]
    }
    
    if (!connections[d.source[vars.id]]) {
      connections[d.source[vars.id]] = []
    }
    connections[d.source[vars.id]].push(d.target)
    if (!connections[d.target[vars.id]]) {
      connections[d.target[vars.id]] = []
    }
    connections[d.target[vars.id]].push(d.source)
  })
  return connections;
}

//===================================================================
