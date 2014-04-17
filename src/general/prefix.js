//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculates the correct CSS vendor prefix based on the current browser.
//------------------------------------------------------------------------------
d3plus.prefix = function() {

  if ("-webkit-transform" in document.body.style) {
    var val = "-webkit-"
  }
  else if ("-moz-transform" in document.body.style) {
    var val = "-moz-"
  }
  else if ("-ms-transform" in document.body.style) {
    var val = "-ms-"
  }
  else if ("-o-transform" in document.body.style) {
    var val = "-o-"
  }
  else {
    var val = ""
  }

  d3plus.prefix = function(){
    return val
  }

  return val;

}
