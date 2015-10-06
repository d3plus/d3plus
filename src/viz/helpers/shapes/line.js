var copy       = require("../../../util/copy.coffee"),
    closest    = require("../../../util/closest.coffee"),
    events     = require("../../../client/pointer.coffee"),
    shapeStyle = require("./style.coffee"),
    fetchValue = require("../../../core/fetch/value.coffee");

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "line" shapes using svg:line
//------------------------------------------------------------------------------
module.exports = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The D3 line function that determines what variables to use for x and y
  // positioning, as well as line interpolation defined by the user.
  //----------------------------------------------------------------------------
  var line = d3.svg.line()
    .x(function(d){ return d.d3plus.x; })
    .y(function(d){ return d.d3plus.y; })
    .interpolate(vars.shape.interpolate.value);

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Divide each line into it's segments. We do this so that there can be gaps
  // in the line and mouseover.
  //
  // Then, create new data group from values to become small nodes at each
  // point on the line.
  //----------------------------------------------------------------------------

  var stroke = vars.size.value || vars.data.stroke.width * 2,
      discrete = vars[vars.axes.discrete],
      hitarea = function(l){
        var s = stroke;
        if (s.constructor !== Number) {
          var v = fetchValue(vars, l, stroke);
          if (v && v.length) s = d3.max(v);
          else s = vars.data.stroke.width;
        }
        return s < 15 ? 15 : s;
      };

  var ticks = discrete.ticks.values.map(function(d){
    if (d.constructor === Date) return d.getTime();
    else return d;
  });

  selection.each(function(d){

    var lastIndex = false,
        segments = [],
        nodes = [],
        temp = copy(d),
        group = d3.select(this);

    temp.values = [];
    temp.segment_key = temp.key;
    d.values.forEach(function(v,i,arr){

      var k = fetchValue(vars, v, discrete.value);

      if (k.constructor === Date) k = k.getTime();

      var index = ticks.indexOf(closest(ticks,k));

      if (lastIndex === false || lastIndex === index - 1) {
        temp.values.push(v);
        temp.segment_key += "_" + index;
      }
      else {
        if (temp.values.length > 1) {
          segments.push(temp);
        }
        else {
          nodes.push(temp.values[0]);
        }
        temp = copy(d);
        temp.values = [v];
      }

      if ( i === arr.length - 1 ) {
        if (temp.values.length > 1) {
          segments.push(temp);
        }
        else {
          nodes.push(temp.values[0]);
        }
      }

      lastIndex = index;

    });

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind segment data to "paths"
    //--------------------------------------------------------------------------
    var paths = group.selectAll("path.d3plus_line")
      .data(segments, function(d){
        if (!d.d3plus) d.d3plus = {};
        d.d3plus.shape = "line";
        return d.segment_key;
      });

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind node data to "rects"
    //--------------------------------------------------------------------------
    var rects = group.selectAll("rect.d3plus_anchor")
      .data(nodes, function(d){
        if (!d.d3plus) d.d3plus = {};
        d.d3plus.r = vars.data.stroke.width * 2;
        return d.d3plus.id;
      });

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" and "rects" Enter/Update
    //--------------------------------------------------------------------------
    if (vars.draw.timing) {

      paths.exit().transition().duration(vars.draw.timing)
        .attr("opacity", 0)
        .remove();

      paths.transition().duration(vars.draw.timing)
        .attr("d",function(d){ return line(d.values); })
        .call(shapeStyle,vars);

      paths.enter().append("path")
        .attr("class","d3plus_line")
        .style("stroke-linecap","round")
        .attr("d", function(d){ return line(d.values); })
        .call(shapeStyle,vars)
        .attr("opacity", 0)
        .transition().duration(vars.draw.timing)
          .attr("opacity", 1);

      rects.enter().append("rect")
        .attr("class","d3plus_anchor")
        .attr("id",function(d){ return d.d3plus.id; })
        .call(init)
        .call(shapeStyle,vars);

      rects.transition().duration(vars.draw.timing)
        .call(update)
        .call(shapeStyle,vars);

      rects.exit().transition().duration(vars.draw.timing)
        .call(init)
        .remove();

    }
    else {

      paths.exit().remove();

      paths.enter().append("path")
        .attr("class","d3plus_line")
        .style("stroke-linecap","round");

      paths
        .attr("d",function(d){ return line(d.values); })
        .call(shapeStyle,vars);

      rects.enter().append("rect")
        .attr("class","d3plus_anchor")
        .attr("id",function(d){
          return d.d3plus.id;
        });

      rects.exit().remove();

      rects.call(update)
        .call(shapeStyle,vars);

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create mouse event lines
    //--------------------------------------------------------------------------
    var mouse = group.selectAll("path.d3plus_mouse")
      .data(segments, function(d){
        return d.segment_key;
      });

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Enter
    //--------------------------------------------------------------------------
    mouse.enter().append("path")
      .attr("class","d3plus_mouse")
      .attr("d", function(l){ return line(l.values); })
      .style("stroke","black")
      .style("stroke-width",hitarea)
      .style("fill","none")
      .style("stroke-linecap","round")
      .attr("opacity",0);

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Update
    //--------------------------------------------------------------------------
    mouse
      .on(events.over,function(m){
        if (!vars.draw.frozen) mouseStyle(vars, this, stroke, 2);
      })
      .on(events.out,function(d){
        if (!vars.draw.frozen) mouseStyle(vars, this, stroke, 0);
      });

    if (vars.draw.timing) {

      mouse.transition().duration(vars.draw.timing)
        .attr("d",function(l){ return line(l.values); })
        .style("stroke-width",hitarea);

    }
    else {

      mouse.attr("d",function(l){ return line(l.values); })
        .style("stroke-width",hitarea);

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Exit
    //--------------------------------------------------------------------------
    mouse.exit().remove();

  });

};

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// The position and size of each anchor point on enter and exit.
//----------------------------------------------------------------------------
function init(n) {

  n
    .attr("x",function(d){
      return d.d3plus.x;
    })
    .attr("y",function(d){
      return d.d3plus.y;
    })
    .attr("width",0)
    .attr("height",0);

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// The position and size of each anchor point on update.
//----------------------------------------------------------------------------
function update(n,mod) {

  if (mod === undefined) mod = 0;

  n
    .attr("x",function(d){
      var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width;
      return d.d3plus.x - ((w/2)+(mod/2));
    })
    .attr("y",function(d){
      var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height;
      return d.d3plus.y - ((h/2)+(mod/2));
    })
    .attr("width",function(d){
      var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width;
      return w+mod;
    })
    .attr("height",function(d){
      var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height;
      return h+mod;
    })
    .attr("rx",function(d){
      var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width;
      return (w+mod)/2;
    })
    .attr("ry",function(d){
      var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height;
      return (h+mod)/2;
    });

}

function mouseStyle(vars, elem, stroke, mod) {

  var timing = vars.draw.timing ? vars.timing.mouseevents : 0;
  if (mod === undefined) mod = 0;

  if (timing) {

    d3.select(elem.parentNode).selectAll("path.d3plus_line")
    .transition().duration(timing)
    .style("stroke-width",function(l){
      var s = stroke;
      if (s.constructor !== Number) {
        var v = fetchValue(vars, l, stroke);
        if (v && v.length) s = d3.max(v);
        else s = vars.data.stroke.width;
      }
      return s + mod;
    });

    d3.select(elem.parentNode).selectAll("rect")
    .transition().duration(timing)
    .style("stroke-width",function(l){
      var s = stroke;
      if (s.constructor !== Number) {
        var v = fetchValue(vars, l, stroke);
        if (v && v.length) s = d3.max(v);
        else s = vars.data.stroke.width;
      }
      return s;
    })
    .call(update, mod);

  }
  else {

    d3.select(elem.parentNode).selectAll("path.d3plus_line")
    .style("stroke-width",function(l){
      var s = stroke;
      if (s.constructor !== Number) {
        var v = fetchValue(vars, l, stroke);
        if (v && v.length) s = d3.max(v);
        else s = vars.data.stroke.width;
      }
      return s + mod;
    });

    d3.select(elem.parentNode).selectAll("rect")
    .style("stroke-width",function(l){
      var s = stroke;
      if (s.constructor !== Number) {
        var v = fetchValue(vars, l, stroke);
        if (v && v.length) s = d3.max(v);
        else s = vars.data.stroke.width;
      }
      return s;
    })
    .call(update, mod);
  }

}
