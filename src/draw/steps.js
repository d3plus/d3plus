//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculate steps needed to redraw the visualization
//------------------------------------------------------------------------------
d3plus.draw.steps = function(vars) {

  var steps = []

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if any data needs to be loaded with JSON
  //----------------------------------------------------------------------------
  var urlLoads = ["data","attrs","coords","nodes","edges"]
  urlLoads.forEach(function(u){
    if (typeof vars[u].value == "string" || (!vars[u].value && vars[u].url)) {

      steps.push({
        "function": function(vars,next){
          d3plus.data.json(vars,u,next)
        },
        "message": "Loading Data",
        "wait": true
      })

    }
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If it has one, run the current app's setup function.
  //----------------------------------------------------------------------------
  steps.push({
    "check": function(vars) {
      return vars.draw.update && typeof d3plus.visualization[vars.type.value].setup == "function"
    },
    "function": d3plus.visualization[vars.type.value].setup,
    "message": "Initializing \""+vars.type.value+"\""
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Remove any lingering tooltips.
  //----------------------------------------------------------------------------
  steps.push({
    "function": function(vars) {
      if (vars.type.previous && vars.type.value != vars.type.previous) {
        d3plus.tooltip.remove(vars.type.previous);
      }
      d3plus.tooltip.remove(vars.type.value);
    },
    "message": "Resetting Tooltips"
  })

  if (vars.draw.update) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create SVG group elements if the container is new or has changed
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return vars.container.changed
      },
      "function": d3plus.draw.enter,
      "message": "Creating SVG Elements"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create group for current app, if it doesn't exist.
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return !(vars.type.value in vars.g.apps)
      },
      "function": function(vars) {

        vars.g.apps[vars.type.value] = vars.g.app
          .selectAll("g#"+vars.type.value)
          .data([vars.type.value])

        vars.g.apps[vars.type.value].enter().append("g")
          .attr("id",vars.type.value)
          .attr("opacity",0)

      },
      "message": "Creating \""+vars.type.value+"\" Group"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If new data is detected, analyze and reset it.
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return vars.data.changed
      },
      "function": function(vars) {

        vars.data.filtered = null
        vars.data.grouped = null
        vars.data.app = null
        vars.data.restricted = null
        vars.nodes.restricted = null
        vars.edges.restricted = null

        d3plus.data.keys(vars,"data")

      },
      "message": "Analyzing New Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If new attributes are detected, analyze them.
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return vars.attrs.changed
      },
      "function": function(vars) {

        d3plus.data.keys(vars,"attrs")

      },
      "message": "Analyzing New Attributes"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Format nodes/edges if needed
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        var edge_req = d3plus.visualization[vars.type.value].requirements.indexOf("edges") >= 0
        return (!vars.edges.linked || vars.edges.changed)
          && edge_req && vars.edges.value
      },
      "function": d3plus.data.edges,
      "message": "Analyzing Network"
    })
    steps.push({
      "check": function(vars) {
        var node_req = d3plus.visualization[vars.type.value].requirements.indexOf("nodes") >= 0
        return node_req && (!vars.nodes.positions || vars.nodes.changed)
          && vars.nodes.value && vars.edges.value
      },
      "function": d3plus.data.nodes,
      "message": "Analyzing Network"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Filter Data if variables with "data_filter" have been changed
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {

        vars.check = []
        for (k in vars) {
          if (vars[k] && vars[k]["data_filter"] && vars[k].changed) {
            vars.check.push(k)
          }
        }

        return !vars.data.filtered || vars.check.length || vars.active.changed ||
          vars.temp.changed || vars.total.changed
      },
      "function": function(vars) {

        vars.data.grouped = null
        vars.data.app = null

        d3plus.data.filter(vars)

      },
      "message": "Filtering Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Restricts Filtered Data if objects have "Solo" or "Mute"
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        var restriction = vars.solo.length ? vars.solo : vars.mute
        return restriction.length > 0
      },
      "function": d3plus.data.restrict,
      "message": "Filtering Data",
      "otherwise": function(vars) {

        if ("restriction" in vars.data || !vars.data.restricted || vars.check.length) {

          vars.data.restricted = d3plus.util.copy(vars.data.filtered)
          vars.data.grouped = null
          vars.data.app = null
          vars.nodes.restricted = null
          vars.edges.restricted = null
          delete vars.data.restriction

        }

      }
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Formats Data to type "group", if it does not exist.
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return !vars.data.grouped
      },
      "function": function(vars) {
        vars.data.grouped = d3plus.data.format(vars,"grouped")
      },
      "message": "Formatting Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Fetches data "pool" to use for scales and overall values
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        var year = !vars.time.fixed.value ? ["all"] : null
        return (year === null && (vars.time.solo.changed || vars.time.mute.changed || vars.depth.changed)) || !vars.data.pool
          || typeof d3plus.visualization[vars.type.value].filter == "function"
      },
      "function": function(vars) {
        var year = !vars.time.fixed.value ? ["all"] : null
        vars.data.pool = d3plus.data.fetch(vars,"grouped",year)
        if (typeof d3plus.visualization[vars.type.value].filter == "function") {
          vars.data.pool = d3plus.visualization[vars.type.value].filter(vars,vars.data.pool)
        }
      },
      "message": "Formatting Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Fetch the correct Data for the App
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return !vars.data.app || vars.depth.changed ||
            vars.time.solo.changed || vars.time.mute.changed ||
            vars.solo.length || vars.mute.length
            || typeof d3plus.visualization[vars.type.value].filter == "function"
      },
      "function": function(vars) {
        vars.data.app = d3plus.data.fetch(vars,"grouped")
        if (typeof d3plus.visualization[vars.type.value].filter == "function") {
          vars.data.app = d3plus.visualization[vars.type.value].filter(vars,vars.data.app)
        }
      },
      "message": "Formatting Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Calculate color scale if type is number
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {

        if (vars.color.changed && vars.color.value) {

          if (typeof vars.color.value == "object") {
            if (vars.color.value[vars.id.value]) {
              var color_id = vars.color.value[vars.id.value]
            }
            else {
              var color_id = vars.color.value[Object.keys(vars.color.value)[0]]
            }
          }
          else {
            var color_id = vars.color.value
          }

          if (vars.data.keys && color_id in vars.data.keys) {
            vars.color.type = vars.data.keys[color_id]
          }
          else if (vars.attrs.keys && color_id in vars.attrs.keys) {
            vars.color.type = vars.attrs.keys[color_id]
          }
          else {
            vars.color.type = undefined
          }

        }
        else if (!vars.color.value) {
          vars.color.type = vars.data.keys[vars.id.value]
        }

        return vars.color.value && vars.color.type == "number" &&
               vars.id.nesting.indexOf(vars.color.value) < 0 &&
               vars.data.value && vars.color.value != vars.id.value &&
                 (vars.color.changed || vars.data.changed || vars.depth.changed ||
                   (vars.time.fixed.value &&
                     (vars.time.solo.changed || vars.time.mute.changed)
                   )
                 )

      },
      "function": d3plus.data.color,
      "message": "Calculating Colors",
      "otherwise": function(vars) {
        if (vars.color.type != "number") {
          vars.color.scale = null
        }
      }
    })

  }

  steps.push({
    "function": function(vars) {
      vars.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
      d3plus.ui.titles(vars)

      if (vars.draw.update) {

        d3plus.ui.timeline(vars)
        d3plus.ui.legend(vars)

      }
      else {

        var timeline = vars.g.timeline.node().getBBox()
        timeline = timeline.height+timeline.y

        var legend = vars.g.legend.node().getBBox()
        legend = legend.height+legend.y

        if (legend && timeline) {
          var padding = vars.ui.padding*3
        }
        else if (legend || timeline) {
          var padding = vars.ui.padding*2
        }
        else {
          var padding = 0
        }

        vars.margin.bottom += timeline+legend+padding

      }

      d3plus.ui.history(vars)
      vars.app_height -= (vars.margin.top+vars.margin.bottom)
    },
    "message": "Updating UI"
  })

  steps.push({
    "function": [
      d3plus.ui.focus,
      d3plus.draw.update
    ],
    "message": "Updating UI"
  })

  steps.push({
    "function": function(vars) {
      if (vars.draw.update) {
        d3plus.draw.errors(vars)
        d3plus.draw.app(vars)
        d3plus.shape.draw(vars)
      }
      d3plus.draw.focus(vars)
      d3plus.draw.finish(vars)
    },
    "message": "Drawing Visualization"
  })

  return steps

}
