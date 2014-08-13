var dataFormat = require("../../core/data/format.js"),
    dataColor  = require("../../core/data/color.js"),
    dataKeys   = require("../../core/data/keys.js"),
    dataLoad   = require("../../core/data/load.coffee"),
    fetchData  = require("../../core/fetch/data.js"),
    parseEdges = require("../../core/parse/edges.js"),
    parseNodes = require("../../core/parse/nodes.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculate steps needed to redraw the visualization
//------------------------------------------------------------------------------
d3plus.draw.steps = function(vars) {

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

    if ( !vars[u].loaded && vars[u].url ) {

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
      , appMessage  = d3plus.string.format(locale.message.initializing,appName)
      , dataMessage = locale.message.data

    if (!(appReqs instanceof Array)) appReqs = [appReqs]
    appName = appName.toLowerCase()

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it has one, run the current app's setup function.
    //--------------------------------------------------------------------------
    if ( typeof appSetup === "function" ) {

      steps.push({
        "function": function( vars ) {

          if ( vars.dev.value ) {
            var timerString = "running " + appName + " setup"
            d3plus.console.time( timerString )
          }

          appSetup( vars )

          if ( vars.dev.value ) d3plus.console.timeEnd( timerString )

        },
        "message": appMessage
      })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create SVG group elements if the container is new or has changed
    //--------------------------------------------------------------------------
    if ( vars.container.changed ) {

      steps.push({ "function" : d3plus.draw.enter , "message" : appMessage })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create group for current app, if it doesn't exist.
    //--------------------------------------------------------------------------
    if ( !( appType in vars.g.apps ) ) {

      steps.push({
        "function": function( vars ) {

          if ( vars.dev.value ) {
            var timerString = "creating " + appName + " group"
            d3plus.console.time( timerString )
          }

          vars.g.apps[appType] = vars.g.app
            .selectAll("g#"+appType)
            .data([appType])

          vars.g.apps[appType].enter().append("g")
            .attr("id",appType)
            .attr("opacity",0)

          if ( vars.dev.value ) d3plus.console.timeEnd( timerString )

        },
        "message": appMessage
      })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If new data is detected, analyze and reset it.
    //--------------------------------------------------------------------------
    if ( vars.data.changed ) {

      steps.push({
        "function": function(vars) {
          vars.data.cache = {}
          delete vars.nodes.restricted
          delete vars.edges.restricted
          dataKeys( vars , "data" )
        },
        "message": dataMessage
      })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If new attributes are detected, analyze them.
    //--------------------------------------------------------------------------
    if ( vars.attrs.changed ) {

      steps.push({
        "function": function( vars ) {
          dataKeys( vars , "attrs" )
        },
        "message": dataMessage
      })

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Determine color type
    //--------------------------------------------------------------------------
    steps.push({
      "function": function(vars) {

          if ( vars.color.changed && vars.color.value ) {

            vars.color.valueScale = null

            if ( vars.dev.value ) {
              var timerString = "determining color type"
              d3plus.console.time( timerString )
            }

            var colorKey = vars.color.value

            if ( d3plus.object.validate(colorKey) ) {
              if (colorKey[vars.id.value]) {
                colorKey = colorKey[vars.id.value]
              }
              else {
                colorKey = colorKey[d3.keys(colorKey)[0]]
              }
            }

            if ( vars.data.keys && colorKey in vars.data.keys ) {
              vars.color.type = vars.data.keys[colorKey]
            }
            else if ( vars.attrs.keys && colorKey in vars.attrs.keys ) {
              vars.color.type = vars.attrs.keys[colorKey]
            }
            else {
              vars.color.type = undefined
            }

            if ( vars.dev.value ) d3plus.console.timeEnd( timerString )

          }
          else if (!vars.color.value) {
            vars.color.type = "keys" in vars.data
                            ? vars.data.keys[vars.id.value] : false
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
    && ( !vars.nodes.positions || vars.nodes.changed ) ) {
      steps.push({ "function" : parseNodes , "message" : dataMessage })
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups data by time and nesting.
    //--------------------------------------------------------------------------
    if ( vars.data.changed || vars.time.changed || vars.id.changed ) {
      steps.push({ "function" : dataFormat , "message" : dataMessage })
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Fetches data for app and "pool"
    //--------------------------------------------------------------------------
    steps.push({
      "function": function(vars) {

        var year = !vars.time.fixed.value ? ["all"] : null
        if ( vars.dev.value ) {
          var timerString = year ? "fetching pool data" : "fetching data"
          d3plus.console.time( timerString )
        }
        vars.data.pool = fetchData( vars , year )
        if ( vars.dev.value ) d3plus.console.timeEnd( timerString )
        if ( !year ) {
          vars.data.app = vars.data.pool
        }
        else {
          if ( vars.dev.value ) d3plus.console.time("fetching data for current year")
          vars.data.app = fetchData( vars )
          if ( vars.dev.value ) d3plus.console.timeEnd("fetching data for current year")
        }

      },
      "message": dataMessage
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Calculate color scale if type is number
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {

        return vars.color.value && vars.color.type === "number" &&
               vars.id.nesting.indexOf(vars.color.value) < 0 &&
               vars.data.value && vars.color.value != vars.id.value &&
                 (vars.color.changed || vars.data.changed || vars.depth.changed ||
                   (vars.time.fixed.value &&
                     (vars.time.solo.changed || vars.time.mute.changed)
                   )
                 )

      },
      "function": dataColor,
      "message": dataMessage
    })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Remove any lingering tooltips.
  //----------------------------------------------------------------------------
  steps.push({
    "function": function(vars) {
      if ( vars.dev.value ) {
        var str = vars.format.locale.value.message.tooltipReset
        d3plus.console.time(str)
      }
      if ( vars.type.previous && appType !== vars.type.previous ) {
        d3plus.tooltip.remove(vars.type.previous)
      }
      d3plus.tooltip.remove(appType)
      if ( vars.dev.value ) d3plus.console.timeEnd(str)
    },
    "message": uiMessage
  })

  steps.push({"function": d3plus.draw.errors, "message": uiMessage})

  steps.push({
    "function": function(vars) {

      vars.margin.process()
      d3plus.ui.titles(vars)

      if ( vars.draw.update ) {

        d3plus.ui.drawer(vars)
        d3plus.ui.timeline(vars)
        d3plus.ui.legend(vars)

      }
      else {

        if ( vars.dev.value ) d3plus.console.time("calculating margins")

        var drawer = vars.container.value.select("div#d3plus_drawer").node().offsetHeight
                  || vars.container.value.select("div#d3plus_drawer").node().getBoundingClientRect().height

        var timeline = vars.g.timeline.node().getBBox()
        timeline = vars.timeline.value ? timeline.height+timeline.y : 0

        var legend = vars.g.legend.node().getBBox()
        legend = vars.legend.value ? legend.height+legend.y : 0

        vars.margin.bottom += drawer+timeline+legend

        if ( vars.dev.value ) d3plus.console.timeEnd("calculating margins")

      }

      d3plus.ui.history(vars)
      vars.height.viz -= (vars.margin.top+vars.margin.bottom)
      vars.width.viz -= (vars.margin.left+vars.margin.right)

    },
    "message": uiMessage
  })

  steps.push({
    "function": d3plus.ui.focus,
    "message": uiMessage
  })

  steps.push({
    "function": d3plus.draw.update,
    "message": drawMessage
  })

  if ( vars.draw.update ) {
    steps.push({
      "function" : [ d3plus.draw.app
                   , d3plus.shape.draw ],
      "message"  : drawMessage
    })
  }

  steps.push({
    "function" : [ d3plus.draw.focus , d3plus.draw.finish ],
    "message" : drawMessage
  })

  return steps

}
