
vizwhiz.viz.circles = function() {

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
    nodes = [],
    links = [],
    connections = {},
    filter = [],
    solo = [],
    tooltip_info = [];
  
  //===================================================================

  function chart(selection) {
    selection.each(function(data) {
      
      var diameter = height > width ? width : height;
      
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
          .size([360, diameter / 2 - 120]) // 120 = outer padding
          .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

      var diagonal = d3.svg.diagonal.radial()
          .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
      
      var root = get_root2(data)
      // return
      var tree_nodes = tree.nodes(root),
        tree_links = tree.links(tree_nodes);
      // console.log(tree_links)
      
      //===================================================================
      
      var link = d3.select(".viz").selectAll(".link")
          .data(tree_links)
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "#ccc")
          .attr("stroke-width", "1.5")
          .attr("class", "link")
          .attr("d", diagonal);

      var node = d3.select(".viz").selectAll(".node")
          .data(tree_nodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

      // console.log(ps_data["data_nested"])
      node.append("circle")
        .attr("fill", function(d){
          var item = data[d.id]
          
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
        .attr("r", 4.5);
      
      node.append("text")
        .style("font", "10px sans-serif")
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
        .text(function(d) { return d.name; });
    });

    return chart;
  }
  
  function get_root2(attr_lookup){
    var prod = attr_lookup["168480"]
    // console.log(prod)
    
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
          if(node.children) node.children.push(potential_node);
          else node.children = [potential_node]
        }
        
      })
    })
    
    return root;
  }
  
  // function get_root(){
  //   // var prod = "020910"; // ginger
  //   // var prod = "157202"; // ferroalloys
  //   // var prod = "178703"; // cars
  //   var prod = "168480"
  //   
  //   var prod_id,
  //     used = [prod],
  //     prod_lookup = {},
  //     node_lookup = {},
  //     root = {
  //       "name":"attr[prod].name",
  //       "id": prod,
  //       "children":[]
  //     }
  //   
  //   links.nodes.forEach(function(l, i){
  //     if(l.id == prod){
  //       console.log(l)
  //     }
  //     node_lookup[i] = l.id;
  //     prod_lookup[l.id] = i;
  //   })
  //   
  //   edges = {}
  //   links.edges.forEach(function(e, i){
  //     var s = node_lookup[e.source]
  //     var t = node_lookup[e.target]
  //     if(!edges[s]){
  //       edges[s] = []
  //     }
  //     edges[s].push({"id": s, "target":t, "strength":e.strength})
  //     if(!edges[t]){
  //       edges[t] = []
  //     }
  //     edges[t].push({"id": t, "target":s, "strength":e.strength})
  //   })
  //   
  //   return root
  // }

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

  chart.filter = function(x) {
    if (!arguments.length) return filter;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      filter = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(filter.indexOf(x) > -1){
        filter.splice(filter.indexOf(x), 1)
      }
      // if element is in the solo array remove it and add to this one
      else if(solo.indexOf(x) > -1){
        solo.splice(solo.indexOf(x), 1)
        filter.push(x)
      }
      // element not in current filter so add it
      else {
        filter.push(x)
      }
    }
    return chart;
  };
  
  chart.solo = function(x) {
    if (!arguments.length) return solo;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      solo = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(solo.indexOf(x) > -1){
        solo.splice(solo.indexOf(x), 1)
      }
      // if element is in the filter array remove it and add to this one
      else if(filter.indexOf(x) > -1){
        filter.splice(filter.indexOf(x), 1)
        solo.push(x)
      }
      // element not in current filter so add it
      else {
        solo.push(x)
      }
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