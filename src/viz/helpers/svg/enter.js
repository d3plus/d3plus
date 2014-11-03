var events = require("../../../client/pointer.coffee"),
    prefix     = require("../../../client/prefix.coffee"),
    print      = require("../../../core/console/print.coffee"),
    touch      = require("../../../client/touch.coffee"),
    touchEvent = require("../zoom/propagation.coffee");

// Enter SVG Elements
module.exports = function(vars) {

  if ( vars.dev.value ) print.time("creating SVG elements");

  // Enter SVG
  vars.svg = vars.container.value.selectAll("svg#d3plus").data([0]);
  vars.svg.enter().insert("svg","#d3plus_message")
    .attr("id","d3plus")
    .attr("width",vars.width.value)
    .attr("height",vars.height.value)
    .attr("xmlns","http://www.w3.org/2000/svg")
    .attr("xmlns:xmlns:xlink","http://www.w3.org/1999/xlink");

  // Enter BG Rectangle
  vars.g.bg = vars.svg.selectAll("rect#bg").data(["bg"]);
  vars.g.bg.enter().append("rect")
    .attr("id","bg")
    .attr("fill",vars.background.value)
    .attr("width",vars.width.value)
    .attr("height",vars.height.value);

  // Enter Timeline Group
  vars.g.timeline = vars.svg.selectAll("g#timeline").data(["timeline"]);
  vars.g.timeline.enter().append("g")
    .attr("id","timeline")
    .attr("transform","translate(0,"+vars.height.value+")");

  // Enter Key Group
  vars.g.legend = vars.svg.selectAll("g#key").data(["key"]);
  vars.g.legend.enter().append("g")
    .attr("id","key")
    .attr("transform","translate(0,"+vars.height.value+")");

  // Enter Footer Group
  vars.g.footer = vars.svg.selectAll("g#footer").data(["footer"]);
  vars.g.footer.enter().append("g")
    .attr("id","footer")
    .attr("transform","translate(0,"+vars.height.value+")");

  // Enter App Clipping Mask
  var clipID = "clipping_" + vars.container.id;
  vars.g.clipping = vars.svg.selectAll("#clipping").data(["clipping"]);
  vars.g.clipping.enter().append("clipPath")
    .attr("id", clipID)
    .append("rect")
      .attr("width",vars.width.viz)
      .attr("height",vars.height.viz);

  // Enter Container Group
  vars.g.container = vars.svg.selectAll("g#container").data(["container"]);
  vars.g.container.enter().append("g")
    .attr("id","container")
    .attr("clip-path","url(#" + clipID + ")")
    .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")");

  // Enter Zoom Group
  vars.g.zoom = vars.g.container.selectAll("g#zoom").data(["zoom"]);
  vars.g.zoom.enter().append("g")
    .attr("id","zoom");

  // Enter App Background Group
  vars.g.viz = vars.g.zoom.selectAll("g#d3plus_viz").data(["d3plus_viz"]);
  vars.g.viz.enter().append("g")
    .attr("id","d3plus_viz");

  // Enter App Overlay Rect
  vars.g.overlay = vars.g.viz.selectAll("rect#d3plus_overlay").data([{"id":"d3plus_overlay"}]);
  vars.g.overlay.enter().append("rect")
    .attr("id","d3plus_overlay")
    .attr("width",vars.width.value)
    .attr("height",vars.height.value)
    .attr("opacity",0);

  if (!touch) {

    vars.g.overlay
      .on(events.move,function(d){

        if (vars.types[vars.type.value].zoom && vars.zoom.pan.value &&
          vars.zoom.behavior.scaleExtent()[0] < vars.zoom.scale) {
          d3.select(this).style("cursor",prefix()+"grab");
        }
        else {
          d3.select(this).style("cursor","auto");
        }

      })
      .on(events.up,function(d){

        if (vars.types[vars.type.value].zoom && vars.zoom.pan.value &&
          vars.zoom.behavior.scaleExtent()[0] < vars.zoom.scale) {
          d3.select(this).style("cursor",prefix()+"grab");
        }
        else {
          d3.select(this).style("cursor","auto");
        }

      })
      .on(events.down,function(d){

        if (vars.types[vars.type.value].zoom && vars.zoom.pan.value &&
          vars.zoom.behavior.scaleExtent()[0] < vars.zoom.scale) {
          d3.select(this).style("cursor",prefix()+"grabbing");
        }
        else {
          d3.select(this).style("cursor","auto");
        }

      });

  }
  else {

    var mouseEvent = function() {
      touchEvent(vars, d3.event);
    };

    vars.g.overlay
      .on(events.over, mouseEvent)
      .on(events.move, mouseEvent)
      .on(events.out , mouseEvent);

  }

  // Enter App Background Group
  vars.g.app = vars.g.viz.selectAll("g#app").data(["app"]);
  vars.g.app.enter().append("g")
    .attr("id","app");

  // Enter Edges Group
  vars.g.edges = vars.g.viz.selectAll("g#edges").data(["edges"]);
  vars.g.edges.enter().append("g")
    .attr("id","edges")
    .attr("opacity",0);

  // Enter Edge Focus Group
  vars.g.edge_focus = vars.g.viz.selectAll("g#focus").data(["focus"]);
  vars.g.edge_focus.enter().append("g")
    .attr("id","focus");

  // Enter Edge Hover Group
  vars.g.edge_hover = vars.g.viz.selectAll("g#edge_hover").data(["edge_hover"]);
  vars.g.edge_hover.enter().append("g")
    .attr("id","edge_hover")
    .attr("opacity",0);

  // Enter App Data Group
  vars.g.data = vars.g.viz.selectAll("g#data").data(["data"]);
  vars.g.data.enter().append("g")
    .attr("id","data")
    .attr("opacity",0);

  // Enter Data Focus Group
  vars.g.data_focus = vars.g.viz.selectAll("g#data_focus").data(["data_focus"]);
  vars.g.data_focus.enter().append("g")
    .attr("id","data_focus");

  // Enter Top Label Group
  vars.g.labels = vars.g.viz.selectAll("g#d3plus_labels").data(["d3plus_labels"]);
  vars.g.labels.enter().append("g")
    .attr("id","d3plus_labels");

  vars.defs = vars.svg.selectAll("defs").data(["defs"]);
  vars.defs.enter().append("defs");

  if ( vars.dev.value ) print.timeEnd("creating SVG elements");

};
