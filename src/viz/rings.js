
vizwhiz.viz.rings = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = window.innerWidth,
      height = window.innerHeight,
      value_var = "value",
      id_var = "id",
      text_var = "name",
      center = null,
      nodes = [],
      links = [],
      connections = {},
      tooltip_info = [],
      highlight = null;
  
  //===================================================================

  function chart(selection) {
    selection.each(function(data) {
      
      var tree_radius = height > width ? width/2 : height/2,
          node_size = d3.scale.linear().domain([1,2]).range([8,4]),
          ring_width = tree_radius/3,
          total_children,
          parent = this;
      
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height);
        
      svg.transition().duration(vizwhiz.timing)
        .attr('width',width)
        .attr('height',height);
      
      // container for the visualization
      var viz_enter = svg_enter.append("g").attr("class", "viz")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        
      viz_enter.append("g").attr("class","links")
      viz_enter.append("g").attr("class","nodes")
        
      d3.select("g.viz").transition().duration(vizwhiz.timing)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
      
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
          if (d.source[id_var] == center) {
            var x = d.target.y * Math.cos((d.target.x-90)*(Math.PI/180)),
                y = d.target.y * Math.sin((d.target.x-90)*(Math.PI/180))
            return line([{"x":0,"y":0},{"x":x,"y":y}]);
          } else return diagonal(d);
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
            else return "rotate(" + (d.x - 90) + ")translate(" + 0 + ")"; 
          })
          .on(vizwhiz.evt.over,function(d){
            if (d.depth != 0) {
              d3.select(this).style("cursor","pointer");
              highlight = d;
              update();
            }
          })
          .on(vizwhiz.evt.out,function(d){
            if (d.depth != 0) {
              highlight = null;
              update();
            }
          })
          .on(vizwhiz.evt.click,function(d){
            if (d.depth != 0) d3.select(parent).call(chart.center(d[id_var]));
          })
          .each(function(e){
            
            d3.select(this).append("circle")
              .attr("id",function(d) { return "node_"+d[id_var]; })
              .attr("r", 0)
              .call(circle_styles);
              
            d3.select(this).append("text")
              .attr("font-weight","bold")
              .attr("font-size", "10px")
              .attr("font-family","Helvetica")
              .call(text_styles);
          })
          
      node.transition().duration(vizwhiz.timing)
          .attr("opacity",1)
          .attr("transform", function(d) {
            if (d.depth == 0) return "none"
            else return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; 
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
                else return d.x%360 < 180 ? "start" : "end"; 
              })
              .attr("transform", function(d) { 
                if (d.depth == 0) return "none"
                else {
                  var offset = d.radius*2
                  return d.x%360 < 180 ? "translate("+offset+")" : "rotate(180)translate(-"+offset+")";
                }
              })
              .attr("transform", function(d) { 
                if (d.depth == 0) return "none"
                else {
                  var offset = d.radius*2
                  return d.x%360 < 180 ? "translate("+offset+")" : "rotate(180)translate(-"+offset+")";
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
      
      highlight = null;
      update();
      
      function update() {
        link.call(line_styles);
        d3.selectAll(".node circle").call(circle_styles);
        d3.selectAll(".node text").call(text_styles);
        
        if (highlight) {
          
          var tooltip_data = {}
          tooltip_info.forEach(function(t){
            if (data[highlight[id_var]][t]) tooltip_data[t] = data[highlight[id_var]][t]
          })
          
          if (highlight.x%360 < 180) var x_pos = 0;
          else var x_pos = width;

          vizwhiz.tooltip.remove();
          vizwhiz.tooltip.create({
            "parent": svg,
            "data": tooltip_data,
            "title": highlight[text_var],
            "x": x_pos,
            "y": 0,
            "arrow": false
          })
          
        } else {
          
          var tooltip_data = {}
          tooltip_info.forEach(function(t){
            if (data[center][t]) tooltip_data[t] = data[center][t]
          })

          vizwhiz.tooltip.remove();
          vizwhiz.tooltip.create({
            "parent": svg,
            "data": tooltip_data,
            "title": data[center][text_var],
            "x": width,
            "y": 0,
            "arrow": false
          })
          
        }
        
      }
      
      function line_styles(l) {
        l
          .attr("stroke", function(d) {
            if (highlight) {
              if (d.source == highlight || d.target == highlight || 
              (highlight.depth == 2 && (highlight.parents.indexOf(d.target) >= 0))) {
                this.parentNode.appendChild(this);
                return "#cc0000";
              } else if (highlight.depth == 1 && highlight.children_total.indexOf(d.target) >= 0) {
                return "#ffbbbb";
              } else return "#ddd";
            } else return "#ddd";
          })
          .attr("stroke-width", "1.5")
          .attr("opacity",function(d) {
            if (highlight && d3.select(this).attr("stroke") == "#ddd") {
               return 0.25
            } return 1;
          })
      }
      
      function circle_styles(c) {
        c
          .attr("fill", function(d){
            if(d.active){
              var color = d.color;
            } else {
              var lighter_col = d3.hsl(d.color);
              lighter_col.l = 0.95;
              var color = lighter_col.toString()
            }
            if (d.depth == 0) return color;
            else if (d.depth == 1 && (!highlight || d == highlight || d.children_total.indexOf(highlight) >= 0)) return color;
            else if (d.depth == 2 && (!highlight || d == highlight || d.parents.indexOf(highlight) >= 0)) return color;
            else return "lightgrey"
          
          })
          .attr("stroke", function(d){
            if(d.active){
              var color = d3.rgb(d.color).darker().darker().toString();
            } else {
              var color = d3.rgb(d.color).darker().toString()
            }
            if (d.depth == 0) return color;
            else if (d.depth == 1 && (!highlight || d == highlight || d.children_total.indexOf(highlight) >= 0)) return color;
            else if (d.depth == 2 && (!highlight || d == highlight || d.parents.indexOf(highlight) >= 0)) return color;
            else return "darkgrey"
          
          })
          .attr("stroke-width", "1.5")
      }
      
      function text_styles(t) {
        t
          .attr("fill",function(d){
            if (d.depth == 0) {
              var color = vizwhiz.utils.text_color(d3.select("circle#node_"+d[id_var]).attr("fill"));
            } else var color = "#4c4c4c";

            if (d.depth == 0) return color;
            else if (d.depth == 1 && (!highlight || d == highlight || d.children_total.indexOf(highlight) >= 0)) return color;
            else if (d.depth == 2 && (!highlight || d == highlight || d.parents.indexOf(highlight) >= 0)) return color;
            else return "lightgrey"
          })
      }
      
      function get_root(){
        var prod = data[center]
    
        var links = [], nodes = [],
          root = {
            "name": prod[text_var],
            "id": prod[id_var],
            "children":[],
            "x": 0,
            "y": 0,
            "depth": 0,
            "color": prod.color,
            "text_color": prod.text_color,
            "active": prod.active
          }
      
        nodes.push(root);
    
        // populate first level
        connections[prod[id_var]].forEach(function(child){
      
          // give first level child the properties
          child.x = 0;
          child.y = ring_width;
          child.depth = 1;
          child[text_var] = data[child[id_var]][text_var]
          child.children = []
          child.children_total = []
          child.color = data[child[id_var]].color
          child.text_color = data[child[id_var]].text_color
          child.active = data[child[id_var]].active
      
          // push first level child into nodes
          nodes.push(child);
          root.children.push(child);
      
          // create link from center to first level child
          links.push({"source": nodes[nodes.indexOf(root)], "target": nodes[nodes.indexOf(child)]})
          
          connections[child[id_var]].forEach(function(grandchild){ 
            child.children_total.push(grandchild);
          })
          
        })
    
        // populate second level
        var len = nodes.length,
            len2 = nodes.length
        while(len--) {

          connections[nodes[len][id_var]].forEach(function(grandchild){
        
            // if grandchild isn't already a first level child or the center node
            if (connections[prod[id_var]].indexOf(grandchild) < 0 && grandchild[id_var] != prod[id_var]) {
          
              grandchild.x = 0;
              grandchild.y = ring_width*2;
              grandchild.depth = 2;
              grandchild[text_var] = data[grandchild[id_var]][text_var]
              grandchild.color = data[grandchild[id_var]].color
              grandchild.text_color = data[grandchild[id_var]].text_color
              grandchild.active = data[grandchild[id_var]].active
              grandchild.parents = []
          
              var s = 10000, node_id = 0;
              connections[prod[id_var]].forEach(function(node){
                connections[node[id_var]].forEach(function(node2){
                  if (node2[id_var] == grandchild[id_var]) {
                    grandchild.parents.push(node);
                    if (connections[node[id_var]].length < s) {
                      s = connections[node[id_var]].length
                      node_id = node[id_var]
                    }
                  }
                })
              })
              var len3 = len2;
              while(len3--) {
                if (nodes[len3][id_var] == node_id && nodes[len3].children.indexOf(grandchild) < 0) {
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
        

        // sort first level connections by color
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
        
          d.x = ((first_offset+(num/2))/total_children)*360
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
            if (d.children.length <= 1) c.x = d.x
            else c.x = d.x+(((i+0.5)-positions)/positions)*(d.size/2)
          })
          first_offset += num
        })
    
    
        return {"nodes": nodes, "links": links};
      }
      
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
  
  chart.nodes = function(x) {
    if (!arguments.length) return nodes;
    nodes = x;
    return chart;
  };
  
  chart.center = function(x) {
    if (!arguments.length) return center;
    center = x;
    return chart;
  };

  chart.links = function(x) {
    if (!arguments.length) return links;
    links = x;
    links.forEach(function(d) {
      if (!connections[d.source[id_var]]) {
        connections[d.source[id_var]] = []
      }
      connections[d.source[id_var]].push(d.target)
      if (!connections[d.target[id_var]]) {
        connections[d.target[id_var]] = []
      }
      connections[d.target[id_var]].push(d.source)
    })
    return chart;
  };

  //===================================================================

  return chart;
};