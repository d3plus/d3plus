var validate = require("../font/validate.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Constructs font family property using the validate function
//------------------------------------------------------------------------------
d3plus.style.fontFamily = function( family ) {

  return {
    "process": validate,
    "value": family
  }

}
