var dataFormat    = require("../../core/data/format.js"),
    dataColor     = require("../../core/data/color.js"),
    dataKeys      = require("../../core/data/keys.coffee"),
    dataLoad      = require("../../core/data/load.coffee"),
    drawDrawer    = require("./ui/drawer.js"),
    drawLegend    = require("./ui/legend.js"),
    drawTimeline  = require("./ui/timeline.coffee"),
    errorCheck    = require("./errorCheck.js"),
    fetchData     = require("../../core/fetch/data.js"),
    finish        = require("./finish.js"),
    focusTooltip  = require("./focus/tooltip.coffee"),
    history       = require("./ui/history.coffee"),
    parseEdges    = require("../../core/parse/edges.js"),
    parseNodes    = require("../../core/parse/nodes.js"),
    print         = require("../../core/console/print.coffee"),
    removeTooltip = require("../../tooltip/remove.coffee"),
    runType       = require("./types/run.coffee"),
    shapes        = require("./shapes/draw.js"),
    stringFormat  = require("../../string/format.js"),
    svgSetup      = require("./svg/enter.js"),
    svgUpdate     = require("./svg/update.js"),
    titles        = require("./ui/titles.js"),
    validObject   = require("../../object/validate.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculate steps needed to redraw the visualization
//------------------------------------------------------------------------------
module.exports = function(vars) {

  var steps       = []
    , appType     = vars.type.value
    , locale      = vars.format.locale.value
    , uiMessage   = locale.message.ui
    , drawMessage = locale.message.draw

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if any data needs to be loaded with JSON
  //----------------------------------------------------------------------------
  var urlLoads = [ "data" , "attrs" , "coords" , "nodes" , "edges" ]
  urlLoads.forEach(function(u){

    if (!vars.error.value && !vars[u].loaded && vars[u].url) {

      steps.push({
        "function": function( vars , next ){
          dataLoad( vars , u , next )
        },
        "message": locale.message.loading,
        "wait": true
      })

    }

  })

  if (vars.draw.update) {

    var appName     = locale.visualization[appType] || appType
      , appSetup    = vars.types[appType].setup || false
      , appReqs     = vars.types[appType].requirements || []
      , appMessage  = stringFormat(locale.message.initializing,appName)
      , dataMessage = locale.message.data

    if (!(appReqs instanceof Array)) appReqs = [appReqs]
    appName = appName.toLowerCase()

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it has one, run the current app's setup function.
    //--------------------------------------------------------------------------
    if (!vars.error.value && typeof appSetup === "function") {

      steps.push({
        "function": function( vars ) {

          if ( vars.dev.value ) {
            var timerString = "running " + appName + " setup"
            print.time( timerString )
          }

          appSetup( vars )

          if ( vars.dev.value ) print.timeEnd( timerString )

        },
        "message": appMessage
      })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create SVG group elements if the container is new or has changed
    //--------------------------------------------------------------------------
    if (vars.container.changed) {

      steps.push({ "function" : svgSetup , "message" : appMessage })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create group for current app, if it doesn't exist.
    //--------------------------------------------------------------------------
    if (!(appType in vars.g.apps)) {

      steps.push({
        "function": function( vars ) {

          if ( vars.dev.value ) {
            var timerString = "creating " + appName + " group"
            print.time( timerString )
          }

          vars.g.apps[appType] = vars.g.app.append("g")
            .attr("id", appType)
            .attr("opacity", 0);

          if ( vars.dev.value ) print.timeEnd( timerString )

        },
        "message": appMessage
      })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If new data is detected, analyze and reset it.
    //--------------------------------------------------------------------------
    if (vars.data.changed) {

      steps.push({
        "function": function(vars) {
          vars.data.cache = {}
          delete vars.nodes.restricted
          delete vars.edges.restricted
          dataKeys(vars, "data")
        },
        "message": dataMessage
      })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If new attributes are detected, analyze them.
    //--------------------------------------------------------------------------
    if (vars.attrs.changed) {

      steps.push({
        "function": function( vars ) {
          dataKeys(vars, "attrs")
        },
        "message": dataMessage
      })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Determine color type
    //--------------------------------------------------------------------------
    steps.push({
      "function": function(vars) {

          if (!vars.color.type || vars.color.changed || vars.data.changed ||
              vars.attrs.changed || vars.id.changed || vars.depth.changed ||
              (vars.time.fixed.value &&
                (vars.time.solo.changed || vars.time.mute.changed))) {

            vars.color.valueScale = false;

            if ( vars.dev.value ) {
              var timerString = "checking color type";
              print.time(timerString);
            }

            vars.color.type = false;

            if (vars.color.value) {

              var colorKey = vars.color.value;

              if ( validObject(colorKey) ) {
                if (colorKey[vars.id.value]) {
                  colorKey = colorKey[vars.id.value];
                }
                else {
                  colorKey = colorKey[d3.keys(colorKey)[0]];
                }
              }

              if (vars.data.keys && colorKey in vars.data.keys) {
                vars.color.type = vars.data.keys[colorKey];
              }
              else if (vars.attrs.keys && colorKey in vars.attrs.keys) {
                vars.color.type = vars.attrs.keys[colorKey];
              }

            }
            else if (vars.data.keys) {
              vars.color.type = vars.data.keys[vars.id.value];
            }

            if (vars.dev.value) print.timeEnd(timerString);

          }

      },
      "message": dataMessage
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Format nodes/edges if needed
    //--------------------------------------------------------------------------
    if ( appReqs.indexOf("edges") >= 0 && vars.edges.value
    && ( !vars.edges.linked || vars.edges.changed ) ) {
      steps.push({ "function" : parseEdges, "message" : dataMessage })
    }

    if ( appReqs.indexOf("nodes") >= 0 && vars.edges.value
    && ( !vars.nodes.positions || vars.nodes.changed || vars.type.changed ) ) {
      steps.push({ "function" : parseNodes , "message" : dataMessage })
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups data by time and nesting.
    //--------------------------------------------------------------------------
    if (vars.data.changed || vars.time.changed || vars.time.format.changed || vars.id.changed || (vars.x.scale.changed && [vars.x.scale.value, vars.x.scale.previous].indexOf("discrete") >= 0) || (vars.y.scale.changed && [vars.y.scale.value, vars.y.scale.previous].indexOf("discrete") >= 0)) {
      steps.push({ "function" : dataFormat , "message" : dataMessage })
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Fetches data for app and "pool"
    //--------------------------------------------------------------------------
    if (!vars.error.value) {
      steps.push({
        "function": function(vars) {

          var year = !vars.time.fixed.value ? ["all"] : null
          if (vars.dev.value) {
            var timerString = year ? "fetching pool data" : "fetching data"
            print.time( timerString )
          }
          vars.data.pool = fetchData( vars , year )
          if (vars.dev.value) print.timeEnd( timerString )
          if ( !year ) {
            vars.data.viz = vars.data.pool
          }
          else {
            if ( vars.dev.value ) print.time("fetching data for current year")
            vars.data.viz = fetchData( vars )
            if ( vars.dev.value ) print.timeEnd("fetching data for current year")
          }

          vars.draw.timing = vars.data.viz.length < vars.data.large ?
                             vars.timing.transitions : 0;

        },
        "message": dataMessage
      })
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Calculate color scale if type is number
    //--------------------------------------------------------------------------
    if (!vars.error.value) {
      steps.push({
        "check": function(vars) {

          return vars.color.value && vars.color.type === "number" &&
                 vars.color.valueScale === false

        },
        "function": dataColor,
        "message": dataMessage
      })

    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Remove any lingering tooltips.
  //----------------------------------------------------------------------------
  steps.push({
    "function": function(vars) {
      if ( vars.dev.value ) {
        var str = vars.format.locale.value.message.tooltipReset
        print.time(str)
      }
      if ( vars.type.previous && appType !== vars.type.previous ) {
        removeTooltip(vars.type.previous)
      }
      removeTooltip(appType)
      if ( vars.dev.value ) print.timeEnd(str)
    },
    "message": uiMessage
  })

  if (!vars.error.value) {
    steps.push({"function": errorCheck, "message": uiMessage})
  }

  steps.push({
    "function": function(vars) {

      vars.margin.process()
      titles(vars)

      if (!vars.error.value) {
        if (vars.draw.update) {

          drawDrawer(vars)
          drawTimeline(vars)
          drawLegend(vars)

        }
        else {

          if ( vars.dev.value ) print.time("calculating margins")

          var drawer = vars.container.value.select("div#d3plus_drawer").node().offsetHeight
                    || vars.container.value.select("div#d3plus_drawer").node().getBoundingClientRect().height

          var timeline = vars.g.timeline.node().getBBox()
          timeline = vars.timeline.value ? timeline.height+vars.ui.padding : 0

          var legend = vars.g.legend.node().getBBox()
          legend = vars.legend.value ? legend.height+vars.ui.padding : 0

          vars.margin.bottom += drawer+timeline+legend

          if ( vars.dev.value ) print.timeEnd("calculating margins")

        }
      }

      history(vars)
      vars.height.viz -= (vars.margin.top+vars.margin.bottom)
      vars.width.viz -= (vars.margin.left+vars.margin.right)

    },
    "message": uiMessage
  })

  if (!vars.error.value) {
    steps.push({
      "function": focusTooltip,
      "message": uiMessage
    })
  }

  steps.push({
    "function": svgUpdate,
    "message": drawMessage
  })

  if (!vars.error.value && vars.draw.update) {
    steps.push({
      "function" : [ runType, shapes ],
      "message"  : drawMessage
    })
  }

  steps.push({
    "function" : finish,
    "message" : drawMessage
  })

  return steps

}
