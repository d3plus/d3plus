#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Flows the text into tspans
#------------------------------------------------------------------------------
module.exports = (vars) ->

  newLine = (w, append) ->
    w = "" unless w
    if not reverse or append
      tspan = vars.container.value.append("tspan")
    else
      tspan = vars.container.value.insert("tspan", "tspan")

    tspan
      .attr "x", x + "px"
      .attr "dx", dx + "px"
      .attr "dy", dy + "px"
      .style "baseline-shift", if valign is "middle" then "-32%" else "10%"
      .text w

  if vars.shape.value is "circle"
    anchor = "middle"
    dx = 0
  else
    anchor = vars.align.value or vars.container.align or "start"
    if anchor is "end"
      dx = vars.width.value
    else if anchor is "middle"
      dx = vars.width.value/2
    else
      dx = 0

  valign   = vars.valign.value or "top"
  x        = parseFloat(vars.container.value.attr("x"), 10) or 0
  fontSize = if vars.resize.value then vars.size.value[1] else vars.container.fontSize or vars.size.value[0]
  dy       = vars.container.dy or fontSize
  textBox  = null
  progress = null
  reverse  = false
  yOffset = 0
  if vars.shape.value is "circle"
    if valign is "middle"
      yOffset = ((vars.height.value/dy % 1) * dy)/2
    else if valign is "end"
      yOffset = (vars.height.value/dy % 1) * dy

  vars.container.value
    .attr "text-anchor", anchor
    .attr "font-size", fontSize + "px"

  truncate = ->
    textBox.remove()
    line--
    if line isnt 1
      if reverse
        textBox = vars.container.value.select("tspan")
      else
        textBox = d3.select(vars.container.value.node().lastChild)
    unless textBox.empty()
      words = textBox.text().match(/[^\s-]+-?/g)
      ellipsis()

  lineWidth = () ->
    if vars.shape.value is "circle"
      b = ((line - 1) * dy) + yOffset
      b += dy if b > vars.height.value/2
      (2 * Math.sqrt(b * ((2 * (vars.width.value / 2)) - b)))
    else
      vars.width.value

  ellipsis = ->
    if words and words.length
      lastWord = words.pop()
      lastChar = lastWord.charAt(lastWord.length - 1)
      if lastWord.length is 1 and vars.text.split.value.indexOf(lastWord) >= 0
        ellipsis()
      else
        if vars.text.split.value.indexOf(lastChar) >= 0
          lastWord = lastWord.substr(0, lastWord.length - 1)
        textBox.text words.join(" ") + " " + lastWord + " ..."
        ellipsis() if textBox.node().getComputedTextLength() > lineWidth()
    else
      truncate()

  placeWord = (word) ->

    current   = textBox.text()

    if reverse
      next_char = vars.text.current.charAt(vars.text.current.length - progress.length - 1)
      joiner    = if next_char is " " then " " else ""
      progress  = word + joiner + progress
      textBox.text word + joiner + current
    else
      next_char = vars.text.current.charAt(progress.length)
      joiner    = if next_char is " " then " " else ""
      progress += joiner + word
      textBox.text current + joiner + word

    if textBox.node().getComputedTextLength() > lineWidth()
      textBox.text current
      textBox = newLine(word)
      if reverse then line-- else line++

  start = 1
  line  = null
  lines = null
  words = null
  wrap  = ->

    vars.container.value.selectAll("tspan").remove()
    vars.container.value.html ""
    words    = vars.text.words.slice(0)
    words.reverse() if reverse
    progress = words[0]
    textBox  = newLine words.shift(), true
    line = start

    for word in words

      if line * dy > vars.height.value
        truncate()
        break

      placeWord word

      unsafe = true
      while unsafe
        next_char = vars.text.current.charAt(progress.length + 1)
        unsafe = vars.text.split.value.indexOf(next_char) >= 0
        placeWord next_char if unsafe

    lines = Math.abs(line - start) + 1

  wrap()

  lines = line
  if vars.shape.value is "circle"
    space = vars.height.value - lines * dy
    if space > dy
      if valign is "middle"
        start = (space/dy/2 >> 0) + 1
        wrap()
      else if valign is "bottom"
        reverse = true
        start = (vars.height.value/dy >> 0)
        wrap()

  if valign is "top"
    y = 0
  else
    h = lines * dy
    yOffset = (vars.height.value/dy % 1) * dy
    if valign is "middle"
      yOffset /= 2
      y = vars.height.value/2 - h/2
    else
      y = vars.height.value - h
    y -= yOffset if vars.shape.value is "circle"

  vars.container.value.attr("transform","translate(0," + y + ")")
