vizwhiz.viz.network = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = 300,
      height = 300,
      value_var = "value",
      id_var = "id",
      text_var = "name",
      clicked = false,
      spotlight = true,
      highlight = null,
      labels = true,
      zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
      nodes = [],
      x_range,
      y_range,
      aspect,
      links = [],
      connections = {},
      scale = {},
      tooltip_info = [];

  //===================================================================


  function chart(selection) {
    selection.each(function(data, i) {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Private Variables
      //-------------------------------------------------------------------

      var this_selection = this,
          timing = vizwhiz.timing,
          dragging = false,
          highlight_color = "#cc0000",
          select_color = "#ee0000",
          secondary_color = "#ffdddd",
          offset_top = 0,
          offset_left = 0,
          info_width = 300;

      //===================================================================
      
      // Select the svg element, if it exists.
      var svg = d3.select(this_selection).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height);
        
      // Define Scale
      if (aspect > width/height) {
        var viz_height = width/aspect, viz_width = width
        offset_top = ((height-viz_height)/2)
      } else {
        var viz_width = height*aspect, viz_height = height
        offset_left = ((width-viz_width)/2)
      }
          
      var columns = Math.ceil(Math.sqrt(Object.keys(nodes).length*(viz_width/viz_height))),
          max_size = viz_width/(columns*3),
          min_size = max_size/5 < 2 ? 2 : max_size/5
          
      // x scale
      scale.x = d3.scale.linear()
        .domain(x_range)
        .range([offset_left+(max_size*2), width-(max_size*2)-offset_left])
      // y scale
      scale.y = d3.scale.linear()
        .domain(y_range)
        .range([offset_top+(max_size*2), height-(max_size*2)-offset_top])
      // size scale
      var val_range = d3.extent(d3.values(data), function(d){
        return d[value_var] > 0 ? d[value_var] : null
      });
      scale.size = d3.scale.log()
        .domain(val_range)
        .range([min_size, max_size])
        
      // Create viz group on svg_enter
      var viz_enter = svg_enter.append("g")
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
          if (!clicked && highlight) {
            highlight = null;
            update();
          }
        })
        .on(vizwhiz.evt.click,function(d){
          highlight = null;
          zoom("reset");
          update();
        });
        
      viz_enter.append('g')
        .attr('class','links')
        
      viz_enter.append('g')
        .attr('class','nodes')
        
      viz_enter.append('g')
        .attr('class','highlight')
        
      // Create Zoom Controls div on svg_enter
      d3.select(this_selection).select("div#zoom_controls").remove()
      var zoom_div = d3.select(this_selection).append("div")
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
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New nodes and links enter, initialize them here
      //-------------------------------------------------------------------
      
      var node = d3.select("g.nodes").selectAll("circle.node")
        .data(nodes, function(d) { return d[id_var]; })
      
      node.enter().append("circle")
        .attr("class","node")
        .call(node_size)
        .attr("fill","white")
        .attr("stroke","white")
        .on(vizwhiz.evt.over, function(d){
          if (!clicked) {
            highlight = d[id_var];
            update();
          } else {
            d3.select(this).attr("stroke",highlight_color)
          }
        })
        .on(vizwhiz.evt.out, function(d){
          if (clicked) {
            d3.select(this).attr("stroke","#dedede")
          }
        })
        .on(vizwhiz.evt.click, function(d){
          highlight = d[id_var];
          zoom(highlight);
          update();
        });
      
      var link = d3.select("g.links").selectAll("line.link")
        .data(links, function(d) { return d.source[id_var] + "-" + d.target[id_var]; })
        
      link.enter().append("line")
        .attr("class","link")
        .attr("stroke", "white")
        .attr("stroke-width", "1px")
        .call(link_position)
        .on(vizwhiz.evt.click,function(d){
          highlight = null;
          zoom("reset");
          update();
        });
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for nodes and links that are already in existance
      //-------------------------------------------------------------------

      node.transition().duration(timing)
        .call(node_size)
        .call(node_color);
        
      link.transition().duration(timing)
        .attr("stroke", "#dedede")
        .call(link_position);
        
      d3.select('.overlay').transition().duration(timing)
        .attr("width", viz_width)
        .attr("height", viz_height);
        
      svg.transition().duration(timing)
        .attr("width", width)
        .attr("height", height)
          
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Exit, for nodes and links that are being removed
      //-------------------------------------------------------------------

      node.exit().remove()
      link.exit().remove()

      //===================================================================
      
      update();
      if (highlight && clicked) zoom(highlight);
          
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
            var value = data[d[id_var]][value_var],
                buffer = data[d[id_var]].active ? 3 : 2
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
            var value = data[d[id_var]][value_var]
            return value > 0 ? scale.size(value) : scale.size(val_range[0])
          })
          .attr("stroke-width", function(d){
            if(data[d[id_var]].active) return 2;
            else return 1;
          })
      }
      
      function node_color(n) {
        n
          .attr("fill", function(d){
            if (clicked && d3.select(this.parentNode).attr("class") == "nodes") return "#efefef";
            var color = data[d[id_var]].color ? data[d[id_var]].color : vizwhiz.utils.rand_color()
            if (data[d[id_var]].active) {
              this.parentNode.appendChild(this)
              return color;
            } else if (spotlight && !highlight) return "#eeeeee";
            else {
              color = d3.hsl(color)
              color.l = 0.98
              return color.toString()
            }
          })
          .attr("stroke", function(d){
            if (clicked && d3.select(this.parentNode).attr("class") == "nodes") return "#dedede";
            var color = data[d[id_var]].color ? data[d[id_var]].color : vizwhiz.utils.rand_color()
            if (data[d[id_var]].active) return d3.rgb(color).darker().darker().toString();
            else if (spotlight && !highlight) return "#dedede";
            else return d3.rgb(color).darker().toString()
          })
      }
      
      function update() {
        
        d3.select("g.highlight").selectAll("*").remove()
        vizwhiz.tooltip.remove();
        
        if (highlight) {
            
          var center = connections[highlight].center,
              primaries = connections[highlight].primary,
              secondaries = connections[highlight].secondary
              
          if (clicked) {
          
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
                  if (!clicked) {
                    highlight = d[id_var];
                    update();
                  } else {
                    d3.select(this).attr("stroke",highlight_color)
                  }
                })
                .on(vizwhiz.evt.out, function(d){
                  if (clicked) {
                    d3.select(this).attr("stroke","#dedede")
                  }
                })
                .on(vizwhiz.evt.click, function(d){
                  highlight = d[id_var];
                  zoom(highlight);
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
                highlight = null;
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
                if (!clicked) {
                  highlight = d[id_var];
                  update();
                }
              })
              .on(vizwhiz.evt.click, function(d){
                highlight = d[id_var];
                zoom(highlight);
                update();
              })
              .each(function(d){
                var value = data[d[id_var]][value_var]
                var size = value > 0 ? scale.size(value) : scale.size(val_range[0])
                if (size > 6 && labels && clicked) create_label(d);
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
                if (!clicked) {
                  zoom(highlight);
                  clicked = true;
                  update();
                } else {
                  highlight = null;
                  zoom("reset");
                  update();
                }
              })
              .each(function(d){ if (labels && clicked) create_label(d); });
            
              
          // Draw Info Panel
          if (scale.x(connections[highlight].extent.x[1]) > (width-info_width-10)) var x_pos = 37+(info_width/2)
          else var x_pos = width
          
          var tooltip_data = {},
              tooltip_appends = [],
              sub_title = null
          
          if (!clicked) {
            sub_title = "Click Node for More Info"
          } else {
            tooltip_info.forEach(function(t){
              if (data[highlight][t]) tooltip_data[t] = data[highlight][t]
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
              prims.push(c[id_var])
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
                    "text": data[c][text_var],
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
                    "text": data[c][text_var],
                    "events": {}
                  }
                ]
              }
              obj.children[0].attr["fill"] = function(){
                  var color = data[c].color ? data[c].color : vizwhiz.utils.rand_color()
                  if (data[c].active) {
                    return color;
                  } else {
                    color = d3.hsl(color)
                    color.l = 0.98
                    return color.toString()
                  }
                }
              obj.children[0].attr["stroke"] = function(){
                  var color = data[c].color ? data[c].color : vizwhiz.utils.rand_color()
                  if (data[c].active) return d3.rgb(color).darker().darker().toString();
                  else return d3.rgb(color).darker().toString()
                }
              obj.children[0].attr["stroke-width"] = function(){
                  if(data[c].active) return 2;
                  else return 1;
                }
              obj.children[1].events[vizwhiz.evt.over] = function(){
                  d3.select(this).attr('fill',highlight_color).style('cursor','pointer')
                }
              obj.children[1].events[vizwhiz.evt.out] = function(){
                  d3.select(this).attr("fill","#333333")
                }
              obj.children[1].events[vizwhiz.evt.click] = function(){
                  highlight = c;
                  zoom(highlight);
                  update();
                }
              tooltip_appends.push(obj)
            })
          }
          
          vizwhiz.tooltip.create({
            "parent": svg,
            "data": tooltip_data,
            "title": data[highlight][text_var],
            "description": sub_title,
            "x": x_pos,
            "y": 0,
            "width": info_width,
            "arrow": false,
            "appends": tooltip_appends
          })
          
        } else if (clicked) {
          clicked = false;
          node.call(node_color)
        }
        
      }
      
      function create_label(d) {
        var bg = d3.select("g.highlight").append("rect")
          .datum(d)
          .attr("y", function(e) { return scale.y(e.y)-5; })
          .attr("height", "10px")
          .attr("rx",3)
          .attr("ry",3)
          .attr("stroke-width", function(d){
            if(data[d[id_var]].active) return 2;
            else return 1;
          })
          .call(node_color)
          .on(vizwhiz.evt.over, function(d){
            d3.select(this).style("cursor","pointer")
          })
          .on(vizwhiz.evt.click, function(d){
            if (d[id_var] == highlight) {
              highlight = null;
              zoom("reset");
              update();
            } else {
              highlight = d[id_var];
              zoom(highlight);
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
              "text": data[e[id_var]][text_var],
              "parent": this,
              "width": 60,
              "height": 10
            });
          })
          .on(vizwhiz.evt.over, function(d){
            d3.select(this).style("cursor","pointer")
          })
          .on(vizwhiz.evt.click, function(d){
            if (d[id_var] == highlight) {
              highlight = null;
              zoom("reset");
              update();
            } else {
              highlight = d[id_var];
              zoom(highlight);
              update();
            }
          })
                    
        text
          .attr("y", function(e) { return scale.y(e.y)-(text.node().getBBox().height/2); })
                  
        var w = text.node().getBBox().width+5
        var value = data[d[id_var]][value_var]
        var size = value > 0 ? scale.size(value) : scale.size(val_range[0])
        if (w < size*2) {
          bg.remove();
        } else {
          bg.attr("width",w).attr("x", function(e) { return scale.x(e.x)-(w/2); });
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
          } else if (connections[direction]) {
            var x_bounds = [scale.x(connections[direction].extent.x[0]),scale.x(connections[direction].extent.x[1])],
                y_bounds = [scale.y(connections[direction].extent.y[0]),scale.y(connections[direction].extent.y[1])]
                
            if (x_bounds[1] > (width-info_width-5)) var offset_left = info_width+32
            else var offset_left = 0
                
            var w_zoom = (width-info_width-10)/(x_bounds[1]-x_bounds[0]),
                h_zoom = height/(y_bounds[1]-y_bounds[0])
            
            if (w_zoom < h_zoom) {
              x_bounds = [x_bounds[0]-(max_size*2),x_bounds[1]+(max_size*2)]
              evt_scale = (width-info_width-10)/(x_bounds[1]-x_bounds[0])
              if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
              offset_x = -(x_bounds[0]*evt_scale)
              offset_y = -(y_bounds[0]*evt_scale)+((height-((y_bounds[1]-y_bounds[0])*evt_scale))/2)
            } else {
              y_bounds = [y_bounds[0]-(max_size*2),y_bounds[1]+(max_size*2)]
              evt_scale = height/(y_bounds[1]-y_bounds[0])
              if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
              offset_x = -(x_bounds[0]*evt_scale)+(((width-info_width-10)-((x_bounds[1]-x_bounds[0])*evt_scale))/2)
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
              offset_x = (width/2)-(((width/2)-offset_x)*multiplier)
              offset_y = (height/2)-(((height/2)-offset_y)*multiplier)
            }
          
            translate = [offset_x,offset_y]
            evt_scale = zoom_var*multiplier
          }
        
        }
        
        zoom_behavior.translate(translate).scale(evt_scale)
        
        // Auto center visualization
        if (translate[0] > 0) translate[0] = 0
        else if (translate[0] < -((width*evt_scale)-width)) {
          translate[0] = -((width*evt_scale)-width)
        }
        if (translate[1] > 0) translate[1] = 0
        else if (translate[1] < -((height*evt_scale)-height)) translate[1] = -((height*evt_scale)-height)
        if (!direction) {
          if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
            var viz_timing = d3.select(".viz")
          } else {
            var viz_timing = d3.select(".viz").transition().duration(timing)
          }
        } else {
          var viz_timing = d3.select(".viz").transition().duration(timing)
        }
        viz_timing.attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
        
      }

      //===================================================================
      
    });
    
    return chart;
    
  }


  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------

  chart.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return chart;
  };

  chart.nodes = function(x) {
    if (!arguments.length) return nodes;
    nodes = x;
    x_range = d3.extent(d3.values(nodes), function(d){return d.x});
    y_range = d3.extent(d3.values(nodes), function(d){return d.y});
    aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0]);
    return chart;
  };

  chart.links = function(x) {
    if (!arguments.length) return links;
    links = x;
    links.forEach(function(d) {
      if (!connections[d.source[id_var]]) {
        connections[d.source[id_var]] = {}
        connections[d.source[id_var]].center = d.source
        connections[d.source[id_var]].primary = {"nodes": [], "links": []}
      }
      connections[d.source[id_var]].primary.nodes.push(d.target)
      connections[d.source[id_var]].primary.links.push({"source": d.source, "target": d.target})
      if (!connections[d.target[id_var]]) {
        connections[d.target[id_var]] = {}
        connections[d.target[id_var]].center = d.target
        connections[d.target[id_var]].primary = {"nodes": [], "links": []}
      }
      connections[d.target[id_var]].primary.nodes.push(d.source)
      connections[d.target[id_var]].primary.links.push({"source": d.target, "target": d.source})
    })
    for (var c in connections) {
      connections[c].secondary = {"nodes": [], "links": []}
      connections[c].primary.nodes.forEach(function(p){
        connections[p[id_var]].primary.nodes.forEach(function(s){
          if (s[id_var] != c) {
            if (connections[c].primary.nodes.indexOf(s) < 0 && connections[c].secondary.nodes.indexOf(s) < 0) {
              connections[c].secondary.nodes.push(s)
            }
            var dupe = false
            connections[c].secondary.links.forEach(function(l){
              if (l.source == s && l.target == p) dupe = true
            })
            if (!dupe) {
              connections[c].secondary.links.push({"source": p, "target": s})
            }
          }
        })
      })
      // var node_check = connections[c].primary.nodes.concat(connections[c].secondary.nodes).concat([connections[c].center])
      var node_check = connections[c].primary.nodes.concat([connections[c].center])
      connections[c].extent = {}
      connections[c].extent.x = d3.extent(d3.values(node_check),function(v){return v.x;}),
      connections[c].extent.y = d3.extent(d3.values(node_check),function(v){return v.y;})
    }
    return chart;
  };

  chart.spotlight = function(x) {
    if (!arguments.length) return spotlight;
    spotlight = x;
    return chart;
  };

  chart.labels = function(x) {
    if (!arguments.length) return labels;
    labels = x;
    return chart;
  };

  chart.highlight = function(x) {
    if (!arguments.length) return highlight;
    highlight = x;
    if (highlight) clicked = true;
    else clicked = false;
    return chart;
  };
  
  chart.value_var = function(x) {
    if (!arguments.length) return value_var;
    value_var = x;
    return chart;
  };
  
  chart.id_var = function(x) {
    if (!arguments.length) return id_var;
    id_var = x;
    return chart;
  };
  
  chart.text_var = function(x) {
    if (!arguments.length) return text_var;
    text_var = x;
    return chart;
  };
  
  chart.tooltip_info = function(x) {
    if (!arguments.length) return tooltip_info;
    tooltip_info = x;
    return chart;
  };

  //===================================================================


  return chart;
};
