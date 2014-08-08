//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//------------------------------------------------------------------------------
d3plus.util.uniques = function( data , value ) {

  if ( data === undefined || value === undefined ) {
    return []
  }

  if (!(data instanceof Array)) data = [data]

  var vals = [], lookups = []
  data.forEach(function(d){
    if (d3plus.object.validate(d)) {
      if (typeof value === "function") {
        var val = value(d)
      }
      else {
        var val = d[value]
      }
      var lookup = ["number","string"].indexOf(typeof val) >= 0 ? val : JSON.stringify(val)
      if (lookups.indexOf(lookup) < 0) {
        vals.push(val)
        lookups.push(lookup)
      }
    }
  })

  vals.sort(function(a,b){return a-b})

  return vals

}
