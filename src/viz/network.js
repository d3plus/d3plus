vizwhiz.network = function(vars) {
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function that handles the zooming and panning of the visualization
  //-------------------------------------------------------------------
  
  vars.zoom = function(direction) {
    
    var zoom_extent = zoom_behavior.scaleExtent()
    // If d3 zoom event is detected, use it!
    if(!direction) {
      evt_scale = d3.event.scale
      translate = d3.event.translate
    } 
    else {
      if (direction == "in") {
        if (zoom_behavior.scale() > zoom_extent[1]/2) multiplier = zoom_extent[1]/zoom_behavior.scale()
        else multiplier = 2
      } 
      else if (direction == "out") {
        if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
        else multiplier = 0.5
      } 
      else if (direction == vars.highlight) {
        var x_bounds = [scale.x(highlight_extent.x[0]),scale.x(highlight_extent.x[1])],
            y_bounds = [scale.y(highlight_extent.y[0]),scale.y(highlight_extent.y[1])]
            
        if (x_bounds[1] > (vars.width-info_width-5)) var offset_left = info_width+32
        else var offset_left = 0
            
        var w_zoom = (vars.width-info_width-10)/(x_bounds[1]-x_bounds[0]),
            h_zoom = vars.height/(y_bounds[1]-y_bounds[0])
        
        if (w_zoom < h_zoom) {
          x_bounds = [x_bounds[0]-(max_size*4),x_bounds[1]+(max_size*4)]
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
      } 
      else if (direction == "reset") {
        vars.highlight = null
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
  
  vars.update = function() {
    // If highlight variable has ACTUALLY changed, do this stuff
    if (last_highlight != vars.highlight) {
      
      // Remove all tooltips on page
      vizwhiz.tooltip.remove(vars.type)
      d3.select("g.highlight").selectAll("*").remove()
      d3.select("g.hover").selectAll("*").remove()
      
      if (vars.highlight) {
                          
        create_nodes("highlight")
        
      }
      else {
        vars.zoom("reset");
      }
      
      node.call(node_color)
      
      last_highlight = vars.highlight
    }

    // If hover variable has ACTUALLY changed, do this stuff
    if (last_hover != hover) {

      d3.select("g.hover").selectAll("*").remove()
      
      // If a new hover element exists, create it
      if (hover && hover != vars.highlight) {
        create_nodes("hover")
      }
      
      // Set last_hover to the new hover ID
      last_hover = hover
    }
    
    function create_nodes(group) {
      
      if (group == "highlight") {
        var c = vars.highlight
      }
      else {
        var c = hover
      }
      
      var node_data = vars.nodes.filter(function(x){return x[vars.id_var] == c})
      
      if (group == "highlight" || !vars.highlight) {

        var prim_nodes = [],
            prim_links = [];
            
        if (vars.connections[c]) {
          vars.connections[c].forEach(function(n){
            prim_nodes.push(vars.nodes.filter(function(x){return x[vars.id_var] == n[vars.id_var]})[0])
          })
          prim_nodes.forEach(function(n){
            prim_links.push({"source": node_data[0], "target": n})
          })
        }
        
        var node_data = prim_nodes.concat(node_data)
        highlight_extent.x = d3.extent(d3.values(node_data),function(v){return v.x;}),
        highlight_extent.y = d3.extent(d3.values(node_data),function(v){return v.y;})

        if (group == "highlight") {
          vars.zoom(c);
          
          make_tooltip = function(html) {
        
            if (typeof html == "string") html = "<br>"+html

            if (scale.x(highlight_extent.x[1]) > (vars.width-info_width-10)) {
              var x_pos = 30
            }
            else {
              var x_pos = vars.width-info_width-5
            }
         
            var prod = vars.nodes.filter(function(n){return n[vars.id_var] == vars.highlight})[0]
          
            var tooltip_data = get_tooltip_data(vars.highlight)
          
            var tooltip_appends = "<div class='vizwhiz_network_title'>Primary Connections</div>"
      
            prim_nodes.forEach(function(n){
            
              var parent = "d3.select(&quot;#"+vars.parent.node().id+"&quot;)"
            
              tooltip_appends += "<div class='vizwhiz_network_connection' onclick='"+parent+".call(chart.highlight(&quot;"+n[vars.id_var]+"&quot;))'>"
              tooltip_appends += "<div class='vizwhiz_network_connection_node'"
              tooltip_appends += " style='"
              tooltip_appends += "background-color:"+fill_color(n)+";"
              tooltip_appends += "border-color:"+stroke_color(n)+";"
              tooltip_appends += "'"
              tooltip_appends += "></div>"
              tooltip_appends += "<div class='vizwhiz_network_connection_name'>"
              tooltip_appends += find_variable(n[vars.id_var],vars.text_var)
              tooltip_appends += "</div>"
              tooltip_appends += "</div>"
            })
          
            vizwhiz.tooltip.create({
              "data": tooltip_data,
              "title": find_variable(vars.highlight,vars.text_var),
              "color": find_variable(vars.highlight,vars.color_var),
              "icon": find_variable(vars.highlight,"icon"),
              "x": x_pos,
              "y": vars.margin.top+5,
              "width": info_width,
              "html": tooltip_appends+html,
              "fixed": true,
              "mouseevents": true,
              "parent": vars.parent,
              "background": vars.background,
              "id": vars.type
            })
            
          }
          
          var html = vars.click_function ? vars.click_function(vars.highlight) : ""
    
          if (typeof html == "string") make_tooltip(html)
          else {
            d3.json(html.url,function(data){
              html = html.callback(data)
              make_tooltip(html)
            })
          }
          
        }
        
        d3.select("g."+group).selectAll("line")
          .data(prim_links).enter().append("line")
            .attr("pointer-events","none")
            .attr("stroke",vars.highlight_color)
            .attr("stroke-width",2)
            .call(link_position)
      }
      
      var node_groups = d3.select("g."+group).selectAll("g")
        .data(node_data).enter().append("g")
          .attr("class","hover_node")
          .call(node_events)
    
      node_groups
        .append("circle")
          .attr("class","bg")
          .call(node_size)
          .call(node_position)
          .call(node_stroke)
          .attr("stroke",vars.highlight_color);
        
      node_groups
        .append("circle")
          .call(node_size)
          .call(node_position)
          .call(node_stroke)
          .call(node_color)
          .call(create_label);
    }
    
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------
  
  var dragging = false,
      offset_top = 0,
      offset_left = 0,
      info_width = 300,
      zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
      scale = {},
      hover = null,
      last_hover = null,
      last_highlight = null,
      highlight_extent = {};

  //===================================================================
    

  var x_range = d3.extent(d3.values(vars.nodes), function(d){return d.x})
  var y_range = d3.extent(d3.values(vars.nodes), function(d){return d.y})
  var aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0])
    
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
    
  var val_range = d3.extent(d3.values(vars.data), function(d){
    return d[vars.value_var] ? d[vars.value_var] : null
  });
  
  if (typeof val_range[0] == "undefined") val_range = [1,1]
  
  var distances = []
  vars.nodes.forEach(function(n1){
    vars.nodes.forEach(function(n2){
      if (n1 != n2) {
        var xx = Math.abs(scale.x(n1.x)-scale.x(n2.x));
        var yy = Math.abs(scale.y(n1.y)-scale.y(n2.y));
        distances.push(Math.sqrt((xx*xx)+(yy*yy)))
      }
    })
  })
  
  var max_size = d3.min(distances)
  var min_size = 2;
  // return
  // x scale
  scale.x.range([offset_left+(max_size*1.5), vars.width-(max_size*1.5)-offset_left])
  // y scale
  scale.y.range([offset_top+(max_size*1.5), vars.height-(max_size*1.5)-offset_top])
  
  // size scale
  scale.size = d3.scale.log()
    .domain(val_range)
    .range([min_size, max_size])
    
  // Create viz group on vars.parent_enter
  var viz_enter = vars.parent_enter.append("g")
    .call(zoom_behavior.on("zoom",function(){ vars.zoom(); }))
    .on(vizwhiz.evt.down,function(d){
      dragging = true
    })
    .on(vizwhiz.evt.up,function(d){
      dragging = false
    })
    .append('g')
      .attr('class','viz')
    
  viz_enter.append('rect')
    .attr('class','overlay')
    .attr("fill","transparent");
    
  d3.select("rect.overlay")
    .attr("width", vars.width)
    .attr("height", vars.height)
    .on(vizwhiz.evt.over,function(d){
      if (!vars.highlight && hover) {
        hover = null;
        vars.update();
      }
    })
    .on(vizwhiz.evt.click,function(d){
      vars.highlight = null;
      vars.zoom("reset");
      vars.update();
    })
    .on(vizwhiz.evt.move,function(d){
      if (zoom_behavior.scale() > 1) {
        d3.select(this).style("cursor","move")
        if (dragging) {
          d3.select(this).style("cursor","-moz-grabbing")
          d3.select(this).style("cursor","-webkit-grabbing")
        }
        else {
          d3.select(this).style("cursor","-moz-grab")
          d3.select(this).style("cursor","-webkit-grab")
        }
      }
      else {
        d3.select(this).style("cursor","default")
      }
    });
    
  viz_enter.append('g')
    .attr('class','links')
    
  viz_enter.append('g')
    .attr('class','nodes')
    
  viz_enter.append('g')
    .attr('class','highlight')
    
  viz_enter.append('g')
    .attr('class','hover')
    
  zoom_controls();
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New nodes and links enter, initialize them here
  //-------------------------------------------------------------------
  
  var node = d3.select("g.nodes").selectAll("circle.node")
    .data(vars.nodes, function(d) { return d[vars.id_var]; })
  
  node.enter().append("circle")
    .attr("class","node")
    .attr("r",0)
    .call(node_position)
    .call(node_color)
    .call(node_stroke);
  
  var link = d3.select("g.links").selectAll("line.link")
    .data(vars.links, function(d) { return d.source[vars.id_var] + "-" + d.target[vars.id_var]; })
    
  link.enter().append("line")
    .attr("class","link")
    .attr("pointer-events","none")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .call(link_position);
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for nodes and links that are already in existance
  //-------------------------------------------------------------------

  node
    .on(vizwhiz.evt.over, function(d){
      if (!dragging) {
        hover = d[vars.id_var];
        vars.update();
      }
    });

  node.transition().duration(vizwhiz.timing)
    .call(node_size)
    .call(node_stroke)
    .call(node_position)
    .call(node_color);
    
  link
    .call(link_events);
    
  link.transition().duration(vizwhiz.timing)
    .attr("stroke", "#dedede")
    .call(link_position);
      
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit, for nodes and links that are being removed
  //-------------------------------------------------------------------

  node.exit().transition().duration(vizwhiz.timing)
    .attr("r",0)
    .remove()
    
  link.exit().transition().duration(vizwhiz.timing)
    .attr("stroke", "white")
    .remove()

  //===================================================================
  
  if (vars.highlight) {
    var present = false;
    vars.nodes.forEach(function(d){
      if (d[vars.id_var] == vars.highlight) present = true;
    })
    if (!present) {
      vars.highlight = null;
    }
  }
  vars.update();
      
  function link_position(l) {
    l
      .attr("x1", function(d) { return scale.x(d.source.x); })
      .attr("y1", function(d) { return scale.y(d.source.y); })
      .attr("x2", function(d) { return scale.x(d.target.x); })
      .attr("y2", function(d) { return scale.y(d.target.y); })
      .attr("vector-effect","non-scaling-stroke")
  }
  
  function link_events(l) {
    l
      .on(vizwhiz.evt.click,function(d){
        vars.highlight = null;
        vars.zoom("reset");
        vars.update();
      })
  }
  
  function node_position(n) {
    n
      .attr("cx", function(d) { return scale.x(d.x); })
      .attr("cy", function(d) { return scale.y(d.y); })
  }
  
  function node_size(n) {
    n
      .attr("r", function(d) { 
        var value = find_variable(d[vars.id_var],vars.value_var)
        return value > 0 ? scale.size(value) : scale.size(val_range[0])
      })
  }
  
  function node_stroke(b) {
    b
      .attr("stroke-width", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal
        var class_name = this.className.baseVal
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        var bg = class_name == "bg"
        
        if (bg) {
          if (vars.highlight == d[vars.id_var]) return 6;
          else return 4;
        }
        else if (highlighted) return 0;
        else return 1;
      })
      .attr("vector-effect","non-scaling-stroke")
  }
  
  function node_color(n) {
    n
      .attr("fill", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal
        
        // "True" if node is a background node and a node has been highlighted
        var background_node = vars.highlight && parent_group == "nodes"
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        // "True" if vars.spotlight is true and node vars.active_var is false
        var active = find_variable(d[vars.id_var],vars.active_var)
        var hidden = vars.spotlight && !active
        // Grey out nodes that are in the background or hidden by spotlight,
        // otherwise, use the active_color function
        if ((background_node || hidden) && !highlighted) {
          return "#efefef"
        }
        else {
          var active = find_variable(d[vars.id_var],vars.active_var)
          if (active) this.parentNode.appendChild(this)
          return fill_color(d)
        }
        
      })
      .attr("stroke", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal;
        
        // "True" if node is a background node and a node has been highlighted
        var background_node = vars.highlight && parent_group == "nodes";
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        // "True" if vars.spotlight is true and node vars.active_var is false
        var active = find_variable(d[vars.id_var],vars.active_var)
        var hidden = vars.spotlight && !active
        
        if (highlighted) return fill_color(d);
        else if (background_node || hidden) return "#dedede";
        else return stroke_color(d);
        
      })
  }
  
  function fill_color(d) {
    
    // Get elements' color
    var color = find_variable(d[vars.id_var],vars.color_var)
    
    // If node is not active, lighten the color
    var active = find_variable(d[vars.id_var],vars.active_var)
    if (!active) {
      var color = d3.hsl(color);
      color.l = 0.95;
    }
    
    // Return the color
    return color;
    
  }
  
  function stroke_color(d) {
    
    // Get elements' color
    var color = find_variable(d[vars.id_var],vars.color_var)
    
    // If node is active, return a darker color, else, return the normal color
    var active = find_variable(d[vars.id_var],vars.active_var)
    return active ? "#333" : color;
    
  }
  
  function node_events(n) {
    n
      .on(vizwhiz.evt.over, function(d){
        
        d3.select(this).style("cursor","pointer")
        d3.select(this).style("cursor","-moz-zoom-in")
        d3.select(this).style("cursor","-webkit-zoom-in")
          
        if (d[vars.id_var] == vars.highlight) {
          d3.select(this).style("cursor","-moz-zoom-out")
          d3.select(this).style("cursor","-webkit-zoom-out")
        }
        
        if (d[vars.id_var] != hover) {
          hover = d[vars.id_var];
          vars.update();
        }
        
      })
      .on(vizwhiz.evt.out, function(d){
        
        // Returns false if the mouse has moved into a child element.
        // This is used to catch when the mouse moves onto label text.
        var target = d3.event.toElement
        if (target) {
          var id_check = target.__data__[vars.id_var] == d[vars.id_var]
          if (d3.event.toElement.parentNode != this && !id_check) {
            hover = null;
            vars.update();
          }
        }
        else {
          hover = null;
          vars.update();
        }
        
      })
      .on(vizwhiz.evt.click, function(d){
        
        d3.select(this).style("cursor","auto")

        // If there is no highlighted node, 
        // or the hover node is not the highlighted node
        if (!vars.highlight || vars.highlight != d[vars.id_var]) {
          vars.highlight = d[vars.id_var];
        } 
        
        // Else, the user is clicking on the highlighted node.
        else {
          vars.highlight = null;
        }
        
        vars.update();
        
      })
  }
  
  function create_label(n) {
    if (vars.labels) {
      n.each(function(d){

        var font_size = Math.ceil(10/zoom_behavior.scale()),
            padding = font_size/4,
            corner = Math.ceil(3/zoom_behavior.scale())
            value = find_variable(d[vars.id_var],vars.value_var),
            size = value > 0 ? scale.size(value) : scale.size(val_range[0])
        if (font_size < size || d[vars.id_var] == hover || d[vars.id_var] == vars.highlight) {
          d3.select(this.parentNode).append("text")
            .attr("pointer-events","none")
            .attr("x",scale.x(d.x))
            .attr("fill",vizwhiz.utils.text_color(fill_color(d)))
            .attr("font-size",font_size+"px")
            .attr("text-anchor","middle")
            .attr("font-family",vars.font)
            .attr("font-weight",vars.font_weight)
            .each(function(e){
              var th = size < font_size+padding*2 ? font_size+padding*2 : size,
                  tw = ((font_size*5)/th)*(font_size*5)
              var text = find_variable(d[vars.id_var],vars.text_var)
              vizwhiz.utils.wordwrap({
                "text": text,
                "parent": this,
                "width": tw,
                "height": th,
                "padding": 0
              });
              if (!d3.select(this).select("tspan")[0][0]) {
                d3.select(this).remove();
              }
              else {
                finish_label(d3.select(this));
              }
            })
        }
              
        function finish_label(text) {
          
          var w = text.node().getBBox().width,
              h = text.node().getBBox().height
        
          text.attr("y",scale.y(d.y)-(h/2)-(padding/3))
          
          w = w+(padding*6)
          h = h+(padding*2)
          
          if (w > size*2) {
            d3.select(text.node().parentNode)
              .insert("rect","circle")
                .attr("class","bg")
                .attr("rx",corner)
                .attr("ry",corner)
                .attr("width",w)
                .attr("height",h)
                .attr("y",scale.y(d.y)-(h/2))
                .attr("x",scale.x(d.x)-(w/2))
                .call(node_stroke)
                .attr("stroke",vars.highlight_color);
            d3.select(text.node().parentNode)
              .insert("rect","text")
                .attr("rx",corner)
                .attr("ry",corner)
                .attr("stroke-width", 0)
                .attr("fill",fill_color(d))
                .attr("width",w)
                .attr("height",h)
                .attr("y",scale.y(d.y)-(h/2))
                .attr("x",scale.x(d.x)-(w/2));
          }
        }
        
      })
      
    }
  }
      
};
