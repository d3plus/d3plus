
vizwhiz.viz.rings = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = window.innerWidth,
    height = window.innerHeight,
    size = {
      "width": width-margin.left-margin.right,
      "height": height-margin.top-margin.bottom,
      "x": margin.left,
      "y": margin.top
    },
    value_var = "value",
    id_var = "id",
    text_var = "name",
    center = null,
    nodes = [],
    links = [],
    connections = {},
    tooltip_info = [];
  
  //===================================================================

  function chart(selection) {
    selection.each(function(data) {
      
      var tree_radius = height > width ? width/2 : height/2,
          ring_width = tree_radius/3,
          node_size = d3.scale.linear().domain([1,3]).range([8,4]);
      
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height)
      
      // container for the visualization
      var viz_enter = svg_enter.append("g").attr("class", "viz")
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
      
      var root = get_root(data)
      
      var tree_nodes = tree.nodes(root),
          tree_links = tree.links(tree_nodes);
          
      var unique_nodes = tree_nodes.filter(function(elem, pos, self) {
          return self.indexOf(elem) == pos;
      })
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // LINKS
      //-------------------------------------------------------------------
      
      var link = d3.select(".viz").selectAll(".link")
          .data(tree_links)
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "#ccc")
          .attr("stroke-width", "1.5")
          .attr("class", "link")
          .attr("d", function(d) {
            if (d.source[id_var] == center) {
              var x = d.target.y * Math.cos((d.target.x-90)*(Math.PI/180)),
                  y = d.target.y * Math.sin((d.target.x-90)*(Math.PI/180))
              return line([{"x":0,"y":0},{"x":x,"y":y}]);
            } else return diagonal(d);
          });

      //===================================================================

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // NODES
      //-------------------------------------------------------------------

      var node = d3.select(".viz").selectAll(".node")
          .data(unique_nodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { 
            if (d[id_var] == center) return "none"
            else return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; 
          })

      // console.log(ps_data["data_nested"])
      node.append("circle")
        .attr("fill", function(d){
          var item = data[d[id_var]]
          
          if(item.active){
            var color = item.color;
          } else {
            var lighter_col = d3.hsl(item.color);
            lighter_col.l = 0.95;
            var color = lighter_col.toString()
            // var color = "lightgray"
          }
          return color
          
        })
        .attr("stroke", function(d){
          var item = data[d.id]
        
          if(item.active){
            var color = d3.rgb(item.color).darker().darker().toString();
          } else {
            var color = d3.rgb(item.color).darker().toString()
            // var color = "lightgray"
          }
          return color
          
        })
        .attr("stroke-width", "1.5")
        .attr("r", function(d){
          if (d[id_var] == center) return node_size(1);
          var present = false;
          connections[center].primary.nodes.forEach(function(n){
            if (n[id_var] == d[id_var]) present = true;
          })
          if (present) return node_size(2);
          else return node_size(3);
        });

      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // TEXT
      //-------------------------------------------------------------------
      
      node.append("text")
        .attr("font-weight","bold")
        .attr("font-size", function(d) { 
          if (d[id_var] == center) return "14px"
          else return "10px"; 
        })
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
        .attr("text-anchor", function(d) { 
          if (d[id_var] == center) return "middle"
          else return d.x%360 < 180 ? "start" : "end"; 
        })
        .attr("transform", function(d) { 
          if (d[id_var] == center) return "translate(0,20)"
          else return d.x%360 < 180 ? "translate(8)" : "rotate(180)translate(-8)"; 
        })
        .each(function(d) {
          if (d[id_var] == center) var w = ring_width*1.75, h = ring_width*0.75;
          else var w = ring_width, h = 30;
          vizwhiz.utils.wordwrap({
            "text": d.name,
            "parent": this,
            "width": w,
            "height": h
          })
          
          d3.select(this).attr("y",(-d3.select(this).node().getBBox().height/2)+"px")
          d3.select(this).selectAll("tspan").attr("x",0)
        });
      
      //===================================================================
      
    });

    return chart;
  }
  
  function get_root(attr_lookup){
    var prod = attr_lookup[center]
    
    var used = [prod],
      root = {
        "name": prod[text_var],
        "id": prod[id_var],
        "children":[]
      }
    
    // populate first level
    connections[prod[id_var]].primary.nodes.forEach(function(node){
      // add first level connections as children of root
      root.children.push(attr_lookup[node.id])
      // make sure to add these used up nodes to used list
      used.push(attr_lookup[node.id])
    })
    
    // populate second level
    root.children.forEach(function(node){
      // look up THIS item's primary nodes
      connections[node.id].primary.nodes.forEach(function(potential_node){
        potential_node = attr_lookup[potential_node.id]

        // first check if the potential node has already been used
        if(used.indexOf(potential_node) < 0){
          if(node.children) {
            if (node.children.length < 1) node.children.push(potential_node);
            // node.children.push(potential_node);
          }
          else node.children = [potential_node]
          // used.push(potential_node)
        }
        
      })
    })
    
    return root;
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
    }
    return chart;
  };

  chart.margin = function(x) {
    if (!arguments.length) return margin;
    margin.top    = typeof x.top    != 'undefined' ? x.top    : margin.top;
    margin.right  = typeof x.right  != 'undefined' ? x.right  : margin.right;
    margin.bottom = typeof x.bottom != 'undefined' ? x.bottom : margin.bottom;
    margin.left   = typeof x.left   != 'undefined' ? x.left   : margin.left;
    size.width    = width-margin.left-margin.right;
    size.height   = height-margin.top-margin.bottom;
    size.x        = margin.left;
    size.y        = margin.top;
    return chart;
  };

  //===================================================================

  return chart;
};