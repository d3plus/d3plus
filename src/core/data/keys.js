//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get Key Types from Data
//------------------------------------------------------------------------------
module.exports = function( vars , type ) {

  if ( vars.dev.value ) {
    var timerString = type + " key analysis"
    console.time( timerString )
  }

  vars[type].keys = {}

  function get_keys( arr ) {
    if (arr instanceof Array) {
      arr.forEach(function(d) {
        get_keys( d )
      })
    }
    else if ( d3plus.object.validate(arr) ) {
      for (var d in arr) {
        if ( d3plus.object.validate(arr[d]) ) {
          get_keys( arr[d] )
        }
        else if (!(d in vars[type].keys) && d in arr) {
          vars[type].keys[d] = typeof arr[d]
        }
      }
    }
  }

  if ( d3plus.object.validate(vars[type].value) ) {
    for ( var a in vars[type].value ) {
      get_keys(vars[type].value[a])
    }
  }
  else {
    get_keys(vars[type].value)
  }

  if ( vars.dev.value ) console.time( timerString )

}
