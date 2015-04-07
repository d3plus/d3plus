var copy       = require("../../../util/copy.coffee"),
    fetchColor = require("../../../core/fetch/color.coffee"),
    fetchValue = require("../../../core/fetch/value.coffee"),
    segments   = require("./segments.coffee"),
    shapeStyle = require("./style.coffee");
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
module.exports = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on enter and exit.
  //----------------------------------------------------------------------------
  function init(nodes) {

    nodes
      .attr("x",0)
      .attr("y",0)
      .attr("width",0)
      .attr("height",0);

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on update.
  //----------------------------------------------------------------------------
  function update(nodes,mod) {
    if (!mod) mod = 0;
    nodes
      .attr("x",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width;
        return (-w/2)-(mod/2);
      })
      .attr("y",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height;
        return (-h/2)-(mod/2);
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
        var rounded = ["circle","donut"].indexOf(vars.shape.value) >= 0;
        return rounded ? (w+mod)/2 : 0;
      })
      .attr("ry",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height;
        var rounded = ["circle","donut"].indexOf(vars.shape.value) >= 0;
        return rounded ? (h+mod)/2 : 0;
      })
      .attr("shape-rendering",function(d){
        if (["square"].indexOf(vars.shape.value) >= 0) {
          return vars.shape.rendering.value;
        }
        else {
          return "auto";
        }
      });
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // In order to correctly animate each donut's size and arcs, we need to store
  // it's previous values in a lookup object that does not get destroyed when
  // redrawing the visualization.
  //----------------------------------------------------------------------------
  if (!vars.arcs) {
    vars.arcs = {
      "donut": {},
      "active": {},
      "temp": {}
    };
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This is the main arc function that determines what values to use for each
  // arc angle and radius.
  //----------------------------------------------------------------------------
  var arc = d3.svg.arc()
    .startAngle(0)
    .endAngle(function(d){
      var a = vars.arcs[d.d3plus.shape][d.d3plus.id].a;
      return a > Math.PI*2 ? Math.PI*2 : a;
    })
    .innerRadius(function(d){
      if (!d.d3plus.static && vars.shape.value === "donut") {
        var r = vars.arcs[d.d3plus.shape][d.d3plus.id].r;
        return r * vars.data.donut.size;
      }
      else {
        return 0;
      }
    })
    .outerRadius(function(d){
      var r = vars.arcs[d.d3plus.shape][d.d3plus.id].r;
      return vars.shape.value === "donut" ? r : r*2;
    });

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This is the main "arcTween" function where all of the animation happens
  // for each arc.
  //----------------------------------------------------------------------------
  function size(path,mod,rad,ang) {
    if (!mod) mod = 0;
    if (typeof rad != "number") rad = undefined;
    if (typeof ang != "number") ang = undefined;
    path.attrTween("d", function(d){
      if (rad === undefined) var r = d.d3plus.r ? d.d3plus.r : d3.max([d.d3plus.width,d.d3plus.height]);
      else var r = rad;
      if (ang === undefined) var a = d.d3plus.segments[d.d3plus.shape];
      else var a = ang;
      if (!vars.arcs[d.d3plus.shape][d.d3plus.id]) {
        vars.arcs[d.d3plus.shape][d.d3plus.id] = {"r": 0};
        vars.arcs[d.d3plus.shape][d.d3plus.id].a = d.d3plus.shape === "donut" ? Math.PI * 2 : 0;
      }
      var radius = d3.interpolate(vars.arcs[d.d3plus.shape][d.d3plus.id].r,r+mod),
          angle = d3.interpolate(vars.arcs[d.d3plus.shape][d.d3plus.id].a,a);

      return function(t) {
        vars.arcs[d.d3plus.shape][d.d3plus.id].r = radius(t);
        vars.arcs[d.d3plus.shape][d.d3plus.id].a = angle(t);
        return arc(d);
      };
    });
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check each data point for active and temp data
  //----------------------------------------------------------------------------
  selection.each(function(d){

    var active = segments(vars, d, "active"),
        temp  = segments(vars, d, "temp"),
        total = segments(vars, d, "total"),
        group = d3.select(this),
        color = fetchColor(vars,d);

    var fill_data = [], hatch_data = [];

    if (total && vars.types[vars.type.value].fill) {

      if (temp) {
        var c = copy(d);
        c.d3plus.shape = "temp";
        fill_data.push(c);
        hatch_data = ["temp"];
      }

      if (active && (active < total || temp)) {
        var c = copy(d);
        c.d3plus.shape = "active";
        fill_data.push(c);
      }

    }

    function hatch_lines(l) {
      l
        .attr("stroke",color)
        .attr("stroke-width",1)
        .attr("shape-rendering",vars.shape.rendering.value);
    }

    var pattern = vars.defs.selectAll("pattern#d3plus_hatch_"+d.d3plus.id)
      .data(hatch_data);

    if (vars.draw.timing) {

      pattern.selectAll("rect")
        .transition().duration(vars.draw.timing)
        .style("fill",color);

      pattern.selectAll("line")
        .transition().duration(vars.draw.timing)
        .style("stroke",color);

    }
    else {

      pattern.selectAll("rect").style("fill",color);

      pattern.selectAll("line").style("stroke",color);

    }

    var pattern_enter = pattern.enter().append("pattern")
      .attr("id","d3plus_hatch_"+d.d3plus.id)
      .attr("patternUnits","userSpaceOnUse")
      .attr("x","0")
      .attr("y","0")
      .attr("width","10")
      .attr("height","10")
      .append("g");

    pattern_enter.append("rect")
      .attr("x","0")
      .attr("y","0")
      .attr("width","10")
      .attr("height","10")
      .attr("fill",color)
      .attr("fill-opacity",0.25);

    pattern_enter.append("line")
      .attr("x1","0")
      .attr("x2","10")
      .attr("y1","0")
      .attr("y2","10")
      .call(hatch_lines);

    pattern_enter.append("line")
      .attr("x1","-1")
      .attr("x2","1")
      .attr("y1","9")
      .attr("y2","11")
      .call(hatch_lines);

    pattern_enter.append("line")
      .attr("x1","9")
      .attr("x2","11")
      .attr("y1","-1")
      .attr("y2","1")
      .call(hatch_lines);

    var clip_data = fill_data.length ? [d] : [];

    var clip = group.selectAll("#d3plus_clip_"+d.d3plus.id)
      .data(clip_data);

    clip.enter().insert("clipPath",".d3plus_mouse")
      .attr("id","d3plus_clip_"+d.d3plus.id)
      .append("rect")
      .attr("class","d3plus_clipping")
      .call(init);

    if (vars.draw.timing) {

      clip.selectAll("rect").transition().duration(vars.draw.timing)
        .call(update);

      clip.exit().transition().delay(vars.draw.timing)
        .remove();

    }
    else {

      clip.selectAll("rect").call(update);

      clip.exit().remove();

    }

    var fills = group.selectAll("path.d3plus_fill")
      .data(fill_data);

    fills.transition().duration(vars.draw.timing)
      .call(shapeStyle,vars)
      .call(size);

    fills.enter().insert("path","rect.d3plus_mouse")
      .attr("class","d3plus_fill")
      .attr("clip-path","url(#d3plus_clip_"+d.d3plus.id+")")
      .transition().duration(0)
        .call(shapeStyle,vars)
        .call(size,0,undefined,0)
        .transition().duration(vars.draw.timing)
          .call(size)
          .call(shapeStyle,vars);

    fills.exit().transition().duration(vars.draw.timing)
      .call(size,0,undefined,0)
      .remove();

  });

};
