//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Detects if FontAwesome is loaded on the page
//------------------------------------------------------------------------------
d3plus.fonts.awesome = false
for (var s = 0; s < document.styleSheets.length; s++) {
  var sheet = document.styleSheets[s]
  if (sheet.href && sheet.href.indexOf("font-awesome") >= 0) {
    d3plus.fonts.awesome = true
    break;
  }
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates test div to populate with test DIVs
//------------------------------------------------------------------------------
d3plus.fonts.tester = function() {

  var tester = d3.select("body").selectAll("div.d3plus_tester")
    .data(["d3plus_tester"])

  tester.enter().append("div")
    .attr("class","d3plus_tester")
    .style("position","absolute")
    .style("left","-9999px")
    .style("top","-9999px")
    .style("visibility","hidden")
    .style("display","block")

  return tester

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Given a single font or a list of font, determines which can be rendered
//------------------------------------------------------------------------------
d3plus.fonts.validate = function(test_fonts) {

  if (!(test_fonts instanceof Array)) {
    test_fonts = test_fonts.split(",")
  }

  var tester = d3plus.fonts.tester()

  function create_element(font) {

    return tester.append("span")
      .style("font-family",font)
      .style("font-size","32px")
      .style("padding","0px")
      .style("margin","0px")
      .text("abcdefghiABCDEFGHI_!@#$%^&*()_+1234567890")

  }

  function different(elem1,elem2) {

    var width1 = elem1.node().offsetWidth,
        width2 = elem2.node().offsetWidth

    return width1 !== width2

  }

  var monospace = create_element("monospace"),
      proportional = create_element("sans-serif")

  for (font in test_fonts) {

    var family = test_fonts[font].trim()

    var test = create_element(family+",monospace")

    var valid = different(test,monospace)
    test.remove()

    if (!valid) {
      var test = create_element(family+",sans-serif")
      valid = different(test,proportional)
      test.remove()
    }

    if (valid) {
      valid = family
      break;
    }

  }

  if (!valid) {
    valid = "sans-serif"
  }

  monospace.remove()
  proportional.remove()

  return valid

}
