d3plus.apps.network = {}
d3plus.apps.network.data = "object";
d3plus.apps.network.requirements = ["nodes","links"];
d3plus.apps.network.tooltip = "static"
d3plus.apps.network.shapes = ["circle","square","donut"];
d3plus.apps.network.scale = 1.05
d3plus.apps.network.nesting = false

d3plus.apps.network.draw = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Use filtered lists if they are available
  //-------------------------------------------------------------------
  var nodes = vars.nodes.restricted || vars.nodes.value,
      links = vars.links.restricted || vars.links.value

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Determine Size Scale
  //-------------------------------------------------------------------
  var x_range = d3.extent(d3.values(nodes), function(d){return d.x}),
      y_range = d3.extent(d3.values(nodes), function(d){return d.y}),
      aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0])

  // Calculate overall network size based on aspect ratio
  if (aspect > vars.app_width/vars.app_height) {
    var network_height = vars.app_width/aspect,
        network_width = vars.app_width,
        offset_top = ((vars.app_height-network_height)/2),
        offset_left = 0
  } else {
    var network_width = vars.app_height*aspect,
        network_height = vars.app_height,
        offset_left = ((vars.app_width-network_width)/2),
        offset_top = 0
  }

  // Set X and Y position scales
  var scale = {}
  scale.x = d3.scale.linear()
    .domain(x_range)
    .range([offset_left, vars.app_width-offset_left])
  scale.y = d3.scale.linear()
    .domain(y_range)
    .range([offset_top, vars.app_height-offset_top])

  var val_range = d3.extent(d3.values(vars.data.app), function(d){
    var val = d3plus.variable.value(vars,d,vars.size.key)
    return val == 0 ? null : val
  });

  if (typeof val_range[0] == "undefined") val_range = [1,1]

  var distances = []
  nodes.forEach(function(n1){
    nodes.forEach(function(n2){
      if (n1 != n2) {
        var xx = Math.abs(scale.x(n1.x)-scale.x(n2.x));
        var yy = Math.abs(scale.y(n1.y)-scale.y(n2.y));
        distances.push(Math.sqrt((xx*xx)+(yy*yy)))
      }
    })
  })

  var max_size = d3.min(distances,function(d){
    return d;
  })
  max_size = max_size*(max_size/800)
  var min_size = 4;

  // Add buffers to position scales
  scale.x.range([offset_left+(max_size*1.5), vars.app_width-(max_size*1.5)-offset_left])
  scale.y.range([offset_top+(max_size*1.5), vars.app_height-(max_size*1.5)-offset_top])

  // Create size scale
  scale.r = d3.scale[vars.size.scale.value]()
    .domain(val_range)
    .range([min_size, max_size])

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Match nodes to data
  //-------------------------------------------------------------------
  var data = [], lookup = {}
  nodes.forEach(function(n){
    if (vars.data.app[n[vars.id.key]]) {
      var obj = d3plus.utils.merge(n,vars.data.app[n[vars.id.key]])
    }
    else {
      var obj = d3plus.utils.copy(n)
    }
    obj.d3plus = {}
    obj.d3plus.x = scale.x(n.x)
    obj.d3plus.y = scale.y(n.y)
    lookup[obj[vars.id.key]] = {
      "x": obj.d3plus.x,
      "y": obj.d3plus.y
    }
    var val = d3plus.variable.value(vars,obj,vars.size.key)
    obj.d3plus.r = val ? scale.r(val) : scale.r.range()[0]
    data.push(obj)
  })

  data.sort(function(a,b){
    return b.d3plus.r - a.d3plus.r
  })

  links.forEach(function(l,i){
    if (typeof l.source != "object") {
      var obj = {}
      obj[vars.id.key] = l.source
      l.source = obj
    }
    l.source.d3plus = {}
    var id = l.source[vars.id.key]
    l.source.d3plus.x = lookup[id].x
    l.source.d3plus.y = lookup[id].y
    if (typeof l.target != "object") {
      var obj = {}
      obj[vars.id.key] = l.target
      l.target = obj
    }
    l.target.d3plus = {}
    var id = l.target[vars.id.key]
    l.target.d3plus.x = lookup[id].x
    l.target.d3plus.y = lookup[id].y
  })

  return {"nodes": data, "links": links}

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------

  // var dragging = false,
  //     info_width = 300,
  //     zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
  //     hover = null,
  //     last_hover = null,
  //     last_highlight = null,
  //     highlight_extent = {};

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function that handles the zooming and panning of the visualization
  //-------------------------------------------------------------------

  // vars.zoom = function(direction) {
  //
  //   var zoom_extent = zoom_behavior.scaleExtent()
  //   // If d3 zoom event is detected, use it!
  //   if(!direction) {
  //     evt_scale = d3.event.scale
  //     translate = d3.event.translate
  //   }
  //   else {
  //     if (direction == "in") {
  //       if (zoom_behavior.scale() > zoom_extent[1]/2) multiplier = zoom_extent[1]/zoom_behavior.scale()
  //       else multiplier = 2
  //     }
  //     else if (direction == "out") {
  //       if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
  //       else multiplier = 0.5
  //     }
  //     else if (direction == vars.focus.value) {
  //       var x_bounds = [scale.x(highlight_extent.x[0]),scale.x(highlight_extent.x[1])],
  //           y_bounds = [scale.y(highlight_extent.y[0]),scale.y(highlight_extent.y[1])]
  //
  //       if (x_bounds[1] > (vars.app_width-info_width-5)) var offset_left = info_width+32
  //       else var offset_left = 0
  //
  //       var w_zoom = (vars.app_width-info_width-10)/(x_bounds[1]-x_bounds[0]),
  //           h_zoom = vars.app_height/(y_bounds[1]-y_bounds[0])
  //
  //       if (w_zoom < h_zoom) {
  //         x_bounds = [x_bounds[0]-(max_size*4),x_bounds[1]+(max_size*4)]
  //         evt_scale = (vars.app_width-info_width-10)/(x_bounds[1]-x_bounds[0])
  //         if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
  //         offset_x = -(x_bounds[0]*evt_scale)
  //         offset_y = -(y_bounds[0]*evt_scale)+((vars.app_height-((y_bounds[1]-y_bounds[0])*evt_scale))/2)
  //       } else {
  //         y_bounds = [y_bounds[0]-(max_size*2),y_bounds[1]+(max_size*2)]
  //         evt_scale = vars.app_height/(y_bounds[1]-y_bounds[0])
  //         if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
  //         offset_x = -(x_bounds[0]*evt_scale)+(((vars.app_width-info_width-10)-((x_bounds[1]-x_bounds[0])*evt_scale))/2)
  //         offset_y = -(y_bounds[0]*evt_scale)
  //       }
  //
  //       translate = [offset_x+offset_left,offset_y]
  //     }
  //     else if (direction == "reset") {
  //       vars.focus.value = null
  //       translate = [0,0]
  //       evt_scale = 1
  //     }
  //
  //     if (direction == "in" || direction == "out") {
  //       var trans = d3.select("g.viz")[0][0].getAttribute("transform")
  //       if (trans) {
  //         trans = trans.split('(')
  //         var coords = trans[1].split(')')
  //         coords = coords[0].replace(' ',',')
  //         coords = coords.substring(0,trans[1].length-6).split(",")
  //         offset_x = parseFloat(coords[0])
  //         offset_y = coords.length == 2 ? parseFloat(coords[1]) : parseFloat(coords[0])
  //         zoom_var = parseFloat(trans[2].substring(0,trans[2].length-1))
  //       } else {
  //         offset_x = 0
  //         offset_y = 0
  //         zoom_var = 1
  //       }
  //       if ((multiplier > 0.5 && multiplier <= 1) && direction == "out") {
  //         offset_x = 0
  //         offset_y = 0
  //       } else {
  //         offset_x = (vars.app_width/2)-(((vars.app_width/2)-offset_x)*multiplier)
  //         offset_y = (vars.app_height/2)-(((vars.app_height/2)-offset_y)*multiplier)
  //       }
  //
  //       translate = [offset_x,offset_y]
  //       evt_scale = zoom_var*multiplier
  //     }
  //
  //   }
  //
  //   zoom_behavior.translate(translate).scale(evt_scale)
  //
  //   // Auto center visualization
  //   if (translate[0] > 0) translate[0] = 0
  //   else if (translate[0] < -((vars.app_width*evt_scale)-vars.app_width)) {
  //     translate[0] = -((vars.app_width*evt_scale)-vars.app_width)
  //   }
  //   if (translate[1] > 0) translate[1] = 0
  //   else if (translate[1] < -((vars.app_height*evt_scale)-vars.app_height)) translate[1] = -((vars.app_height*evt_scale)-vars.app_height)
  //   if (!direction) {
  //     if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
  //       var viz_timing = d3.select(".viz")
  //     } else {
  //       var viz_timing = d3.select(".viz").transition().duration(vars.style.timing.transitions)
  //     }
  //   } else {
  //     var viz_timing = d3.select(".viz").transition().duration(vars.style.timing.transitions)
  //   }
  //   viz_timing.attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
  //
  // }
  //
  // //===================================================================
  //
  // vars.update = function() {
  //   // If highlight variable has ACTUALLY changed, do this stuff
  //   if (last_highlight != vars.focus.value) {
  //
  //     // Remove all tooltips on page
  //     d3plus.tooltip.remove(vars.type.value)
  //     d3.select("g.highlight").selectAll("*").remove()
  //     d3.select("g.hover").selectAll("*").remove()
  //
  //     if (vars.focus.value) {
  //
  //       create_nodes("highlight")
  //
  //     }
  //     else {
  //       vars.zoom("reset");
  //     }
  //
  //     node.call(node_color)
  //
  //     last_highlight = vars.focus.value
  //   }
  //
  //   // If hover variable has ACTUALLY changed, do this stuff
  //   if (last_hover != hover) {
  //
  //     d3.select("g.hover").selectAll("*").remove()
  //
  //     // If a new hover element exists, create it
  //     if (hover && hover != vars.focus.value) {
  //       create_nodes("hover")
  //     }
  //
  //     // Set last_hover to the new hover ID
  //     last_hover = hover
  //   }
  //
  //   function create_nodes(group) {
  //
  //     if (group == "highlight") {
  //       var c = vars.focus.value
  //     }
  //     else {
  //       var c = hover
  //     }
  //
  //     var node_data = nodes.filter(function(x){return x[vars.id] == c})
  //
  //     if (group == "highlight" || !vars.focus.value) {
  //
  //       var prim_nodes = [],
  //           prim_links = [];
  //
  //       if (vars.connections[c]) {
  //         vars.connections[c].forEach(function(n){
  //           prim_nodes.push(nodes.filter(function(x){return x[vars.id] == n[vars.id]})[0])
  //         })
  //         prim_nodes.forEach(function(n){
  //           prim_links.push({"source": node_data[0], "target": n})
  //         })
  //       }
  //
  //       var node_data = prim_nodes.concat(node_data)
  //       highlight_extent.x = d3.extent(d3.values(node_data),function(v){return v.x;}),
  //       highlight_extent.y = d3.extent(d3.values(node_data),function(v){return v.y;})
  //
  //       if (group == "highlight") {
  //         vars.zoom(c);
  //
  //         make_tooltip = function(html) {
  //
  //           if (typeof html == "string") html = "<br>"+html
  //
  //           if (scale.x(highlight_extent.x[1]) > (vars.app_width-info_width-10)) {
  //             var x_pos = 30
  //           }
  //           else {
  //             var x_pos = vars.app_width-info_width-5
  //           }
  //
  //           var prod = nodes.filter(function(n){return n[vars.id] == vars.focus.value})[0]
  //
  //           var tooltip_data = d3plus.tooltip.data(vars,vars.focus.value)
  //
  //           var tooltip_appends = "<div class='d3plus_tooltip_data_title'>"
  //           tooltip_appends += vars.format("Primary Connections")
  //           tooltip_appends += "</div>"
  //
  //           prim_nodes.forEach(function(n){
  //
  //             var parent = "d3.select(&quot;#"+vars.parent.node().id+"&quot;)"
  //
  //             tooltip_appends += "<div class='d3plus_network_connection' onclick='"+parent+".call(chart.highlight(&quot;"+n[vars.id]+"&quot;))'>"
  //             tooltip_appends += "<div class='d3plus_network_connection_node'"
  //             tooltip_appends += " style='"
  //             tooltip_appends += "background-color:"+fill_color(n)+";"
  //             tooltip_appends += "border-color:"+stroke_color(n)+";"
  //             tooltip_appends += "'"
  //             tooltip_appends += "></div>"
  //             tooltip_appends += "<div class='d3plus_network_connection_name'>"
  //             tooltip_appends += d3plus.variable.value(vars,n[vars.id],vars.text.key)
  //             tooltip_appends += "</div>"
  //             tooltip_appends += "</div>"
  //           })
  //
  //           d3plus.tooltip.remove(vars.type.value)
  //
  //           d3plus.tooltip.create({
  //             "data": tooltip_data,
  //             "title": d3plus.variable.value(vars,vars.focus.value,vars.text.key),
  //             "color": d3plus.variable.color(vars,vars.focus.value),
  //             "icon": d3plus.variable.value(vars,vars.focus.value,"icon"),
  //             "style": vars.style.icon,
  //             "x": x_pos,
  //             "y": vars.margin.top+5,
  //             "width": info_width,
  //             "max_height": vars.app_height-10,
  //             "html": tooltip_appends+html,
  //             "fixed": true,
  //             "mouseevents": true,
  //             "parent": vars.parent,
  //             "background": vars.style.background,
  //             "id": vars.type.value
  //           })
  //
  //         }
  //
  //         var html = vars.click.value ? vars.click.value(vars.focus.value) : ""
  //
  //         if (typeof html == "string") make_tooltip(html)
  //         else {
  //           d3.json(html.url,function(data){
  //             html = html.callback(data)
  //             make_tooltip(html)
  //           })
  //         }
  //
  //       }
  //
  //       d3.select("g."+group).selectAll("line")
  //         .data(prim_links).enter().append("line")
  //           .attr("pointer-events","none")
  //           .attr("stroke",vars.style.primary.color)
  //           .attr("stroke-width",2)
  //           .call(link_position)
  //     }
  //
  //     var node_groups = d3.select("g."+group).selectAll("g")
  //       .data(node_data).enter().append("g")
  //         .attr("class","hover_node")
  //         .call(node_events)
  //
  //     node_groups
  //       .append("circle")
  //         .attr("class","bg")
  //         .call(node_size)
  //         .call(node_position)
  //         .call(node_stroke)
  //         .attr("stroke",vars.style.primary.color);
  //
  //     node_groups
  //       .append("circle")
  //         .call(node_size)
  //         .call(node_position)
  //         .call(node_stroke)
  //         .call(node_color)
  //         .call(create_label);
  //   }
  //
  // }



  // Create viz group on vars.parent_enter
  // var viz_enter = vars.parent_enter.append("g")
//     .call(zoom_behavior.on("zoom",function(){ vars.zoom(); }))
//     .on(d3plus.evt.down,function(d){
//       dragging = true
//     })
//     .on(d3plus.evt.up,function(d){
//       dragging = false
//     })
//     .append("g")
//       .attr("class","viz")
//
//   viz_enter.append("rect")
//     .attr("class","overlay")
//     .attr("fill","transparent");
//
//   d3.select("rect.overlay")
//     .attr("width", vars.app_width)
//     .attr("height", vars.app_height)
//     .on(d3plus.evt.over,function(d){
//       if (!vars.focus.value && hover) {
//         hover = null;
//         vars.update();
//       }
//     })
//     .on(d3plus.evt.click,function(d){
//       // vars.focus.value = null;
//       // vars.zoom("reset");
//       // vars.update();
//     })
//     .on(d3plus.evt.move,function(d){
//       if (zoom_behavior.scale() > 1) {
//         d3.select(this).style("cursor","move")
//         if (dragging && !d3plus.ie) {
//           d3.select(this).style("cursor","-moz-grabbing")
//           d3.select(this).style("cursor","-webkit-grabbing")
//         }
//         else if (!d3plus.ie) {
//           d3.select(this).style("cursor","-moz-grab")
//           d3.select(this).style("cursor","-webkit-grab")
//         }
//       }
//       else {
//         d3.select(this).style("cursor","default")
//       }
//     });
//
//   if (!vars.zoom.scroll.value) {
//     d3.select(d3.select("g.viz").node().parentNode)
//       .on("mousewheel.zoom", null)
//       .on("DOMMouseScroll.zoom", null)
//       .on("wheel.zoom", null)
//   }
//
//   viz_enter.append("g")
//     .attr("class","links")
//
//   viz_enter.append("g")
//     .attr("class","nodes")
//
//   viz_enter.append("g")
//     .attr("class","highlight")
//
//   viz_enter.append("g")
//     .attr("class","hover")
//
//   d3plus.utilsts.zoom_controls();
//
//   //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   // New nodes and links enter, initialize them here
//   //-------------------------------------------------------------------
//
//   var node = d3.select("g.nodes").selectAll("circle.node")
//     .data(nodes, function(d) { return d[vars.id]; })
//
//   node.enter().append("circle")
//     .attr("class","node")
//     .attr("r",0)
//     .call(node_position)
//     .call(node_color)
//     .call(node_stroke);
//
//   var link = d3.select("g.links").selectAll("line.link")
//     .data(links, function(d) { return d.source[vars.id] + "-" + d.target[vars.id]; })
//
//   link.enter().append("line")
//     .attr("class","link")
//     .attr("pointer-events","none")
//     .attr("stroke", "white")
//     .attr("stroke-width", 1)
//     .call(link_position);
//
//   //===================================================================
//
//   //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   // Update, for nodes and links that are already in existance
//   //-------------------------------------------------------------------
//
//   node
//     .on(d3plus.evt.over, function(d){
//       if (!dragging) {
//         hover = d[vars.id];
//         vars.update();
//       }
//     });
//
//   node.transition().duration(vars.style.timing.transitions)
//     .call(node_size)
//     .call(node_stroke)
//     .call(node_position)
//     .call(node_color);
//
//   link
//     .call(link_events);
//
//   link.transition().duration(vars.style.timing.transitions)
//     .attr("stroke", "#dedede")
//     .call(link_position);
//
//   //===================================================================
//
//   //===================================================================
//
//   if (vars.focus.value) {
//     var present = false;
//     nodes.forEach(function(d){
//       if (d[vars.id] == vars.focus.value) present = true;
//     })
//     if (!present) {
//       vars.focus.value = null;
//     }
//   }
//   vars.update();
//
//   function link_position(l) {
//     l
//       .attr("x1", function(d) { return scale.x(d.source.x); })
//       .attr("y1", function(d) { return scale.y(d.source.y); })
//       .attr("x2", function(d) { return scale.x(d.target.x); })
//       .attr("y2", function(d) { return scale.y(d.target.y); })
//       .attr("vector-effect","non-scaling-stroke")
//   }
//
//   function link_events(l) {
//     l
//       .on(d3plus.evt.click,function(d){
//         vars.focus.value = null;
//         vars.zoom("reset");
//         vars.update();
//       })
//   }
//
//   function stroke_color(d) {
//
//     // Get elements' color
//     var color = d3plus.variable.color(vars,d)
//
//     // If node is active, return a darker color, else, return the normal color
//     var active = vars.active ? d3plus.variable.value(vars,d[vars.id],vars.active) : true
//     return active ? "#333" : color;
//
//   }
//
//   function node_events(n) {
//     n
//       .on(d3plus.evt.over, function(d){
//
//         d3.select(this).style("cursor","pointer")
//         if (!d3plus.ie) {
//           d3.select(this).style("cursor","-moz-zoom-in")
//           d3.select(this).style("cursor","-webkit-zoom-in")
//         }
//
//         if (d[vars.id] == vars.focus.value && !d3plus.ie) {
//           d3.select(this).style("cursor","-moz-zoom-out")
//           d3.select(this).style("cursor","-webkit-zoom-out")
//         }
//
//         if (d[vars.id] != hover) {
//           hover = d[vars.id];
//           vars.update();
//         }
//
//       })
//       .on(d3plus.evt.out, function(d){
//
//         // Returns false if the mouse has moved into a child element.
//         // This is used to catch when the mouse moves onto label text.
//         var target = d3.event.toElement || d3.event.relatedTarget
//         if (target) {
//           var id_check = target.__data__[vars.id] == d[vars.id]
//           if (target.parentNode != this && !id_check) {
//             hover = null;
//             vars.update();
//           }
//         }
//         else {
//           hover = null;
//           vars.update();
//         }
//
//       })
//       .on(d3plus.evt.click, function(d){
//
//         d3.select(this).style("cursor","auto")
//
//         // If there is no highlighted node,
//         // or the hover node is not the highlighted node
//         if (!vars.focus.value || vars.focus.value != d[vars.id]) {
//           vars.focus.value = d[vars.id];
//         }
//
//         // Else, the user is clicking on the highlighted node.
//         else {
//           vars.focus.value = null;
//         }
//
//         vars.update();
//
//       })
//   }
//
//   function create_label(n) {
//     if (vars.labels) {
//       n.each(function(d){
//
//         var font_size = Math.ceil(10/zoom_behavior.scale()),
//             padding = font_size/4,
//             corner = Math.ceil(3/zoom_behavior.scale())
//             value = d3plus.variable.value(vars,d[vars.id],vars.size.key),
//             size = value > 0 ? scale.r(value) : scale.r(val_range[0])
//         if (font_size < size || d[vars.id] == hover || d[vars.id] == vars.focus.value) {
//           d3.select(this.parentNode).append("text")
//             .attr("pointer-events","none")
//             .attr("x",scale.x(d.x))
//             .attr("fill",d3plus.color.text(fill_color(d)))
//             .attr("font-size",font_size+"px")
//             .attr("text-anchor","middle")
//             .attr("font-family",vars.style.font.family)
//             .attr("font-weight",vars.style.font.weight)
//             .each(function(e){
//               var th = size < font_size+padding*2 ? font_size+padding*2 : size,
//                   tw = ((font_size*5)/th)*(font_size*5)
//               var text = d3plus.variable.value(vars,d[vars.id],vars.text.key)
//               d3plus.utils.wordwrap({
//                 "text": text,
//                 "parent": this,
//                 "width": tw,
//                 "height": th,
//                 "padding": 0
//               });
//               if (!d3.select(this).select("tspan")[0][0]) {
//                 d3.select(this).remove();
//               }
//               else {
//                 finish_label(d3.select(this));
//               }
//             })
//         }
//
//         function finish_label(text) {
//
//           var w = text.node().getBBox().width,
//               h = text.node().getBBox().height
//
//           text.attr("y",scale.y(d.y)-(h/2)-(padding/3))
//
//           w = w+(padding*6)
//           h = h+(padding*2)
//
//           if (w > size*2) {
//             d3.select(text.node().parentNode)
//               .insert("rect","circle")
//                 .attr("class","bg")
//                 .attr("rx",corner)
//                 .attr("ry",corner)
//                 .attr("width",w)
//                 .attr("height",h)
//                 .attr("y",scale.y(d.y)-(h/2))
//                 .attr("x",scale.x(d.x)-(w/2))
//                 .call(node_stroke)
//                 .attr("stroke",vars.style.primary.color);
//             d3.select(text.node().parentNode)
//               .insert("rect","text")
//                 .attr("rx",corner)
//                 .attr("ry",corner)
//                 .attr("stroke-width", 0)
//                 .attr("fill",fill_color(d))
//                 .attr("width",w)
//                 .attr("height",h)
//                 .attr("y",scale.y(d.y)-(h/2))
//                 .attr("x",scale.x(d.x)-(w/2));
//           }
//         }
//
//       })
//
//     }
//   }

};
