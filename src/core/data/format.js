var dataNest   = require("./nest.js"),
    fetchValue = require("../fetch/value.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats raw data by time and nesting
//------------------------------------------------------------------------------
module.exports = function( vars ) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Gets all unique time values
  //----------------------------------------------------------------------------
  vars.data.time = {"values": []}
  if ( vars.time && vars.time.value ) {

    if ( vars.dev.value ) {
      var timerString = "analyzing time periods"
      d3plus.console.time( timerString )
    }

    var uniqueTimes = d3plus.util.uniques( vars.data.value , vars.time.value )
    for ( var i = 0; i < uniqueTimes.length ; i++ ) {
      var d = new Date(uniqueTimes[i].toString())
      if (d !== "Invalid Date") {
        d.setTime( d.getTime() + d.getTimezoneOffset() * 60 * 1000 )
        vars.data.time.values.push(d)
      }
    }
    vars.data.time.values.sort(function(a,b){return a-b})

    var step = []
    vars.data.time.values.forEach(function(y,i){
      if (i != 0) {
        var prev = vars.data.time.values[i-1]
        step.push(y-prev)
        if (i === vars.data.time.values.length - 1) {
          vars.data.time.total = y - vars.data.time.values[0]
        }
      }
    })

    vars.data.time.step = d3.min(step)

    var periods = ["Milliseconds","Seconds","Minutes","Hours","Date","Month","FullYear"]
      , conversions = [1000,60,60,24,30,12,1]

    var getDiff = function(start,end,i) {

      if (!vars.data.time.stepDivider) {
        vars.data.time.stepDivider = conversions.slice(0,i).reduce(function(a,b){return a*b})
      }

      return Math.round(Math.floor(end-start)/vars.data.time.stepDivider)

    }

    var step = vars.data.time.step, total = vars.data.time.total
    periods.forEach(function(p,i){

      if (!vars.data.time.stepType && (i === periods.length-1 || Math.round(step) < conversions[i])) {
        vars.data.time.stepType = p
        var start = vars.data.time.values[0]
          , end = vars.data.time.values[vars.data.time.values.length-1]
        vars.data.time.stepIntervals = getDiff(start,end,i)
      }

      if (!vars.data.time.totalType && (i === periods.length-1 || Math.round(total) < conversions[i])) {
        vars.data.time.totalType = p
      }

      step = step/conversions[i]
      total = total/conversions[i]
    })

    vars.data.time.values.forEach(function(y,i){
      if (i != 0) {
        var prev = vars.data.time.values[0]
        // console.log(periods.indexOf(vars.data.time.stepType))
        vars.data.time.dataSteps.push(getDiff(prev,y,periods.indexOf(vars.data.time.stepType)))
      }
      else {
        vars.data.time.dataSteps = [0]
      }
    })

    var stepType = vars.data.time.stepType
      , totalType = vars.data.time.totalType
      , locale = vars.format.locale.value

    var getFormat = function(s,t,small) {

      if (s === t) {
        return small && locale.timeFormat[s+"Small"] ? locale.timeFormat[s+"Small"] : locale.timeFormat[s]
      }
      else {
        if (periods.indexOf(s) >= 4 || periods.indexOf(t) <= 3) {
          return locale.timeFormat[t+"-"+s]
        }
        else {

          if (t === "Date") {
            var format = locale.timeFormat[t]
          }
          else {
            var format = locale.timeFormat[t+"-Date"]
          }

          if (s === "Hours") {
            return format +" "+ locale.timeFormat[s]
          }
          else {
            return format +" "+ locale.timeFormat["Hours-"+s]
          }

        }
      }

    }

    var multi = []
      , functions = [
        , function(d) { return d.getMilliseconds(); }
        , function(d) { return d.getSeconds(); }
        , function(d) { return d.getMinutes(); }
        , function(d) { return d.getHours(); }
        , function(d) { return d.getDate() != 1; }
        , function(d) { return d.getMonth(); }
        , function() { return true; }
      ]

    for (var i = periods.indexOf(stepType); i <= periods.indexOf(totalType); i++) {
      var prev = i-1 < periods.indexOf(stepType) ? periods[i] : periods[i-1]
      var small = periods[i] === prev && stepType !== totalType
      var format = getFormat(prev,periods[i],small)
      multi.push([format,functions[i+1]])
    }

    vars.data.time.format = d3.locale(locale.format).timeFormat(getFormat(stepType,totalType))
    vars.data.time.multiFormat = d3.locale(locale.format).timeFormat.multi(multi)

    vars.data.time.ticks = []
    var min = d3.min(vars.data.time.values)
    for (var i = 0; i <= vars.data.time.stepIntervals; i++) {
      var d = new Date(min)
      d["set"+vars.data.time.stepType](d["get"+vars.data.time.stepType]() + i)
      vars.data.time.ticks.push(d)
    }

    if ( vars.dev.value ) d3plus.console.timeEnd( timerString )

  }

  if ( vars.dev.value ) {
    var timerString = "nesting data by time and depths"
    d3plus.console.time( timerString )
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Gets all unique time values
  //----------------------------------------------------------------------------
  vars.data.nested = {}
  if (vars.data.time.values.length === 0) {

    vars.data.nested.all = {}
    vars.id.nesting.forEach( function( depth , i ) {

      var nestingDepth = vars.id.nesting.slice( 0 , i + 1 )

      vars.data.nested.all[ depth ] = dataNest( vars
                                                      , vars.data.value
                                                      , nestingDepth )

    })

  }
  else {

    vars.data.time.values.forEach( function( t ) {

      var ms = t.getTime()

      vars.data.nested[ ms ] = { }

      var timeData = vars.data.value.filter( function(d) {
        var d = new Date(fetchValue( vars , d , vars.time.value ).toString())
        d.setTime( d.getTime() + d.getTimezoneOffset() * 60 * 1000 )
        return d.getTime() === ms
      })

      vars.id.nesting.forEach( function( depth , i ) {

        var nestingDepth = vars.id.nesting.slice( 0 , i + 1 )

        vars.data.nested[ ms ][ depth ] = dataNest( vars
                                                         , timeData
                                                         , nestingDepth )

      })

    })

  }

  if ( vars.dev.value ) d3plus.console.timeEnd( timerString )

}
