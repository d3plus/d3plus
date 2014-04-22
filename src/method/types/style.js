d3plus.method.style = {
  "accepted": function( vars ){
    return d3.keys(d3plus.style).filter(function(s){
      return typeof d3plus.style[s] === "object"
    })
  },
  "value": "default"
}
