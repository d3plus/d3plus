fontTester = require("../core/font/tester.coffee")

# Given a single font or a list of font, determines which can be rendered
validate = (fontList) ->

  fontList = fontList.split(",") unless fontList instanceof Array
  font.trim() for font in fontList

  # Check if the fontList has already been validated.
  fontString = fontList.join(", ")
  completed = validate.complete
  return completed[fontString] if fontString of completed

  testElement = (font) ->
    tester.append("span")
      .style "font-family", font
      .style "font-size", "32px"
      .style "padding", "0px"
      .style "margin", "0px"
      .text "abcdefghiABCDEFGHI_!@#$%^&*()_+1234567890"

  testWidth = (font, control) ->
    elem = testElement(font)
    width1 = elem.node().offsetWidth
    width2 = control.node().offsetWidth
    elem.remove()
    width1 isnt width2

  tester = fontTester("div")
  monospace = testElement("monospace")
  proportional = testElement("sans-serif")

  for family in fontList

    valid = testWidth(family + ",monospace", monospace)
    valid = testWidth(family + ",sans-serif", proportional) unless valid

    if valid
      valid = family
      break

  valid = "sans-serif" unless valid

  monospace.remove()
  proportional.remove()

  completed[fontString] = valid
  valid

validate.complete = {}

module.exports = validate
