rtl = require "../../client/rtl.coffee"

#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Flows the text into tspans
#------------------------------------------------------------------------------
module.exports = (vars) ->

  newLine = (first) ->
    if not reverse or first
      tspan = vars.container.value.append("tspan")
    else
      tspan = vars.container.value.insert("tspan", "tspan")

    tspan
      .attr "x", x + "px"
      .attr "dy", dy + "px"
      .style "baseline-shift", "0%"
      .attr "dominant-baseline", "alphabetic"

  mirror = vars.rotate.value is -90 or vars.rotate.value is 90
  width = if mirror then vars.height.inner else vars.width.inner
  height = if mirror then vars.width.inner else vars.height.inner

  if vars.shape.value is "circle"
    anchor = "middle"
  else
    anchor = vars.align.value or vars.container.align or "start"

  if anchor is "end" or (anchor is "start" and rtl)
    xOffset = width
  else if anchor is "middle"
    xOffset = width/2
  else
    xOffset = 0

  valign   = vars.valign.value or "top"
  x        = vars.container.x + xOffset
  fontSize = if vars.resize.value then vars.size.value[1] else vars.container.fontSize or vars.size.value[0]
  dy       = vars.container.dy or fontSize * 1.1
  textBox  = null
  progress = null
  words    = null
  reverse  = false
  yOffset  = 0
  if vars.shape.value is "circle"
    if valign is "middle"
      yOffset = ((height/dy % 1) * dy)/2
    else if valign is "end"
      yOffset = (height/dy % 1) * dy

  vars.container.value
    .attr "text-anchor", anchor
    .attr "font-size", fontSize + "px"
    .style "font-size", fontSize + "px"
    .attr "x", vars.container.x
    .attr "y", vars.container.y

  truncate = ->
    textBox.remove()
    if reverse
      line++
      textBox = vars.container.value.select("tspan")
    else
      line--
      textBox = d3.select(vars.container.value.node().lastChild)
    unless textBox.empty()
      words = textBox.text().match(/[^\s-]+-?/g)
      ellipsis()

  lineWidth = () ->
    if vars.shape.value is "circle"
      b = ((line - 1) * dy) + yOffset
      b += dy if b > height/2
      (2 * Math.sqrt(b * ((2 * (width / 2)) - b)))
    else
      width

  ellipsis = ->
    if words and words.length
      lastWord = words.pop()
      lastChar = lastWord.charAt(lastWord.length - 1)
      if lastWord.length is 1 and vars.text.split.value.indexOf(lastWord) >= 0
        ellipsis()
      else
        if vars.text.split.value.indexOf(lastChar) >= 0
          lastWord = lastWord.substr(0, lastWord.length - 1)
        textBox.text words.join(" ") + " " + lastWord + "..."
        ellipsis() if textBox.node().getComputedTextLength() > lineWidth()
    else
      truncate()

  placeWord = (word) ->

    current   = textBox.text()

    next_char = ""
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

    if Math.floor(textBox.node().getComputedTextLength()) > lineWidth() or next_char is "\n"
      textBox.text current
      if current.length
        textBox = newLine()
      textBox.text word
      if reverse then line-- else line++

  start = 1
  line  = null
  lines = null
  wrap  = ->

    vars.container.value.text("").html ""
    words    = vars.text.words.slice()
    words.reverse() if reverse
    progress = ""
    textBox  = newLine true
    line = start

    for word in words

      if line * dy > height
        truncate()
        break

      placeWord word

      unsafe = true
      while unsafe
        next_char = vars.text.current.charAt(progress.length + 1)
        unsafe = vars.text.split.value.indexOf(next_char) >= 0
        placeWord next_char if unsafe

    if line * dy > height
      truncate()

    lines = Math.abs(line - start) + 1

  wrap()

  lines = 0
  vars.container.value.selectAll("tspan").each () ->
    if d3.select(this).text().length
      lines++
  if vars.shape.value is "circle"
    space = height - lines * dy
    if space > dy
      if valign is "middle"
        start = (space/dy/2 >> 0) + 1
        wrap()
      else if valign is "bottom"
        reverse = true
        start = (height/dy >> 0)
        wrap()

  lines = 0
  vars.container.value.selectAll("tspan").each () ->
    if d3.select(this).text().length
      lines++

  if valign is "top"
    y = 0
  else
    h = lines * dy
    y = if valign is "middle" then height/2 - h/2 else height - h
  y -= dy * 0.2

  translate = "translate(0," + y + ")"
  if vars.rotate.value is 180 or vars.rotate.value is -180
    rx = vars.container.x + width/2
    ry = vars.container.y + height/2
  else
    rmod = if vars.rotate.value < 0 then width else height
    rx = vars.container.x + rmod/2
    ry = vars.container.y + rmod/2
  rotate = "rotate(" + vars.rotate.value + ", " + rx + ", " + ry + ")"
  vars.container.value.attr "transform", rotate + translate
