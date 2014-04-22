//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Constructs font family property using the validate function
//------------------------------------------------------------------------------
d3plus.style.fontFamily = function( family ) {

  return {
    "process": d3plus.font.validate,
    "value": family
  }

}
