var dataNest   = require("./nest.js"),
    fetchValue = require("../fetch/value.coffee"),
    print      = require("../console/print.coffee"),
    uniques    = require("../../util/uniques.coffee");
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats raw data by time and nesting
//------------------------------------------------------------------------------
module.exports = function( vars ) {

  var timerString;

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Gets all unique time values
  //----------------------------------------------------------------------------
  vars.data.time = {"values": []};
  if (vars.time && vars.time.value) {

    if ( vars.dev.value ) {
      timerString = "analyzing time periods";
      print.time( timerString );
    }

    vars.data.time.values = uniques(vars.data.value, vars.time.value, fetchValue, vars);

    vars.data.time.values.sort(function(a,b){ return a-b; });

    var step = [];
    vars.data.time.values.forEach(function(y,i){
      if (i !== 0) {
        var prev = vars.data.time.values[i-1];
        step.push(y-prev);
        if (i === vars.data.time.values.length - 1) {
          vars.data.time.total = y - vars.data.time.values[0];
        }
      }
    });

    step = d3.min(step);
    vars.data.time.step = step;

    var periods = ["Milliseconds","Seconds","Minutes","Hours","Date","Month","FullYear"],
        conversions = [1000,60,60,24,30,12,1];

    vars.data.time.periods = periods;

    var getDiff = function(start,end,i) {

      if (!vars.data.time.stepDivider) {
        arr = conversions.slice(0,i);
        if (arr.length) {
          vars.data.time.stepDivider = arr.reduce(function(a,b){ return a*b; });
        }
        else {
          vars.data.time.stepDivider = 1;
        }
      }

      return Math.round(Math.floor(end-start)/vars.data.time.stepDivider);

    };

    var total = vars.data.time.total;
    periods.forEach(function(p,i){
      var c = p === "Date" ? 28 : conversions[i];
      if (!vars.data.time.stepType && (i === periods.length-1 || Math.round(step) < c)) {
        vars.data.time.stepType = p;
        var start = vars.data.time.values[0],
            end = vars.data.time.values[vars.data.time.values.length-1];
        vars.data.time.stepIntervals = getDiff(start,end,i);
      }

      if (!vars.data.time.totalType && (i === periods.length-1 || Math.round(total) < c)) {
        vars.data.time.totalType = p;
      }

      step = step/c;
      total = total/c;
    });

    vars.data.time.values.forEach(function(y,i){
      if (i !== 0) {
        var prev = vars.data.time.values[0];
        vars.data.time.dataSteps.push(getDiff(prev,y,periods.indexOf(vars.data.time.stepType)));
      }
      else {
        vars.data.time.dataSteps = [0];
      }
    });

    var userFormat = vars.time.format.value,
        locale = vars.format.locale.value,
        functions = [
          function(d) { return d.getMilliseconds(); },
          function(d) { return d.getSeconds(); },
          function(d) { return d.getMinutes(); },
          function(d) { return d.getHours(); },
          function(d) { return d.getDate() != 1; },
          function(d) { return d.getMonth(); },
          function(d) { return true; }
        ];

    vars.data.time.functions = functions;

    var getFormat = function(s,t,small) {

      if (s === t) {
        return small && locale.timeFormat[s+"Small"] ? locale.timeFormat[s+"Small"] : locale.timeFormat[s];
      }
      else {
        if (periods.indexOf(s) >= 4 || periods.indexOf(t) <= 3) {
          return locale.timeFormat[t+"-"+s];
        }
        else {

          var format;

          if (t === "Date") {
            format = locale.timeFormat[t];
          }
          else {
            format = locale.timeFormat[t+"-Date"];
          }

          if (s === "Hours") {
            return format +" "+ locale.timeFormat[s];
          }
          else {
            return format +" "+ locale.timeFormat["Hours-"+s];
          }

        }
      }

    };

    vars.data.time.getFormat = getFormat;

    if (userFormat) {

      if (typeof userFormat === "string") {
        vars.data.time.format = d3.locale(locale.format).timeFormat(userFormat);
      }
      else if (typeof userFormat === "function") {
        vars.data.time.format = userFormat;
      }
      else if (userFormat instanceof Array) {
        vars.data.time.format = d3.locale(locale.format).timeFormat.multi(userFormat);
      }
      vars.data.time.multiFormat = vars.data.time.format;

    }
    else {

      var stepType = vars.data.time.stepType,
          totalType = vars.data.time.totalType;

      var multi = [];

      for (var p = periods.indexOf(stepType); p <= periods.indexOf(totalType); p++) {
        var prev = p-1 < periods.indexOf(stepType) ? periods[p] : periods[p-1];
        var small = periods[p] === prev && stepType !== totalType;
        var format = getFormat(prev,periods[p],small);
        multi.push([format,functions[p]]);
      }

      vars.data.time.format = d3.locale(locale.format).timeFormat(getFormat(stepType,totalType));
      if (multi.length > 1) {
        multi[multi.length-1][1] = function (d) { return true; }
        vars.data.time.multiFormat = d3.locale(locale.format).timeFormat.multi(multi);
      }
      else {
        vars.data.time.multiFormat = vars.data.time.format;
      }

    }

    vars.data.time.ticks = [];
    var min = d3.min(vars.data.time.values);
    var max = d3.max(vars.data.time.values);
    for (var s = 0; s <= vars.data.time.stepIntervals; s++) {
      var m = new Date(min);
      m["set"+vars.data.time.stepType](m["get"+vars.data.time.stepType]() + s);
      if (m <= max) vars.data.time.ticks.push(m);
    }

    if ( vars.dev.value ) print.timeEnd( timerString );

  }

  if ( vars.dev.value ) {
    timerString = "nesting data by time and depths";
    print.time( timerString );
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Gets all unique time values
  //----------------------------------------------------------------------------
  vars.data.nested = {};
  if (vars.data.time.values.length === 0) {

    vars.data.nested.all = {};
    vars.id.nesting.forEach( function( depth , i ) {

      var nestingDepth = vars.id.nesting.slice( 0 , i + 1 );
      vars.data.nested.all[ depth ] = dataNest(vars, vars.data.value, nestingDepth);

    });

  }
  else {

    var timeData = vars.data.value.reduce(function(o, d){
      var ms = fetchValue(vars, d, vars.time.value).getTime();
      if (!(ms in o)) o[ms] = [];
      o[ms].push(d);
      return o;
    }, {});

    vars.data.time.values.forEach( function( t ) {

      var ms = t.getTime();

      vars.data.nested[ms] = {};

      vars.id.nesting.forEach( function( depth , i ) {
        var nestingDepth = vars.id.nesting.slice(0, i + 1);
        vars.data.nested[ ms ][ depth ] = dataNest(vars, timeData[ms], nestingDepth);
      });

    });

  }

  if ( vars.dev.value ) print.timeEnd( timerString );

};
