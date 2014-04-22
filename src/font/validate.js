//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Given a single font or a list of font, determines which can be rendered
//------------------------------------------------------------------------------
d3plus.font.validate = function(test_fonts) {

  if (!(test_fonts instanceof Array)) {
    test_fonts = test_fonts.split(",")
  }
  
  var fontString = test_fonts.join(", ")
    , completed = d3plus.font.validate.complete

  if (fontString in completed) {
    return completed[fontString]
  }

  var tester = d3plus.font.tester()

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

  completed[fontString] = valid

  return valid

}

d3plus.font.validate.complete = {}
