var validObject = require("../../object/validate.coffee");
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get Key Types from Data
//------------------------------------------------------------------------------
module.exports = function( vars , type ) {

  var timerString = type + " key analysis";
  if ( vars.dev.value ) console.time(timerString);

  vars[type].keys = {};

  function get_keys( arr ) {
    if (arr instanceof Array) {
      arr.forEach(function(d) {
        get_keys(d);
      });
    }
    else if ( validObject(arr) ) {
      for (var d in arr) {
        if ( validObject(arr[d]) ) {
          get_keys( arr[d] );
        }
        else if (!(d in vars[type].keys) && d in arr && arr[d] !== null) {
          vars[type].keys[d] = typeof arr[d];
        }
      }
    }
  }

  if ( validObject(vars[type].value) ) {
    for ( var a in vars[type].value ) {
      get_keys(vars[type].value[a]);
    }
  }
  else {
    get_keys(vars[type].value);
  }

  if ( vars.dev.value ) console.time(timerString);

};
