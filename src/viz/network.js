vizwhiz.viz.network = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = 300,
      height = 300,
      dragging = false,
      clicked = false,
      spotlight = true,
      highlight = null,
      highlight_color = "#cc0000",
      select_color = "#ee0000",
      secondary_color = "#ffdddd",
      timing = 100,
      zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
      nodes = [],
      links = [],
      connections = {},
      scale = {};

  //===================================================================


  function chart(selection) {
    selection.each(function(data, i) {
      
      var this_selection = this
      
      // Select the svg element, if it exists.
      var svg = d3.select(this_selection).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height);
        
      // Define Scale
      var x_range = d3.extent(d3.values(nodes), function(d){return d.x}),
          y_range = d3.extent(d3.values(nodes), function(d){return d.y}),
          aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0]),
          padding = 20
          
      var viz_width = width,
          viz_height = height,
          offset_top = 0,
          offset_left = 0;
          
      if (aspect > viz_width/viz_height) {
        var viz_height = viz_width/aspect
        offset_top = ((height-viz_height)/2)
      } else {
        var viz_width = viz_height*aspect
        offset_left = ((width-viz_width)/2)
      }
          
      var columns = Math.ceil(Math.sqrt(Object.keys(nodes).length*(viz_width/viz_height))),
          max_size = viz_width/(columns*3),
          min_size = max_size/5 < 2 ? 2 : max_size/5
          
      // x scale
      scale["x"] = d3.scale.linear()
        .domain(x_range)
        .range([offset_left+padding, width-padding-offset_left])
      // y scale
      scale["y"] = d3.scale.linear()
        .domain(y_range)
        .range([offset_top+padding, height-padding-offset_top])
      // size scale
      var val_range = d3.extent(d3.values(data), function(d){
        return d.value > 0 ? d.value : null
      });
      scale["size"] = d3.scale.log()
        .domain(val_range)
        .range([min_size, max_size])
        
      // Create viz group on svg_enter
      var viz_enter = svg_enter.append("g")
        .call(zoom_behavior.on("zoom", zoom))
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
          clicked = null;
          highlight = null;
          zoom("reset");
          update();
        })
        
      viz_enter.append('g')
        .attr('class','links')
        
      viz_enter.append('g')
        .attr('class','nodes')
        
      viz_enter.append('g')
        .attr('class','highlight')
        
      // Create Zoom Controls group on svg_enter
      var zoom_div = svg.enter().append("div")
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
        .data(nodes, function(d) { return d.id; })
      
      node.enter().append("circle")
        .attr("class","node")
        .call(size_nodes)
        .call(color_nodes)
        .on(vizwhiz.evt.over, function(d){
          if (!clicked) {
            highlight = d.id;
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
          highlight = d.id;
          zoom(highlight);
          update();
        })
      
      var link = d3.select("g.links").selectAll("line.link")
        .data(links, function(d) { return d.source.id + "-" + d.target.id; })
        
      link.enter().append("line")
        .attr("class","link")
        .call(position_links)
        .attr("stroke", "#dedede")
        .attr("stroke-width", "1px")
        .on(vizwhiz.evt.click,function(d){
          clicked = null
          highlight = null;
          zoom("reset");
          update();
        });
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for nodes and links that are already in existance
      //-------------------------------------------------------------------

      node.transition().duration(timing)
        .call(size_nodes)
        .call(color_nodes);
        
      link.transition().duration(timing)
        .call(position_links);
        
      d3.select('.overlay').transition().duration(timing)
        .attr("width", viz_width)
        .attr("height", viz_height)
        
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
          
      function position_links(l) {
        l
          .attr("x1", function(d) { return scale.x(d.source.x); })
          .attr("y1", function(d) { return scale.y(d.source.y); })
          .attr("x2", function(d) { return scale.x(d.target.x); })
          .attr("y2", function(d) { return scale.y(d.target.y); });
      }
      
      function size_nodes(n) {
        n
          .attr("cx", function(d) { return scale.x(d.x); })
          .attr("cy", function(d) { return scale.y(d.y); })
          .attr("r", function(d) { 
            var value = data[d.id].value
            return value > 0 ? scale.size(value) : scale.size(val_range[0])
          })
          .attr("stroke-width", function(d){
            if(data[d.id].active) return 2;
            else return 1;
          })
      }
      
      function size_bgs(b) {
        b
          .attr("cx", function(d) { return scale.x(d.x); })
          .attr("cy", function(d) { return scale.y(d.y); })
          .attr("r", function(d) { 
            var value = data[d.id].value,
                buffer = data[d.id].active ? 3 : 2
            value = value > 0 ? scale.size(value) : scale.size(val_range[0])
            return value+buffer
          })
          .attr("stroke-width",0)
      }
      
      function color_nodes(n) {
        n
          .attr("fill", function(d){
            var color = data[d.id].color ? data[d.id].color : vizwhiz.utils.rand_color()
            if (data[d.id].active) {
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
            var color = data[d.id].color ? data[d.id].color : vizwhiz.utils.rand_color()
            if (data[d.id].active) return d3.rgb(color).darker().darker().toString();
            else if (spotlight && !highlight) return "#dedede";
            else return d3.rgb(color).darker().toString()
          })
      }
      
      function update() {
        
        d3.selectAll("g.highlight line").remove()
        d3.selectAll("g.highlight circle").remove()
        
        if (highlight) {
          
          node
            .attr("fill","#efefef")
            .attr("stroke","#dedede")
            
          var center = connections[highlight].center,
              primaries = connections[highlight].primary,
              secondaries = connections[highlight].secondary
              
          // Draw Primary, Secondary and Center Connection Lines and BGs
          d3.select("g.highlight").selectAll("line.sec_links")
            .data(secondaries.links).enter()
            .append("line")
              .attr("class","sec_links")
              .attr("stroke-width", "1px")
              .attr("stroke", secondary_color)
              .call(position_links);
          d3.select("g.highlight").selectAll("circle.sec_bgs")
            .data(secondaries.nodes).enter()
            .append("circle")
              .attr("class","sec_bgs")
              .attr("fill", secondary_color)
              .call(size_bgs);
          
          // Draw Secondary Nodes
          d3.select("g.highlight").selectAll("circle.sec_nodes")
            .data(secondaries.nodes).enter()
            .append("circle")
              .attr("class","sec_nodes")
              .call(size_nodes)
              .attr("fill","#efefef")
              .attr("stroke","#dedede")
              .on(vizwhiz.evt.over, function(d){
                if (!clicked) {
                  highlight = d.id;
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
                highlight = d.id;
                zoom(highlight);
                update();
              });
              
          // Draw Primary Connection Lines and BGs
          d3.select("g.highlight").selectAll("line.prim_links")
            .data(primaries.links).enter()
            .append("line")
              .attr("class","prim_links")
              .attr("stroke", highlight_color)
              .attr("stroke-width", "2px")
              .call(position_links);
          d3.select("g.highlight").selectAll("circle.prim_bgs")
            .data(primaries.nodes).enter()
            .append("circle")
              .attr("class","prim_bgs")
              .call(size_bgs)
              .attr("fill",highlight_color);
          
          // Draw Primary Nodes
          d3.select("g.highlight").selectAll("circle.prim_nodes")
            .data(primaries.nodes).enter()
            .append("circle")
              .attr("class","prim_nodes")
              .call(size_nodes)
              .call(color_nodes)
              .on(vizwhiz.evt.over, function(d){
                if (!clicked) {
                  highlight = d.id;
                  update();
                }
              })
              .on(vizwhiz.evt.click, function(d){
                highlight = d.id;
                zoom(highlight);
                update();
              });
          
          // Draw Main Center Node and BG
          d3.select("g.highlight").selectAll("circle.center_bg")
            .data([center]).enter()
            .append("circle")
              .attr("class","center_bg")
              .call(size_bgs)
              .attr("fill",select_color);
          d3.select("g.highlight").selectAll("circle.center")
            .data([center]).enter()
            .append("circle")
              .attr("class","center")
              .call(size_nodes)
              .call(color_nodes)
              .on(vizwhiz.evt.out, function(d){
                if (!clicked) {
                  highlight = null;
                  update();
                }
              })
              .on(vizwhiz.evt.click, function(d){
                if (!clicked) {
                  zoom(highlight);
                  clicked = true;
                } else {
                  zoom("reset");
                  clicked = false;
                }
              })
          
        } else {
          node.call(color_nodes)
        }
        
      }
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Function that handles the zooming and panning of the visualization
      //-------------------------------------------------------------------
      
      function zoom(direction) {
        
        var zoom_extent = zoom_behavior.scaleExtent()
        // If d3 zoom event is detected, use it!
        if(d3.event.scale) {
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
            var x_bounds_prim = d3.extent(d3.values(connections[direction].primary.nodes),function(v){return scale.x(v.x);}),
                y_bounds_prim = d3.extent(d3.values(connections[direction].primary.nodes),function(v){return scale.y(v.y);}),
                x_bounds_sec = d3.extent(d3.values(connections[direction].secondary.nodes),function(v){return scale.x(v.x);}),
                y_bounds_sec = d3.extent(d3.values(connections[direction].secondary.nodes),function(v){return scale.y(v.y);}),
                x_bounds = d3.extent(x_bounds_prim.concat(x_bounds_sec).concat(scale.x(connections[direction].center.x))),
                y_bounds = d3.extent(y_bounds_prim.concat(y_bounds_sec).concat(scale.y(connections[direction].center.y))),
                w_zoom = width/(x_bounds[1]-x_bounds[0]),
                h_zoom = height/(y_bounds[1]-y_bounds[0])
            
            if (w_zoom < h_zoom) {
              x_bounds = [x_bounds[0]-(max_size*2),x_bounds[1]+(max_size*2)]
              evt_scale = width/(x_bounds[1]-x_bounds[0])
              if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
              offset_x = -(x_bounds[0]*evt_scale)
              offset_y = -(y_bounds[0]*evt_scale)+((height-((y_bounds[1]-y_bounds[0])*evt_scale))/2)
            } else {
              y_bounds = [y_bounds[0]-(max_size*2),y_bounds[1]+(max_size*2)]
              evt_scale = height/(y_bounds[1]-y_bounds[0])
              if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
              offset_x = -(x_bounds[0]*evt_scale)+((width-((x_bounds[1]-x_bounds[0])*evt_scale))/2)
              offset_y = -(y_bounds[0]*evt_scale)
            }

            translate = [offset_x,offset_y]
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
        else if (translate[0] < -((width*evt_scale)-width)) translate[0] = -((width*evt_scale)-width)
        if (translate[1] > 0) translate[1] = 0
        else if (translate[1] < -((height*evt_scale)-height)) translate[1] = -((height*evt_scale)-height)
        
        if (d3.event.scale) {
          if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
            d3.select(".viz")
              .attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
          } else {
            d3.select(".viz").transition().duration(timing)
              .attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
          }
        } else {
          d3.select(".viz").transition().duration(timing*4)
            .attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
        }
        
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
    return chart;
  };

  chart.links = function(x) {
    if (!arguments.length) return links;
    links = x;
    links.forEach(function(d) {
      if (!connections[d.source.id]) {
        connections[d.source.id] = {}
        connections[d.source.id].center = d.source
        connections[d.source.id].primary = {"nodes": [], "links": []}
      }
      connections[d.source.id].primary.nodes.push(d.target)
      connections[d.source.id].primary.links.push({"source": d.source, "target": d.target})
      if (!connections[d.target.id]) {
        connections[d.target.id] = {}
        connections[d.target.id].center = d.target
        connections[d.target.id].primary = {"nodes": [], "links": []}
      }
      connections[d.target.id].primary.nodes.push(d.source)
      connections[d.target.id].primary.links.push({"source": d.target, "target": d.source})
    })
    for (var c in connections) {
      connections[c].secondary = {"nodes": [], "links": []}
      connections[c].primary.nodes.forEach(function(p){
        connections[p.id].primary.nodes.forEach(function(s){
          if (s.id != c) {
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
    }
    return chart;
  };

  chart.spotlight = function(x) {
    if (!arguments.length) return spotlight;
    spotlight = x;
    return chart;
  };

  chart.highlight = function(x) {
    if (!arguments.length) return highlight;
    highlight = x;
    if (highlight) clicked = true;
    else clicked = false;
    return chart;
  };

  //===================================================================


  return chart;
};