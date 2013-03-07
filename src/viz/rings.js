
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
      tooltip_info = [];
  
  //===================================================================

  function chart(selection) {
    selection.each(function(data) {
      
      var tree_radius = height > width ? width/2 : height/2,
          node_size = d3.scale.linear().domain([1,2]).range([8,4]),
          ring_width = tree_radius/3;
      
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
      
      var root = get_root(data);
      
      var tree_nodes = root.nodes,
          tree_links = root.links;
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // LINKS
      //-------------------------------------------------------------------
      
      var link = d3.select(".viz").selectAll(".link")
          .data(tree_links)
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "#ddd")
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
          .data(tree_nodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) {
            if (d.depth == 0) return "none"
            else return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; 
          })

      node.append("circle")
        .attr("id",function(d) { return "node_"+d[id_var]; })
        .attr("fill", function(d){
          if(d.active){
            var color = d.color;
          } else {
            var lighter_col = d3.hsl(d.color);
            lighter_col.l = 0.95;
            var color = lighter_col.toString()
            // var color = "lightgray"
          }
          return color
          
        })
        .attr("stroke", function(d){
          if(d.active){
            var color = d3.rgb(d.color).darker().darker().toString();
          } else {
            var color = d3.rgb(d.color).darker().toString()
            // var color = "lightgray"
          }
          return color
          
        })
        .attr("stroke-width", "1.5")
        .attr("r", function(d){ 
          if (d.depth == 0) return ring_width/2;
          else return node_size(d.depth); 
        });

      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // TEXT
      //-------------------------------------------------------------------
      
      node.append("text")
        .attr("font-weight","bold")
        .attr("font-size", function(d) { 
          if (d.depth == 0) return "14px"
          else return "10px"; 
        })
        .attr("font-family","Helvetica")
        .attr("fill",function(d){
          if (d.depth == 0) {
            return vizwhiz.utils.text_color(d3.select("circle#node_"+d[id_var]).attr("fill"));
          } else return "#4c4c4c";
        })
        .attr("text-anchor", function(d) { 
          if (d.depth == 0) return "middle"
          else return d.x%360 < 180 ? "start" : "end"; 
        })
        .attr("transform", function(d) { 
          if (d.depth == 0) return "none"
          else {
            var offset = node_size(d.depth)*2
            return d.x%360 < 180 ? "translate("+offset+")" : "rotate(180)translate(-"+offset+")";
          }
        })
        .each(function(d) {
          if (d.depth == 0) var w = ring_width*0.3, h = ring_width*0.3;
          else var w = ring_width-node_size(d.depth)*2, h = 30;
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
      
      function get_root(attr_lookup){
        var prod = attr_lookup[center]
    
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
          child[text_var] = attr_lookup[child[id_var]][text_var]
          child.children = []
          child.color = attr_lookup[child[id_var]].color
          child.text_color = attr_lookup[child[id_var]].text_color
          child.active = attr_lookup[child[id_var]].active
      
          // push first level child into nodes
          nodes.push(child);
          root.children.push(child);
      
          // create link from center to first level child
          links.push({"source": nodes[nodes.indexOf(root)], "target": nodes[nodes.indexOf(child)]})
      
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
              grandchild[text_var] = attr_lookup[grandchild[id_var]][text_var]
              grandchild.color = attr_lookup[grandchild[id_var]].color
              grandchild.text_color = attr_lookup[grandchild[id_var]].text_color
              grandchild.active = attr_lookup[grandchild[id_var]].active
          
              var s = 10000, node_id = 0;
              connections[prod[id_var]].forEach(function(node){
                connections[node[id_var]].forEach(function(node2){
                  if (node2[id_var] == grandchild[id_var] && connections[node[id_var]].length < s) {
                    s = connections[node[id_var]].length
                    node_id = node[id_var]
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
    
        var first_offset = 0,
            denom = d3.sum(nodes,function(dd){
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
          if (d.children.length > 0) var num = d.children.length;
          else var num = 1;
        
          d.x = ((first_offset+(num/2))/denom)*360
        
          var positions = (num)/2,
              size = (num/denom)*360
          
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
            if (d.children.length == 1) c.x = d.x
            else c.x = d.x+((i-positions)/positions)*(size/2)
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