# Sorts 2 colors based on hue.
module.exports = (a, b) ->
  aHSL = d3.hsl a
  bHSL = d3.hsl b
  a = if aHSL.s is 0 then 361 else aHSL.h
  b = if bHSL.s is 0 then 361 else bHSL.h
  if a is b then aHSL.l - bHSL.l else a - b
