module.exports =
  accepted:   [false, Number, String]
  deprecates: "highlight"
  process:    (value, vars) ->

    element = vars.data.element.value

    if element and ["string","number"].indexOf(typeof value) >= 0

      elementTag  = element.node().tagName.toLowerCase()
      elementType = element.attr("type")

      if elementTag is "select"
        for d, i in element.selectAll("option")
          element.node().selectedIndex = i if d and d[vars.id.value] is value
      else if elementTag is "input" and elementType is "radio"
        for d in element
          @checked = d and d[vars.id.value] is value

    value
  value:      false
