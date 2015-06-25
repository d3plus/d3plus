sizes = require "../../font/sizes.coffee"

# Determines visible time markers and formatting.
module.exports = (vars, opts) ->

  values = opts.values or vars.data.time.ticks
  style  = opts.style or {}
  limit  = opts.limit or vars.width.value

  time      = {}
  periods   = vars.data.time.periods
  step      = vars.data.time.stepType
  total     = vars.data.time.totalType
  func      = vars.data.time.functions
  getFormat = vars.data.time.getFormat
  locale    = vars.format.locale.value.format

  if vars.time.format.value
    time.format = vars.data.time.format
    time.values = values
    time.sizes  = sizes values.map((v) -> time.format(v)), style

  else
    p = periods.indexOf step
    while p <= periods.indexOf total

      vals = values.filter (t) ->
        return true if p is periods.indexOf step
        match = true
        pp = p-1
        return true if p < 0
        while pp >= periods.indexOf step
          break unless match
          match = !func[pp] t
          pp--
        match

      if periods[p] is total
        format = d3.locale(locale).timeFormat(getFormat periods[p], total)
      else
        pp = p
        format = []
        while pp <= periods.indexOf total

          prev = if pp-1 < periods.indexOf(step) then pp else pp-1
          prev = periods[prev]
          small = periods[pp] is prev && step isnt total
          f = getFormat(prev,periods[pp],small)
          format.push [f, func[pp]]
          pp++

        format[format.length-1][1] = () -> true
        format = d3.locale(locale).timeFormat.multi(format)

      render = sizes vals.map((v) -> format(v)), style
      if d3.sum(render, (r) -> r.width) < limit or p is periods.indexOf total
        time.format = format
        time.values = vals
        time.sizes  = render
        break
      p++

  time
