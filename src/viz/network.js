vizwhiz.network = function(data,vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------
  
  var dragging = false,
      highlight_color = "#cc0000",
      select_color = "#ee0000",
      secondary_color = "#ffdddd",
      offset_top = 0,
      offset_left = 0,
      info_width = 300,
      zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
      scale = {};

  //===================================================================
    

  var x_range = d3.extent(d3.values(vars.nodes), function(d){return d.x});
  var y_range = d3.extent(d3.values(vars.nodes), function(d){return d.y});
  var aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0]);
    
  // Define Scale
  if (aspect > vars.width/vars.height) {
    var viz_height = vars.width/aspect, viz_width = vars.width
    offset_top = ((vars.height-viz_height)/2)
  } else {
    var viz_width = vars.height*aspect, viz_height = vars.height
    offset_left = ((vars.width-viz_width)/2)
  }
  
  // x scale
  scale.x = d3.scale.linear()
    .domain(x_range)
    .range([offset_left, vars.width-offset_left])
  // y scale
  scale.y = d3.scale.linear()
    .domain(y_range)
    .range([offset_top, vars.height-offset_top])
  
  var min_dist = 10000;
  d3.values(vars.nodes).forEach(function(n){
    var temp_dist = 10000;
    d3.values(vars.nodes).forEach(function(n2){
      var xx = Math.abs(scale.x(n.x)-scale.x(n2.x));
      var yy = Math.abs(scale.y(n.y)-scale.y(n2.y));
      var dd = Math.sqrt((xx*xx)+(yy*yy))
      if (dd < temp_dist && dd != 0) temp_dist = dd;
    })
    if (temp_dist < min_dist) min_dist = temp_dist;
  })
      
  var max_size = min_dist,
      min_size = max_size/5 < 2 ? 2 : max_size/5;
  
  // x scale
  scale.x.range([offset_left+(max_size*2), vars.width-(max_size*2)-offset_left])
  // y scale
  scale.y.range([offset_top+(max_size*2), vars.height-(max_size*2)-offset_top])
  // size scale
  var val_range = d3.extent(d3.values(data), function(d){
    return d[vars.value_var] > 0 ? d[vars.value_var] : null
  });
  scale.size = d3.scale.log()
    .domain(val_range)
    .range([min_size, max_size])
    
  // Create viz group on vars.parent_enter
  var viz_enter = vars.parent_enter.append("g")
    .call(zoom_behavior.on("zoom",function(){ zoom(); }))
    .on(vizwhiz.evt.down,function(d){dragging = true})
    .on(vizwhiz.evt.up,function(d){dragging = false})
    .append('g')
      .attr('class','viz')
    
  viz_enter.append('rect')
    .attr('class','overlay')
    .attr("width", viz_width)
    .attr("height", viz_height)
    .attr("fill","transparent")
    .on(vizwhiz.evt.over,function(d){
      if (!vars.clicked && vars.highlight) {
        vars.highlight = null;
        update();
      }
    })
    .on(vizwhiz.evt.click,function(d){
      vars.highlight = null;
      zoom("reset");
      update();
    });
    
  viz_enter.append('g')
    .attr('class','links')
    
  viz_enter.append('g')
    .attr('class','nodes')
    
  viz_enter.append('g')
    .attr('class','highlight')
    
  if (!vars.small) {
    // Create Zoom Controls div on vars.parent_enter
    vars.parent.select("div#zoom_controls").remove()
    var zoom_div = vars.parent.append("div")
      .attr("id","zoom_controls")
    
    zoom_div.append("div")
      .attr("id","zoom_in")
      .attr("unselectable","on")
      .on(vizwhiz.evt.click,function(){ zoom("in") })
      .text("+")
    
    zoom_div.append("div")
      .attr("id","zoom_out")
      .attr("unselectable","on")
      .on(vizwhiz.evt.click,function(){ zoom("out") })
      .text("-")
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New nodes and links enter, initialize them here
  //-------------------------------------------------------------------
  
  var node = d3.select("g.nodes").selectAll("circle.node")
    .data(vars.nodes, function(d) { return d[vars.id_var]; })
  
  node.enter().append("circle")
    .attr("class","node")
    .attr("fill","white")
    .attr("stroke","white");
  
  var link = d3.select("g.links").selectAll("line.link")
    .data(vars.links, function(d) { return d.source[vars.id_var] + "-" + d.target[vars.id_var]; })
    
  link.enter().append("line")
    .attr("class","link")
    .attr("stroke", "white")
    .attr("stroke-width", "1px");
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for nodes and links that are already in existance
  //-------------------------------------------------------------------

  node
    .on(vizwhiz.evt.over, function(d){
      if (!vars.clicked) {
        vars.highlight = d[vars.id_var];
        update();
      } else {
        d3.select(this).attr("stroke",highlight_color)
      }
    })
    .on(vizwhiz.evt.out, function(d){
      if (vars.clicked) {
        d3.select(this).attr("stroke","#dedede")
      }
    })
    .on(vizwhiz.evt.click, function(d){
      vars.highlight = d[vars.id_var];
      zoom(vars.highlight);
      update();
    });

  node.transition().duration(vizwhiz.timing)
    .call(node_size)
    .call(node_color);
    
  link
    .on(vizwhiz.evt.click,function(d){
      vars.highlight = null;
      zoom("reset");
      update();
    })
    
  link.transition().duration(vizwhiz.timing)
    .attr("stroke", "#dedede")
    .call(link_position);
    
  d3.select('.overlay').transition().duration(vizwhiz.timing)
    .attr("width", viz_width)
    .attr("height", viz_height);
      
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit, for nodes and links that are being removed
  //-------------------------------------------------------------------

  node.exit().remove()
  link.exit().remove()

  //===================================================================
  
  update();
  if (vars.highlight && vars.clicked) zoom(vars.highlight);
      
  function link_position(l) {
    l
      .attr("x1", function(d) { return scale.x(d.source.x); })
      .attr("y1", function(d) { return scale.y(d.source.y); })
      .attr("x2", function(d) { return scale.x(d.target.x); })
      .attr("y2", function(d) { return scale.y(d.target.y); });
  }
  
  function bg_size(b) {
    b
      .attr("cx", function(d) { return scale.x(d.x); })
      .attr("cy", function(d) { return scale.y(d.y); })
      .attr("r", function(d) { 
        var value = data[d[vars.id_var]][vars.value_var] ? data[d[vars.id_var]][vars.value_var] : 0,
            buffer = data[d[vars.id_var]][vars.active_var] ? 3 : 2
        value = value > 0 ? scale.size(value) : scale.size(val_range[0])
        return value+buffer
      })
      .attr("stroke-width",0)
  }
  
  function node_size(n) {
    n
      .attr("cx", function(d) { return scale.x(d.x); })
      .attr("cy", function(d) { return scale.y(d.y); })
      .attr("r", function(d) { 
        var value = data[d[vars.id_var]][vars.value_var] ? data[d[vars.id_var]][vars.value_var] : 0
        return value > 0 ? scale.size(value) : scale.size(val_range[0])
      })
      .attr("stroke-width", function(d){
        if(data[d[vars.id_var]][vars.active_var]) return 2;
        else return 1;
      })
  }
  
  function node_color(n) {
    n
      .attr("fill", function(d){
        if (vars.clicked && d3.select(this.parentNode).attr("class") == "nodes") return "#efefef";
        var color = data[d[vars.id_var]].color ? data[d[vars.id_var]].color : vizwhiz.utils.rand_color()
        if (data[d[vars.id_var]][vars.active_var]) {
          this.parentNode.appendChild(this)
          return color;
        } 
        else if (vars.spotlight && !vars.clicked) return "#eeeeee";
        else {
          color = d3.hsl(color)
          color.l = 0.98
          return color.toString()
        }
      })
      .attr("stroke", function(d){
        if (vars.clicked && d3.select(this.parentNode).attr("class") == "nodes") return "#dedede";
        var color = data[d[vars.id_var]].color ? data[d[vars.id_var]].color : vizwhiz.utils.rand_color()
        if (data[d[vars.id_var]][vars.active_var]) return d3.rgb(color).darker().darker().toString();
        else if (vars.spotlight && !vars.clicked) return "#dedede";
        else return d3.rgb(color).darker().toString()
      })
  }
  
  function update() {
    
    d3.select("g.highlight").selectAll("*").remove()
    vizwhiz.tooltip.remove();
    
    if (vars.highlight) {
        
      var center = vars.connections[vars.highlight].center,
          primaries = vars.connections[vars.highlight].primary,
          secondaries = vars.connections[vars.highlight].secondary;
          
      if (vars.clicked) {
      
        node.call(node_color);
        
        // Draw Secondary Connection Lines and BGs
        d3.select("g.highlight").selectAll("line.sec_links")
          .data(secondaries.links).enter()
          .append("line")
            .attr("class","sec_links")
            .attr("stroke-width", "1px")
            .attr("stroke", secondary_color)
            .call(link_position)
            .on(vizwhiz.evt.click, function(d){
              zoom("reset");
              update();
            });
        d3.select("g.highlight").selectAll("circle.sec_bgs")
          .data(secondaries.nodes).enter()
          .append("circle")
            .attr("class","sec_bgs")
            .attr("fill", secondary_color)
            .call(bg_size);
      
        // Draw Secondary Nodes
        d3.select("g.highlight").selectAll("circle.sec_nodes")
          .data(secondaries.nodes).enter()
          .append("circle")
            .attr("class","sec_nodes")
            .call(node_size)
            .attr("fill","#efefef")
            .attr("stroke","#dedede")
            .on(vizwhiz.evt.over, function(d){
              if (!vars.clicked) {
                vars.highlight = d[vars.id_var];
                update();
              } else {
                d3.select(this).attr("stroke",highlight_color)
              }
            })
            .on(vizwhiz.evt.out, function(d){
              if (vars.clicked) {
                d3.select(this).attr("stroke","#dedede")
              }
            })
            .on(vizwhiz.evt.click, function(d){
              vars.highlight = d[vars.id_var];
              zoom(vars.highlight);
              update();
            });
      }
      
      // Draw Primary Connection Lines and BGs
      d3.select("g.highlight").selectAll("line.prim_links")
        .data(primaries.links).enter()
        .append("line")
          .attr("class","prim_links")
          .attr("stroke", highlight_color)
          .attr("stroke-width", "2px")
          .call(link_position)
          .on(vizwhiz.evt.click, function(d){
            vars.highlight = null;
            zoom("reset");
            update();
          });
      d3.select("g.highlight").selectAll("circle.prim_bgs")
        .data(primaries.nodes).enter()
        .append("circle")
          .attr("class","prim_bgs")
          .call(bg_size)
          .attr("fill",highlight_color);
      
      // Draw Primary Nodes
      d3.select("g.highlight").selectAll("circle.prim_nodes")
        .data(primaries.nodes).enter()
        .append("circle")
          .attr("class","prim_nodes")
          .call(node_size)
          .call(node_color)
          .on(vizwhiz.evt.over, function(d){
            d3.select(this).style("cursor","pointer")
            if (!vars.clicked) {
              vars.highlight = d[vars.id_var];
              update();
            }
          })
          .on(vizwhiz.evt.click, function(d){
            vars.highlight = d[vars.id_var];
            zoom(vars.highlight);
            update();
          })
          .each(function(d){
            var value = data[d[vars.id_var]][vars.value_var]
            var size = value > 0 ? scale.size(value) : scale.size(val_range[0])
            if (size > 6 && vars.labels && vars.clicked) create_label(d);
          });
      
      // Draw Main Center Node and BG
      d3.select("g.highlight").selectAll("circle.center_bg")
        .data([center]).enter()
        .append("circle")
          .attr("class","center_bg")
          .call(bg_size)
          .attr("fill",select_color);
      d3.select("g.highlight").selectAll("circle.center")
        .data([center]).enter()
        .append("circle")
          .attr("class","center")
          .call(node_size)
          .call(node_color)
          .on(vizwhiz.evt.over, function(d){
            d3.select(this).style("cursor","pointer")
          })
          .on(vizwhiz.evt.click, function(d){
            if (!vars.clicked) {
              zoom(vars.highlight);
              vars.clicked = true;
              update();
            } else {
              vars.highlight = null;
              zoom("reset");
              update();
            }
          })
          .each(function(d){ if (vars.labels && vars.clicked) create_label(d); });
        
          
      // Draw Info Panel
      if (scale.x(vars.connections[vars.highlight].extent.x[1]) > (vars.width-info_width-10)) var x_pos = 37+(info_width/2)
      else var x_pos = vars.width
      
      var tooltip_data = {},
          tooltip_appends = [],
          sub_title = null
      
      if (!vars.clicked) {
        sub_title = "Click Node for More Info"
      } 
      else {
        vars.tooltip_info.forEach(function(t){
          if (data[vars.highlight][t]) tooltip_data[t] = data[vars.highlight][t]
        })
        tooltip_appends.push({
          "append": "text",
          "attr": {
            "dy": "18px",
            "fill": "#333333",
            "text-anchor": "start",
            "font-size": "12px",
            "font-family": "Helvetica"
          },
          "style": {
            "font-weight": "bold"
          },
          "text": "Primary Connections"
        })
        
        var prims = []
        primaries.nodes.forEach(function(c){
          prims.push(c[vars.id_var])
        })
        
        prims.forEach(function(c){
          var obj = {
            "append": "g",
            "children": [
              {
                "append": "circle",
                "attr": {
                  "r": "5",
                  "cx": "5",
                  "cy": "8"
                },
                "style": {
                  "font-weight": "normal"
                },
                "text": data[c][vars.text_var],
                "events": {}
              },
              {
                "append": "text",
                "attr": {
                  "fill": "#333333",
                  "text-anchor": "start",
                  "font-size": "12px",
                  "font-family": "Helvetica",
                  "y": "0",
                  "x": "13"
                },
                "style": {
                  "font-weight": "normal"
                },
                "text": data[c][vars.text_var],
                "events": {}
              }
            ]
          }
          obj.children[0].attr["fill"] = function(){
              var color = data[c].color ? data[c].color : vizwhiz.utils.rand_color()
              if (data[c][vars.active_var]) {
                return color;
              } else {
                color = d3.hsl(color)
                color.l = 0.98
                return color.toString()
              }
            }
          obj.children[0].attr["stroke"] = function(){
              var color = data[c].color ? data[c].color : vizwhiz.utils.rand_color()
              if (data[c][vars.active_var]) return d3.rgb(color).darker().darker().toString();
              else return d3.rgb(color).darker().toString()
            }
          obj.children[0].attr["stroke-width"] = function(){
              if(data[c][vars.active_var]) return 2;
              else return 1;
            }
          obj.children[1].events[vizwhiz.evt.over] = function(){
              d3.select(this).attr('fill',highlight_color).style('cursor','pointer')
            }
          obj.children[1].events[vizwhiz.evt.out] = function(){
              d3.select(this).attr("fill","#333333")
            }
          obj.children[1].events[vizwhiz.evt.click] = function(){
              vars.highlight = c;
              zoom(vars.highlight);
              update();
            }
          tooltip_appends.push(obj)
        })
      }
      
      vizwhiz.tooltip.create({
        "parent": vars.svg,
        "data": tooltip_data,
        "title": data[vars.highlight][vars.text_var],
        "description": sub_title,
        "x": x_pos,
        "y": 0,
        "width": info_width,
        "arrow": false,
        "appends": tooltip_appends
      })
      
    } 
    else if (vars.clicked) {
      vars.clicked = false;
      node.call(node_color)
    }
    
  }
  
  function create_label(d) {
    var bg = d3.select("g.highlight").append("rect")
      .datum(d)
      .attr("rx",3)
      .attr("ry",3)
      .attr("stroke-width", function(d){
        if(data[d[vars.id_var]][vars.active_var]) return 2;
        else return 1;
      })
      .call(node_color)
      .on(vizwhiz.evt.over, function(d){
        d3.select(this).style("cursor","pointer")
      })
      .on(vizwhiz.evt.click, function(d){
        if (d[vars.id_var] == vars.highlight) {
          vars.highlight = null;
          zoom("reset");
          update();
        } else {
          vars.highlight = d[vars.id_var];
          zoom(vars.highlight);
          update();
        }
      })
    var text = d3.select("g.highlight").append("text")
      .datum(d)
      .attr("x", function(e) { return scale.x(e.x); })
      .attr("fill", function(e) { 
        return vizwhiz.utils.text_color(bg.attr("fill"))
      })
      .attr("font-size","3px")
      .attr("text-anchor","middle")
      .attr("font-family","Helvetica")
      .style("font-weight","bold")
      .each(function(e){
        vizwhiz.utils.wordwrap({
          "text": data[e[vars.id_var]][vars.text_var],
          "parent": this,
          "width": 60,
          "height": 7
        });
      })
      .on(vizwhiz.evt.over, function(d){
        d3.select(this).style("cursor","pointer")
      })
      .on(vizwhiz.evt.click, function(d){
        if (d[vars.id_var] == vars.highlight) {
          vars.highlight = null;
          zoom("reset");
          update();
        } else {
          vars.highlight = d[vars.id_var];
          zoom(vars.highlight);
          update();
        }
      })
              
    var w = text.node().getBBox().width+5,
        h = text.node().getBBox().height+5;
        
    text
      .attr("y", function(e) { return scale.y(e.y)-((h-5)/2); })
      
    var value = data[d[vars.id_var]][vars.value_var]
    var size = value > 0 ? scale.size(value) : scale.size(val_range[0])
    if (w-5 <= size*2 && h-5 <= size*2) {
      bg.remove();
    } else {
      bg.attr("width",w)
        .attr("height",h)
        .attr("y", function(e) { return scale.y(e.y)-(h/2); })
        .attr("x", function(e) { return scale.x(e.x)-(w/2); });
    }
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function that handles the zooming and panning of the visualization
  //-------------------------------------------------------------------
  
  function zoom(direction) {
    
    var zoom_extent = zoom_behavior.scaleExtent()
    // If d3 zoom event is detected, use it!
    if(!direction) {
      evt_scale = d3.event.scale
      translate = d3.event.translate
    } else {
      if (direction == "in") {
        if (zoom_behavior.scale() > zoom_extent[1]/2) multiplier = zoom_extent[1]/zoom_behavior.scale()
        else multiplier = 2
      } else if (direction == "out") {
        if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
        else multiplier = 0.5
      } else if (vars.connections[direction]) {
        var x_bounds = [scale.x(vars.connections[direction].extent.x[0]),scale.x(vars.connections[direction].extent.x[1])],
            y_bounds = [scale.y(vars.connections[direction].extent.y[0]),scale.y(vars.connections[direction].extent.y[1])]
            
        if (x_bounds[1] > (vars.width-info_width-5)) var offset_left = info_width+32
        else var offset_left = 0
            
        var w_zoom = (vars.width-info_width-10)/(x_bounds[1]-x_bounds[0]),
            h_zoom = vars.height/(y_bounds[1]-y_bounds[0])
        
        if (w_zoom < h_zoom) {
          x_bounds = [x_bounds[0]-(max_size*2),x_bounds[1]+(max_size*2)]
          evt_scale = (vars.width-info_width-10)/(x_bounds[1]-x_bounds[0])
          if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
          offset_x = -(x_bounds[0]*evt_scale)
          offset_y = -(y_bounds[0]*evt_scale)+((vars.height-((y_bounds[1]-y_bounds[0])*evt_scale))/2)
        } else {
          y_bounds = [y_bounds[0]-(max_size*2),y_bounds[1]+(max_size*2)]
          evt_scale = vars.height/(y_bounds[1]-y_bounds[0])
          if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
          offset_x = -(x_bounds[0]*evt_scale)+(((vars.width-info_width-10)-((x_bounds[1]-x_bounds[0])*evt_scale))/2)
          offset_y = -(y_bounds[0]*evt_scale)
        }

        translate = [offset_x+offset_left,offset_y]
      } else if (direction == "reset") {
        translate = [0,0]
        evt_scale = 1
      }
      
      if (direction == "in" || direction == "out") {
        var trans = d3.select("g.viz")[0][0].getAttribute('transform')
        if (trans) {
          trans = trans.split('(')
          var coords = trans[1].split(')')
          coords = coords[0].replace(' ',',')
          coords = coords.substring(0,trans[1].length-6).split(',')
          offset_x = parseFloat(coords[0])
          offset_y = coords.length == 2 ? parseFloat(coords[1]) : parseFloat(coords[0])
          zoom_var = parseFloat(trans[2].substring(0,trans[2].length-1))
        } else {
          offset_x = 0
          offset_y = 0
          zoom_var = 1
        }
        if ((multiplier > 0.5 && multiplier <= 1) && direction == "out") {
          offset_x = 0
          offset_y = 0
        } else {
          offset_x = (vars.width/2)-(((vars.width/2)-offset_x)*multiplier)
          offset_y = (vars.height/2)-(((vars.height/2)-offset_y)*multiplier)
        }
      
        translate = [offset_x,offset_y]
        evt_scale = zoom_var*multiplier
      }
    
    }
    
    zoom_behavior.translate(translate).scale(evt_scale)
    
    // Auto center visualization
    if (translate[0] > 0) translate[0] = 0
    else if (translate[0] < -((vars.width*evt_scale)-vars.width)) {
      translate[0] = -((vars.width*evt_scale)-vars.width)
    }
    if (translate[1] > 0) translate[1] = 0
    else if (translate[1] < -((vars.height*evt_scale)-vars.height)) translate[1] = -((vars.height*evt_scale)-vars.height)
    if (!direction) {
      if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
        var viz_timing = d3.select(".viz")
      } else {
        var viz_timing = d3.select(".viz").transition().duration(vizwhiz.timing)
      }
    } else {
      var viz_timing = d3.select(".viz").transition().duration(vizwhiz.timing)
    }
    viz_timing.attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
    
  }

  //===================================================================
      
};
