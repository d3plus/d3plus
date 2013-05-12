
vizwhiz.rings = function(data,vars) {
      
  var tree_radius = vars.height > vars.width ? vars.width/2 : vars.height/2,
      node_size = d3.scale.linear().domain([1,2]).range([8,4]),
      ring_width = vars.small ? tree_radius/2.25 : tree_radius/3,
      total_children;
      
  // container for the visualization
  var viz_enter = vars.parent_enter.append("g").attr("class", "viz")
    .attr("transform", "translate(" + vars.width / 2 + "," + vars.height / 2 + ")");
    
  viz_enter.append("g").attr("class","links")
  viz_enter.append("g").attr("class","nodes")
    
  d3.select("g.viz").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(" + vars.width / 2 + "," + vars.height / 2 + ")");
  
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
      if (d.source[vars.id_var] == vars.center) {
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
      
  node.enter().append("g")
      .attr("class", "node")
      .attr("opacity",0)
      .attr("transform", function(d) {
        if (d.depth == 0) return "none"
        else return "rotate(" + (d.ring_x - 90) + ")translate(" + 0 + ")"; 
      })
      .each(function(e){
        
        d3.select(this).append("circle")
          .attr("id",function(d) { return "node_"+d[vars.id_var]; })
          .attr("r", 0)
          .call(circle_styles);
          
        if (!vars.small) {
          d3.select(this).append("text")
            .attr("font-weight","bold")
            .attr("font-size", "10px")
            .attr("font-family","Helvetica")
            .call(text_styles);
        }
      })
      
  node
    .on(vizwhiz.evt.over,function(d){
      if (d.depth != 0) {
        d3.select(this).style("cursor","pointer");
        vars.highlight = d;
        update();
      }
    })
    .on(vizwhiz.evt.out,function(d){
      if (d.depth != 0) {
        vars.highlight = null;
        update();
      }
    })
    .on(vizwhiz.evt.click,function(d){
      if (d.depth != 0) vars.parent.call(chart.center(d[vars.id_var]));
    })
      
  node.transition().duration(vizwhiz.timing)
      .attr("opacity",1)
      .attr("transform", function(d) {
        if (d.depth == 0) return "none"
        else return "rotate(" + (d.ring_x - 90) + ")translate(" + d.ring_y + ")"; 
      })
      .each(function(e){
        
        d3.select(this).select("circle")
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
          .call(circle_styles);
          
        d3.select(this).select("text")
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
      })
      
  node.exit().transition().duration(vizwhiz.timing)
      .attr("opacity",0)
      .remove()
  
  //===================================================================
  
  vars.highlight = null;
  update();
  
  function update() {
    if (!vars.small) {
      link.call(line_styles);
      d3.selectAll(".node circle").call(circle_styles);
      d3.selectAll(".node text").call(text_styles);
    
      if (vars.highlight) {
      
        var tooltip_data = {}
        vars.tooltip_info.forEach(function(t){
          if (data[vars.highlight[vars.id_var]][t]) tooltip_data[t] = data[vars.highlight[vars.id_var]][t]
        })
      
        if (vars.highlight.ring_x%360 < 180) var x_pos = 0;
        else var x_pos = vars.width;

        vizwhiz.tooltip.remove();
        vizwhiz.tooltip.create({
          "parent": vars.svg,
          "data": tooltip_data,
          "title": vars.highlight[vars.text_var],
          "x": x_pos,
          "y": 0,
          "arrow": false
        })
      
      } else {
      
        var tooltip_data = {}
        vars.tooltip_info.forEach(function(t){
          if (data[vars.center][t]) tooltip_data[t] = data[vars.center][t]
        })

        vizwhiz.tooltip.remove();
        vizwhiz.tooltip.create({
          "parent": vars.svg,
          "data": tooltip_data,
          "title": data[vars.center][vars.text_var],
          "x": vars.width,
          "y": 0,
          "arrow": false
        })
      
      }
    }
  }
  
  function line_styles(l) {
    l
      .attr("stroke", function(d) {
        if (vars.highlight) {
          if (d.source == vars.highlight || d.target == vars.highlight || 
          (vars.highlight.depth == 2 && (vars.highlight.parents.indexOf(d.target) >= 0))) {
            this.parentNode.appendChild(this);
            return "#cc0000";
          } else if (vars.highlight.depth == 1 && vars.highlight.children_total.indexOf(d.target) >= 0) {
            return "#ffbbbb";
          } else return "#ddd";
        } else return "#ddd";
      })
      .attr("stroke-width", "1.5")
      .attr("opacity",function(d) {
        if (vars.highlight && d3.select(this).attr("stroke") == "#ddd") {
           return 0.25
        } return 1;
      })
  }
  
  function circle_styles(c) {
    c
      .attr("fill", function(d){
        if(d[vars.active_var]){
          var color = d.color;
        } else {
          var lighter_col = d3.hsl(d.color);
          lighter_col.l = 0.95;
          var color = lighter_col.toString()
        }
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!vars.highlight || d == vars.highlight || d.children_total.indexOf(vars.highlight) >= 0)) return color;
        else if (d.depth == 2 && (!vars.highlight || d == vars.highlight || d.parents.indexOf(vars.highlight) >= 0)) return color;
        else return "lightgrey"
      
      })
      .attr("stroke", function(d){
        if(d[vars.active_var]){
          var color = d3.rgb(d.color).darker().darker().toString();
        } else {
          var color = d3.rgb(d.color).darker().toString()
        }
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!vars.highlight || d == vars.highlight || d.children_total.indexOf(vars.highlight) >= 0)) return color;
        else if (d.depth == 2 && (!vars.highlight || d == vars.highlight || d.parents.indexOf(vars.highlight) >= 0)) return color;
        else return "darkgrey"
      
      })
      .attr("stroke-width", "1.5")
  }
  
  function text_styles(t) {
    t
      .attr("fill",function(d){
        if (d.depth == 0) {
          var color = vizwhiz.utils.text_color(d3.select("circle#node_"+d[vars.id_var]).attr("fill"));
        } else var color = "#4c4c4c";

        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!vars.highlight || d == vars.highlight || d.children_total.indexOf(vars.highlight) >= 0)) return color;
        else if (d.depth == 2 && (!vars.highlight || d == vars.highlight || d.parents.indexOf(vars.highlight) >= 0)) return color;
        else return "lightgrey"
      })
  }
  
  function get_root(){
    var prod = data[vars.center]
    
    var links = [], nodes = [],
      root = {
        "name": prod[vars.text_var],
        "id": prod[vars.id_var],
        "children":[],
        "ring_x": 0,
        "ring_y": 0,
        "depth": 0,
        "color": prod.color,
        "active": prod[vars.active_var]
      }
  
    nodes.push(root);

    // populate first level
    vars.connections[prod[vars.id_var]].forEach(function(child){
  
      // give first level child the properties
      child.ring_x = 0;
      child.ring_y = ring_width;
      child.depth = 1;
      child[vars.text_var] = data[child[vars.id_var]][vars.text_var]
      child.children = []
      child.children_total = []
      child.color = data[child[vars.id_var]].color
      child[vars.active_var] = data[child[vars.id_var]][vars.active_var]
  
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

      vars.connections[nodes[len][vars.id_var]].forEach(function(grandchild){
    
        // if grandchild isn't already a first level child or the center node
        if (vars.connections[prod[vars.id_var]].indexOf(grandchild) < 0 && grandchild[vars.id_var] != prod[vars.id_var]) {
      
          grandchild.ring_x = 0;
          grandchild.ring_y = ring_width*2;
          grandchild.depth = 2;
          grandchild[vars.text_var] = data[grandchild[vars.id_var]][vars.text_var]
          grandchild.color = data[grandchild[vars.id_var]].color
          grandchild[vars.active_var] = data[grandchild[vars.id_var]][vars.active_var]
          grandchild.parents = []
      
          var s = 10000, node_id = 0;
          vars.connections[prod[vars.id_var]].forEach(function(node){
            vars.connections[node[vars.id_var]].forEach(function(node2){
              if (node2[vars.id_var] == grandchild[vars.id_var]) {
                grandchild.parents.push(node);
                if (vars.connections[node[vars.id_var]].length < s) {
                  s = vars.connections[node[vars.id_var]].length
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

    var first_offset = 0
    
    total_children = d3.sum(nodes,function(dd){
        if (dd.depth == 1) {
          if (dd.children.length > 0) return dd.children.length;
          else return 1;
        } else return 0;
      })
    

    // sort first level vars.connections by color
    nodes[0].children.sort(function(a, b){
      var a_color = d3.rgb(a.color).hsl().h
      var b_color = d3.rgb(b.color).hsl().h
      if (d3.rgb(a.color).hsl().s == 0) a_color = 361
      if (d3.rgb(b.color).hsl().s == 0) b_color = 361
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
        var a_color = d3.rgb(a.color).hsl().h
        var b_color = d3.rgb(b.color).hsl().h
        if (d3.rgb(a.color).hsl().s == 0) a_color = 361
        if (d3.rgb(b.color).hsl().s == 0) b_color = 361
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
