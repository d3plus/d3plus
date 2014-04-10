//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Detects if FontAwesome is loaded on the page
//------------------------------------------------------------------------------
d3plus.font.awesome = false
for (var s = 0; s < document.styleSheets.length; s++) {
  var sheet = document.styleSheets[s]
  if (sheet.href && sheet.href.indexOf("font-awesome") >= 0) {
    d3plus.font.awesome = true
    break;
  }
}
