
vizwhiz.rings = function(vars) {
      
  var tooltip_width = 300
      
  var width = vars.small ? vars.width : vars.width-tooltip_width
      
  var tree_radius = vars.height > width ? width/2 : vars.height/2,
      node_size = d3.scale.linear().domain([1,2]).range([8,4]),
      ring_width = vars.small ? tree_radius/2.25 : tree_radius/3,
      total_children,
      hover = null;
      
  // container for the visualization
  var viz_enter = vars.parent_enter.append("g").attr("class", "viz")
    .attr("transform", "translate(" + width / 2 + "," + vars.height / 2 + ")");
    
  viz_enter.append("g").attr("class","links")
  viz_enter.append("g").attr("class","nodes")
    
  d3.select("g.viz").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(" + width / 2 + "," + vars.height / 2 + ")");
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------

  var tree = d3.layout.tree()
      .size([360, tree_radius - ring_width])
      .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

  var diagonal = d3.svg.diagonal.radial()
      .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
      
  var line = d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .interpolate("basis");
  
  var root = get_root();
  
  var tree_nodes = root.nodes,
      tree_links = root.links;
      
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // LINKS
  //-------------------------------------------------------------------
  
  var link = d3.select(".links").selectAll(".link")
    .data([]);
    
  link.exit().remove();
  
  var link = d3.select(".links").selectAll(".link")
    .data(tree_links)
      
  link.enter().append("path")
    .attr("fill", "none")
    .attr("class", "link")
    .attr("opacity",0)
    .call(line_styles);
      
  link.transition().duration(vizwhiz.timing)
    .attr("opacity",1)
    .attr("d", function(d) {
      if (d.source[vars.id_var] == vars.highlight) {
        var x = d.target.ring_y * Math.cos((d.target.ring_x-90)*(Math.PI/180)),
            y = d.target.ring_y * Math.sin((d.target.ring_x-90)*(Math.PI/180))
        return line([{"x":0,"y":0},{"x":x,"y":y}]);
      } else {
        var x1 = d.source.ring_x,
            y1 = d.source.ring_y,
            x2 = d.target.ring_x,
            y2 = d.target.ring_y
        return diagonal({"source":{"x":x1,"y":y1},"target":{"x":x2,"y":y2}});
      }
    })
    .call(line_styles);
      
  link.exit().transition().duration(vizwhiz.timing)
    .attr("opacity",0)
    .remove();

  //===================================================================

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // NODES
  //-------------------------------------------------------------------

  var node = d3.select(".nodes").selectAll(".node")
    .data([]);
    
  node.exit().remove();

  var node = d3.select(".nodes").selectAll(".node")
    .data(tree_nodes)
      
  var node_enter = node.enter().append("g")
      .attr("class", "node")
      .attr("opacity",0)
      .attr("transform", function(d) {
        if (d.depth == 0) return "none"
        else return "rotate(" + (d.ring_x - 90) + ")translate(" + 0 + ")"; 
      })
      
  node_enter.append("circle")
    .attr("id",function(d) { return "node_"+d[vars.id_var]; })
    .attr("r", 0)
    .call(circle_styles)
          
  if (!vars.small) {
    node_enter.append("text")
      .attr("font-weight","bold")
      .attr("font-size", "10px")
      .attr("font-family","Helvetica")
      .call(text_styles);
  }
      
  node
    .on(vizwhiz.evt.over,function(d){
      if (d.depth != 0) {
        d3.select(this).style("cursor","pointer")
        d3.select(this).style("cursor","-moz-zoom-in")
        d3.select(this).style("cursor","-webkit-zoom-in")
        hover = d;
        if (!vars.small) {
          link.call(line_styles);
          d3.selectAll(".node circle").call(circle_styles);
          d3.selectAll(".node text").call(text_styles);
        }
      }
    })
    .on(vizwhiz.evt.out,function(d){
      if (d.depth != 0) {
        hover = null;
        if (!vars.small) {
          link.call(line_styles);
          d3.selectAll(".node circle").call(circle_styles);
          d3.selectAll(".node text").call(text_styles);
        }
      }
    })
    .on(vizwhiz.evt.click,function(d){
      if (d.depth != 0) vars.parent.call(chart.highlight(d[vars.id_var]));
    })
      
  node.transition().duration(vizwhiz.timing)
      .attr("opacity",1)
      .attr("transform", function(d) {
        if (d.depth == 0) return "none"
        else return "rotate(" + (d.ring_x - 90) + ")translate(" + d.ring_y + ")"; 
      })
  
  node.select("circle").transition().duration(vizwhiz.timing)
    .attr("r", function(d){ 
      if (d.depth == 0) return ring_width/2;
      var s = node_size(d.depth); 
      if (d.depth == 1) var limit = (Math.PI*((tree_radius-(ring_width*2))*2))/total_children;
      if (d.depth == 2) var limit = (Math.PI*((tree_radius-ring_width)*2))/total_children;
      if (s > limit/2) s = limit/2;
      if (s < 2) s = 2;
      d.radius = s;
      return d.radius;
    })
    .call(circle_styles)
    
  node.select("text")
    .attr("text-anchor", function(d) { 
      if (d.depth == 0) return "middle"
      else return d.ring_x%360 < 180 ? "start" : "end"; 
    })
    .attr("transform", function(d) { 
      if (d.depth == 0) return "none"
      else {
        var offset = d.radius*2
        return d.ring_x%360 < 180 ? "translate("+offset+")" : "rotate(180)translate(-"+offset+")";
      }
    })
    .attr("transform", function(d) { 
      if (d.depth == 0) return "none"
      else {
        var offset = d.radius*2
        return d.ring_x%360 < 180 ? "translate("+offset+")" : "rotate(180)translate(-"+offset+")";
      }
    })
    .each(function(d) {
      if (d.depth == 0) var s = Math.sqrt((ring_width*ring_width)/2), w = s*1.5, h = s/1.5, resize = true;
      else {
        var w = ring_width-d.radius*2, resize = false
        if (d.depth == 1) var h = (Math.PI*((tree_radius-(ring_width*2))*2))*(d.size/360);
        if (d.depth == 2) var h = (Math.PI*((tree_radius-ring_width)*2))/total_children;
      }

      if (h < 15) h = 15;

      vizwhiz.utils.wordwrap({
        "text": d.name,
        "parent": this,
        "width": w,
        "height": h,
        "resize": resize,
        "font_min": 6
      })

      d3.select(this).attr("y",(-d3.select(this).node().getBBox().height/2)+"px")
      d3.select(this).selectAll("tspan").attr("x",0)
    })
    .call(text_styles);
      
  node.exit().transition().duration(vizwhiz.timing)
      .attr("opacity",0)
      .remove()
  
  //===================================================================
  
  hover = null;
  
  if (!vars.small) {

    vizwhiz.tooltip.remove();
    
    var tooltip_appends = "<div class='vizwhiz_network_title'>Primary Connections</div>"

    vars.connections[vars.highlight].forEach(function(n){
      
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
    
    var html = vars.click_function ? "<br>"+vars.click_function(vars.data[vars.highlight],tree_nodes) : ""
    
    var tooltip_data = get_tooltip_data(vars.highlight)

    vizwhiz.tooltip.remove()
    vizwhiz.tooltip.create({
      "title": find_variable(vars.highlight,vars.text_var),
      "color": find_variable(vars.highlight,vars.color_var),
      "icon": find_variable(vars.highlight,"icon"),
      "id": vars.highlight,
      "html": tooltip_appends+html,
      "footer": vars.data_source,
      "data": tooltip_data,
      "x": vars.width-tooltip_width-5,
      "y": vars.margin.top+5,
      "fixed": true,
      "width": tooltip_width,
      "mouseevents": true,
      "parent": vars.parent,
      "background": vars.background
    })
    
  }
  
  function fill_color(d) {
    if(find_variable(d[vars.id_var],vars.active_var)){
      return d[vars.color_var];
    } 
    else {
      var lighter_col = d3.hsl(d[vars.color_var]);
      lighter_col.l = 0.95;
      return lighter_col.toString()
    }
  }
  
  function stroke_color(d) {
    if(find_variable(d[vars.id_var],vars.active_var)){
      return "#333";
    } else {
      return vizwhiz.utils.darker_color(d[vars.color_var])
    }
  }
  
  function line_styles(l) {
    l
      .attr("stroke", function(d) {
        if (hover) {
          if (d.source == hover || d.target == hover || 
          (hover.depth == 2 && (hover.parents.indexOf(d.target) >= 0))) {
            this.parentNode.appendChild(this);
            return vars.highlight_color;
          } else if (hover.depth == 1 && hover.children_total.indexOf(d.target) >= 0) {
            return vars.secondary_color;
          } else return "#ddd";
        } else return "#ddd";
      })
      .attr("stroke-width", "1.5")
      .attr("opacity",function(d) {
        if (hover && d3.select(this).attr("stroke") == "#ddd") {
           return 0.25
        } return 0.75;
      })
  }
  
  function circle_styles(c) {
    c
      .attr("fill", function(d){
        var color = fill_color(d)
        
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "lightgrey"
      
      })
      .attr("stroke", function(d){
        var color = stroke_color(d)
        
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "darkgrey"
      
      })
      .attr("stroke-width", "1")
  }
  
  function text_styles(t) {
    t
      .attr("fill",function(d){
        if (d.depth == 0) {
          var color = vizwhiz.utils.text_color(d3.select("circle#node_"+d[vars.id_var]).attr("fill"));
        } 
        else {
          var color = vizwhiz.utils.darker_color(d[vars.color_var]);
        }

        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "lightgrey"
      })
  }
  
  function get_root(){
    
    var links = [], nodes = [], root = {}
      
    root.ring_x = 0;
    root.ring_y = 0;
    root.depth = 0;
    root[vars.text_var] = find_variable(vars.highlight,vars.text_var)
    root[vars.id_var] = vars.highlight
    root.children = []
    root[vars.color_var] = find_variable(vars.highlight,vars.color_var)
    root[vars.active_var] = find_variable(vars.highlight,vars.active_var)
  
    nodes.push(root);
    
    // populate first level
    var prim_links = vars.connections[vars.highlight]
    if (prim_links) {
      prim_links.forEach(function(child){
  
        // give first level child the properties
        child.ring_x = 0;
        child.ring_y = ring_width;
        child.depth = 1;
        child[vars.text_var] = find_variable(child[vars.id_var],vars.text_var)
        child.children = []
        child.children_total = []
        child[vars.color_var] = find_variable(child[vars.id_var],vars.color_var)
        child[vars.active_var] = find_variable(child[vars.id_var],vars.active_var)
  
        // push first level child into nodes
        nodes.push(child);
        root.children.push(child);
  
        // create link from center to first level child
        links.push({"source": nodes[nodes.indexOf(root)], "target": nodes[nodes.indexOf(child)]})
      
        vars.connections[child[vars.id_var]].forEach(function(grandchild){ 
          child.children_total.push(grandchild);
        })
      
      })
    
      // populate second level
      var len = nodes.length,
          len2 = nodes.length
        
      while(len--) {

        var sec_links = vars.connections[nodes[len][vars.id_var]]
        if (sec_links) {
          sec_links.forEach(function(grandchild){
    
            // if grandchild isn't already a first level child or the center node
            if (prim_links.indexOf(grandchild) < 0 && grandchild[vars.id_var] != vars.highlight) {
          
              grandchild.ring_x = 0;
              grandchild.ring_y = ring_width*2;
              grandchild.depth = 2;
              grandchild[vars.text_var] = find_variable(grandchild[vars.id_var],vars.text_var)
              grandchild[vars.color_var] = find_variable(grandchild[vars.id_var],vars.color_var)
              grandchild[vars.active_var] = find_variable(grandchild[vars.id_var],vars.active_var)
              grandchild.parents = []

              var s = 10000, node_id = 0;
              prim_links.forEach(function(node){
                var temp_links = vars.connections[node[vars.id_var]]
                temp_links.forEach(function(node2){
                  if (node2[vars.id_var] == grandchild[vars.id_var]) {
                    grandchild.parents.push(node);
                    if (temp_links.length < s) {
                      s = temp_links.length
                      node_id = node[vars.id_var]
                    }
                  }
                })
              })
              var len3 = len2;
              while(len3--) {
                if (nodes[len3][vars.id_var] == node_id && nodes[len3].children.indexOf(grandchild) < 0) {
                  nodes[len3].children.push(grandchild);
                }
              }
      
              // if grandchild hasn't been added to the nodes list, add it
              if (nodes.indexOf(grandchild) < 0) {
                nodes.push(grandchild);
              }
      
              // create link from child to grandchild
              links.push({"source": nodes[len], "target": nodes[nodes.indexOf(grandchild)]})
      
            }
    
          })
        }
  
      }
    }
    
    var first_offset = 0
    
    total_children = d3.sum(nodes,function(dd){
        if (dd.depth == 1) {
          if (dd.children.length > 0) return dd.children.length;
          else return 1;
        } else return 0;
      })
    

    // sort first level vars.connections by color
    nodes[0].children.sort(function(a, b){
      var a_color = d3.rgb(a[vars.color_var]).hsl().h
      var b_color = d3.rgb(b[vars.color_var]).hsl().h
      if (d3.rgb(a[vars.color_var]).hsl().s == 0) a_color = 361
      if (d3.rgb(b[vars.color_var]).hsl().s == 0) b_color = 361
      if (a_color < b_color) return -1;
      if (a_color > b_color) return 1;
      return 0;
    })
    
    nodes[0].children.forEach(function(d){
      if (d.children.length > 1) var num = d.children.length;
      else var num = 1;
      d.ring_x = ((first_offset+(num/2))/total_children)*360
      d.size = (num/total_children)*360
      if (d.size > 180) d.size = 180
      
      var positions = (num)/2
      
      // sort children by color
      d.children.sort(function(a, b){
        var a_color = d3.rgb(a[vars.color_var]).hsl().h
        var b_color = d3.rgb(b[vars.color_var]).hsl().h
        if (d3.rgb(a[vars.color_var]).hsl().s == 0) a_color = 361
        if (d3.rgb(b[vars.color_var]).hsl().s == 0) b_color = 361
        if (a_color < b_color) return -1;
        if (a_color > b_color) return 1;
        return 0;
      })
      
      d.children.forEach(function(c,i){
        if (d.children.length <= 1) c.ring_x = d.ring_x
        else c.ring_x = d.ring_x+(((i+0.5)-positions)/positions)*(d.size/2)
      })
      first_offset += num
    })


    return {"nodes": nodes, "links": links};
  }
};
