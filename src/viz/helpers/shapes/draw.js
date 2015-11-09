var child         = require("../../../util/child.coffee"),
    closest       = require("../../../util/closest.coffee"),
    createTooltip = require("../tooltip/create.js"),
    events        = require("../../../client/pointer.coffee"),
    fetchValue    = require("../../../core/fetch/value.coffee"),
    fetchColor    = require("../../../core/fetch/color.coffee"),
    fetchText     = require("../../../core/fetch/text.js"),
    legible       = require("../../../color/legible.coffee"),
    print         = require("../../../core/console/print.coffee"),
    removeTooltip = require("../../../tooltip/remove.coffee"),
    segments      = require("./segments.coffee"),
    shapeFill     = require("./fill.js"),
    stringStrip   = require("../../../string/strip.js"),
    touch         = require("../../../client/touch.coffee"),
    touchEvent    = require("../zoom/propagation.coffee"),
    uniqueValues  = require("../../../util/uniques.coffee"),
    validObject   = require("../../../object/validate.coffee"),
    zoomDirection = require("../zoom/direction.coffee");

var drawShape = {
  "arc":           require("./arc.coffee"),
  "area":          require("./area.js"),
  "check":         require("./check.js"),
  "coordinates":   require("./coordinates.coffee"),
  "cross":         require("./cross.js"),
  "diamond":       require("./diamond.js"),
  "donut":         require("./donut.js"),
  "line":          require("./line.js"),
  "radial":        require("./radial.coffee"),
  "rect":          require("./rect.coffee"),
  "triangle_down": require("./triangle_down.js"),
  "triangle_up":   require("./triangle_up.js"),
  "whisker":       require("./whisker.coffee")
};

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws the appropriate shape based on the data
//------------------------------------------------------------------------------
module.exports = function(vars) {

  var data = vars.returned.nodes || [],
      edges = vars.returned.edges || [];

  vars.draw.timing = data.length < vars.data.large &&
                     edges.length < vars.edges.large ?
                     vars.timing.transitions : 0;

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Match vars.shape types to their respective d3plus.shape functions. For
  // example, both "square", and "circle" shapes use "rect" as their drawing
  // class.
  //----------------------------------------------------------------------------
  var shapeLookup = {
    "arc":           "arc",
    "area":          "area",
    "check":         "check",
    "circle":        "rect",
    "coordinates":   "coordinates",
    "cross":         "cross",
    "donut":         "donut",
    "diamond":       "diamond",
    "line":          "line",
    "plus":          "cross",
    "radial":        "radial",
    "rect":          "rect",
    "square":        "rect",
    "triangle_down": "triangle_down",
    "triangle":      "triangle_up",
    "triangle_up":   "triangle_up",
    "whisker":       "whisker"
  };

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Split the data by each shape type in the data.
  //----------------------------------------------------------------------------
  var shapes = {};
  data.forEach(function(d){
    var s = d.d3plus && d.d3plus.shape ? d.d3plus.shape : vars.shape.value;
    if (s in shapeLookup) {
      if (d.d3plus) d.d3plus.shape = s
      s = shapeLookup[s]
      if (!shapes[s]) shapes[s] = []
      shapes[s].push(d)
    }
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Resets the "id" of each data point to use with matching.
  //----------------------------------------------------------------------------
  function id(d) {

    if (!d.d3plus.id) {
      d.d3plus.id = ""
      for (var i = 0; i <= vars.depth.value; i++) {
        d.d3plus.id += fetchValue(vars,d,vars.id.nesting[i])+"_"
      }

      d.d3plus.id += shape;

      ["x", "y", "x2", "y2"].forEach(function(axis){
        if (vars[axis].scale.value == "discrete") {
          var val = fetchValue(vars, d, vars[axis].value)
          if (val.constructor === Date) val = val.getTime()
          d.d3plus.id += "_"+val
        }
      })

      d.d3plus.id = stringStrip(d.d3plus.id)
    }

    return d
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Transforms the positions and scale of each group.
  //----------------------------------------------------------------------------
  function transform(g,grow) {

    var scales = vars.types[vars.type.value].scale,
        scale = 1;
    if (scales) {
      if (validObject[scales] && vars.shape.value in scales) {
        scale = scales[vars.shape.value];
      }
      else if (typeof scales == "function") {
        scale = scales(vars, vars.shape.value);
      }
      else if (typeof scales == "number") {
        scale = scales;
      }
    }

    scale = grow ? scale : 1;
    g.attr("transform", function(d){

      if (["line", "area", "coordinates"].indexOf(shape) < 0) {
          var x = d.d3plus.x || 0, y = d.d3plus.y || 0;
          return "translate("+x+","+y+")scale("+scale+")";
      }
      else {
        return "scale("+scale+")";
      }

    });

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sets the class name for a group
  //----------------------------------------------------------------------------
  function className(g) {
    g.attr("class", function(d){
      var c = vars.class.value ? " " + fetchValue(vars, d, vars.class.value) : "";
      return "d3plus_" + shape + c;
    });
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Remove old groups
  //----------------------------------------------------------------------------
  for (var s in shapeLookup) {
    if (!(shapeLookup[s] in shapes) || d3.keys(shapes).length === 0) {
      var oldShapes = vars.g.data.selectAll("g.d3plus_"+shapeLookup[s]);
      if (vars.draw.timing) {
        oldShapes
          .transition().duration(vars.draw.timing)
          .attr("opacity",0)
          .remove();
      }
      else {
        oldShapes
          .remove();
      }
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialize arrays for labels and sizes
  //----------------------------------------------------------------------------
  var labels = [], shares = [];

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create groups by shape, apply data, and call specific shape drawing class.
  //----------------------------------------------------------------------------
  for (var shape in shapes) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind Data to Groups
    //--------------------------------------------------------------------------
    var selection = vars.g.data.selectAll("g.d3plus_"+shape)
      .data(shapes[shape],function(d){

        if (!d.d3plus) d.d3plus = {}

        if ( shape === "coordinates" ) {
          d.d3plus.id = d.id
          return d.id
        }

        if ( !d.d3plus.id ) {

          if (d.values) {

            d.values.forEach(function(v){
              v = id(v)
              v.d3plus.shape = "circle"
            })
            d.d3plus.id = d.key

          }
          else {

            d = id(d)

            if (!d.d3plus.segments) {

              d.d3plus.segments = {"donut": Math.PI*2}
              var active = segments(vars, d, "active"),
                  temp   = segments(vars, d, "temp"),
                  total  = segments(vars, d, "total");

              if (total) {
                if (active) {
                  d.d3plus.segments.active = (active/total) * (Math.PI * 2)
                }
                else {
                  d.d3plus.segments.active = 0
                }
                if (temp) {
                  d.d3plus.segments.temp = ((temp/total) * (Math.PI * 2)) + d.d3plus.segments.active
                }
                else {
                  d.d3plus.segments.temp = 0
                }
              }

            }

          }

        }

        return d.d3plus ? d.d3plus.id : false;

      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Exit
    //--------------------------------------------------------------------------
    if (vars.draw.timing) {
      var exit = selection.exit()
        .transition().duration(vars.draw.timing)
        .attr("opacity",0)
        .remove()
    }
    else {
      var exit = selection.exit()
        .remove()
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Existing Groups Update
    //--------------------------------------------------------------------------
    if (vars.draw.timing) {
      selection
        .transition().duration(vars.draw.timing)
        .call(transform)
        .call(className);
    }
    else {
      selection.call(transform).call(className);
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Enter
    //--------------------------------------------------------------------------
    var opacity = vars.draw.timing ? 0 : 1
    var enter = selection.enter().append("g")
      .attr("opacity",opacity)
      .call(transform)
      .call(className);

    if (vars.draw.timing) {
      enter.transition().duration(vars.draw.timing)
        .attr("opacity",1)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // All Groups Sort Order
    //--------------------------------------------------------------------------
    selection.order()

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Draw appropriate graphics inside of each group
    //--------------------------------------------------------------------------
    if ( vars.dev.value ) print.time("drawing \"" + shape + "\" shapes")
    drawShape[shape]( vars , selection , enter , exit , transform )
    if ( vars.dev.value ) print.timeEnd("drawing \"" + shape + "\" shapes")

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Check for active and temp fills for rects and donuts
    //--------------------------------------------------------------------------
    if (["rect","donut"].indexOf(shape) >= 0 && vars.types[vars.type.value].fill) {
      if ( vars.dev.value ) print.time("filling \"" + shape + "\" shapes")
      shapeFill( vars , selection , enter , exit , transform )
      if ( vars.dev.value ) print.timeEnd("filling \"" + shape + "\" shapes")
    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function to Update Edges
  //----------------------------------------------------------------------------
  function edge_update(d) {

    if (d && vars.g.edges.selectAll("g").size() > 0) {

      vars.g.edge_hover
        .selectAll("*")
        .remove()

      vars.g.edges.selectAll("g")
        .each(function(l){

          var id = d[vars.id.value],
              source = l[vars.edges.source][vars.id.value],
              target = l[vars.edges.target][vars.id.value]

          if (source == id || target == id) {
            var elem = vars.g.edge_hover.node().appendChild(this.cloneNode(true))
            d3.select(elem).datum(l).attr("opacity",1)
              .selectAll("line, path").datum(l)
          }

        })


      var marker = vars.edges.arrows.value

      vars.g.edge_hover
        .attr("opacity",0)
        .selectAll("line, path")
          .style("stroke",vars.color.primary)
          .style("stroke-width",function(){
            return vars.edges.size.value ? d3.select(this).style("stroke-width")
                 : vars.data.stroke.width*2
          })
          .attr("marker-start",function(e){

            var direction = vars.edges.arrows.direction.value

            if ("bucket" in e.d3plus) {
              var d = "_"+e.d3plus.bucket
            }
            else {
              var d = ""
            }

            return direction == "source" && marker
                 ? "url(#d3plus_edge_marker_highlight"+d+")" : "none"

          })
          .attr("marker-end",function(e){

            var direction = vars.edges.arrows.direction.value

            if ("bucket" in e.d3plus) {
              var d = "_"+e.d3plus.bucket
            }
            else {
              var d = ""
            }

            return direction == "target" && marker
                 ? "url(#d3plus_edge_marker_highlight"+d+")" : "none"

          })


      vars.g.edge_hover.selectAll("text")
        .style("fill",vars.color.primary)

      if (vars.draw.timing) {

        vars.g.edge_hover
          .transition().duration(vars.timing.mouseevents)
          .attr("opacity",1)

        vars.g.edges
          .transition().duration(vars.timing.mouseevents)
          .attr("opacity",0.5)

      }
      else {

        vars.g.edge_hover
          .attr("opacity",1)

      }

    }
    else {

      if (vars.draw.timing) {

        vars.g.edge_hover
          .transition().duration(vars.timing.mouseevents)
          .attr("opacity",0)
          .transition()
          .selectAll("*")
          .remove()

        vars.g.edges
          .transition().duration(vars.timing.mouseevents)
          .attr("opacity",1)

      }
      else {

        vars.g.edge_hover
          .selectAll("*")
          .remove()

      }

    }

  }

  edge_update()

  if (!touch && vars.tooltip.value) {

    vars.g.data.selectAll("g")
      .on(events.over,function(d){

        if (vars.mouse.value && vars.mouse.over.value && !vars.draw.frozen && (!d.d3plus || !d.d3plus.static)) {

          if (typeof vars.mouse.over.value === "function") {
            vars.mouse.over.value(d, vars.self);
          }
          else {

            d3.select(this).style("cursor","pointer")
              .transition().duration(vars.timing.mouseevents)
              .call(transform,true)

            d3.select(this).selectAll(".d3plus_data")
              .transition().duration(vars.timing.mouseevents)
              .attr("opacity",1)

            vars.covered = false

            if (d.values && vars.axes.discrete) {

              var index = vars.axes.discrete === "x" ? 0 : 1
                , mouse = d3.mouse(vars.container.value.node())[index]
                , positions = uniqueValues(d.values,function(x){return x.d3plus[vars.axes.discrete]})
                , match = closest(positions,mouse)

              d.d3plus_data = d.values[positions.indexOf(match)]
              d.d3plus = d.values[positions.indexOf(match)].d3plus

            }

            var tooltip_data = d.d3plus_data ? d.d3plus_data : d

            createTooltip({
              "vars": vars,
              "data": tooltip_data
            })

            if (typeof vars.mouse.viz == "function") {
              vars.mouse.viz(d.d3plus_data || d, vars)
            }
            else if (vars.mouse.viz[events.over]) {
              vars.mouse.viz[events.over](d.d3plus_data || d, vars)
            }

            edge_update(d)

          }

        }

      })
      .on(events.move,function(d){

        if (vars.mouse.value && vars.mouse.move.value && !vars.draw.frozen && (!d.d3plus || !d.d3plus.static)) {

          if (typeof vars.mouse.move.value === "function") {
            vars.mouse.move.value(d, vars.self);
          }
          else {

            // vars.covered = false
            var tooltipType = vars.types[vars.type.value].tooltip || "follow"

            if (d.values && vars.axes.discrete) {

              var index = vars.axes.discrete === "x" ? 0 : 1
                , mouse = d3.mouse(vars.container.value.node())[index]
                , positions = uniqueValues(d.values,function(x){return x.d3plus[vars.axes.discrete]})
                , match = closest(positions,mouse)

              d.d3plus_data = d.values[positions.indexOf(match)]
              d.d3plus = d.values[positions.indexOf(match)].d3plus

            }

            var tooltip_data = d.d3plus_data ? d.d3plus_data : d
            createTooltip({
              "vars": vars,
              "data": tooltip_data
            })

            if (typeof vars.mouse.viz == "function") {
              vars.mouse.viz(d.d3plus_data || d, vars)
            }
            else if (vars.mouse.viz[events.move]) {
              vars.mouse.viz[events.move](d.d3plus_data || d, vars)
            }

          }

        }

      })
      .on(events.out,function(d){

        if (vars.mouse.value && vars.mouse.out.value) {

          if (typeof vars.mouse.out.value === "function") {
            vars.mouse.out.value(d, vars.self);
          }
          else {

            var childElement = child(this,d3.event.toElement)

            if (!childElement && !vars.draw.frozen && (!d.d3plus || !d.d3plus.static)) {

              d3.select(this)
                .transition().duration(vars.timing.mouseevents)
                .call(transform)

              d3.select(this).selectAll(".d3plus_data")
                .transition().duration(vars.timing.mouseevents)
                .attr("opacity",vars.data.opacity)

              if (!vars.covered) {
                removeTooltip(vars.type.value)
              }

              if (typeof vars.mouse.viz == "function") {
                vars.mouse.viz(d.d3plus_data || d, vars)
              }
              else if (vars.mouse.viz[events.out]) {
                vars.mouse.viz[events.out](d.d3plus_data || d, vars)
              }

              edge_update()

            }

          }

        }

      })

  }
  else {

    var mouseEvent = function() {
      touchEvent(vars, d3.event)
    }

    vars.g.data.selectAll("g")
      .on(events.over, mouseEvent)
      .on(events.move, mouseEvent)
      .on(events.out , mouseEvent)

  }

  vars.g.data.selectAll("g")
    .on(events.click,function(d){

      if (vars.mouse.value && vars.mouse.click.value && !d3.event.defaultPrevented && !vars.draw.frozen && (!d.d3plus || !d.d3plus.static)) {

        if (typeof vars.mouse.click.value === "function") {
          vars.mouse.click.value(d, vars.self);
        }
        else {

          if (d.values && vars.axes.discrete) {

            var index = vars.axes.discrete === "x" ? 0 : 1
              , mouse = d3.mouse(vars.container.value.node())[index]
              , positions = uniqueValues(d.values,function(x){return x.d3plus[vars.axes.discrete]})
              , match = closest(positions,mouse)

            d.d3plus_data = d.values[positions.indexOf(match)]
            d.d3plus = d.values[positions.indexOf(match)].d3plus

          }

          if (typeof vars.mouse.viz == "function") {
            vars.mouse.viz(d.d3plus_data || d, vars)
          }
          else if (vars.mouse.viz[events.out]) {
            vars.mouse.viz[events.out](d.d3plus_data || d, vars)
          }
          else if (vars.mouse.viz[events.click]) {
            vars.mouse.viz[events.click](d.d3plus_data || d, vars)
          }

          var depth_delta = zoomDirection(d.d3plus_data || d, vars)
            , previous = vars.id.solo.value
            , title = fetchText(vars,d)[0]
            , color = legible(fetchColor(vars,d))
            , prev_sub = vars.title.sub.value || false
            , prev_color = vars.title.sub.font.color
            , prev_total = vars.title.total.font.color

          if (d.d3plus.threshold && d.d3plus.merged && vars.zoom.value) {

            vars.history.states.push(function(){

              vars.self
                .id({"solo": previous})
                .title({
                  "sub": {
                    "font": {
                      "color": prev_color
                    },
                    "value": prev_sub
                  },
                  "total": {
                    "font": {
                      "color": prev_total
                    }
                  }
                })
                .draw()

            })

            vars.self
              .id({"solo": previous.concat(uniqueValues(d.d3plus.merged, vars.id.value, fetchValue, vars))})
              .title({
                "sub": {
                  "font": {
                    "color": color
                  },
                  "value": title
                },
                "total": {
                  "font": {
                    "color": color
                  }
                }
              })
              .draw()

          }
          else if (depth_delta === 1 && vars.zoom.value) {

            var id = fetchValue(vars, d.d3plus_data || d, vars.id.value)

            vars.history.states.push(function(){

              vars.self
                .depth(vars.depth.value-1)
                .id({"solo": previous})
                .title({
                  "sub": {
                    "font": {
                      "color": prev_color
                    },
                    "value": prev_sub
                  },
                  "total": {
                    "font": {
                      "color": prev_total
                    }
                  }
                })
                .draw()

            })

            vars.self
              .depth(vars.depth.value+1)
              .id({"solo": previous.concat(id)})
              .title({
                "sub": {
                  "font": {
                    "color": color
                  },
                  "value": title
                },
                "total": {
                  "font": {
                    "color": color
                  }
                }
              })
              .draw()

          }
          else if (depth_delta === -1 && vars.zoom.value &&
                   vars.history.states.length && !vars.tooltip.value.long) {

            vars.history.back()

          }
          else if (vars.types[vars.type.value].zoom && vars.zoom.value) {

            edge_update()

            d3.select(this)
              .transition().duration(vars.timing.mouseevents)
              .call(transform)

            d3.select(this).selectAll(".d3plus_data")
              .transition().duration(vars.timing.mouseevents)
              .attr("opacity",vars.data.opacity)

            removeTooltip(vars.type.value)
            vars.draw.update = false

            if (!d || d[vars.id.value] == vars.focus.value[0]) {
              vars.self.focus(false).draw()
            }
            else {
              vars.self.focus(d[vars.id.value]).draw()
            }

          }
          else if (vars.types[vars.type.value].requirements.indexOf("focus") < 0) {

            edge_update()

            var tooltip_data = d.d3plus_data ? d.d3plus_data : d

            createTooltip({
              "vars": vars,
              "data": tooltip_data
            })

          }

        }

      }

    })

}
