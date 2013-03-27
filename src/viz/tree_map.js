
vizwhiz.viz.tree_map = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = window.innerWidth,
      height = window.innerHeight,
      id_var = "id",
      value_var = "value",
      text_var = "name",
      filter = [],
      solo = [],
      tooltip_info = [],
      dispatch = d3.dispatch('elementMouseover', 'elementMouseout'),
      name_array = null;
  
  //===================================================================

  function chart(selection) {
    selection.each(function(data) {
      
      // var cloned_data = JSON.parse(JSON.stringify(data));
      var nested_data = {"name": "root", "children": []};
      
      nested_data.children = data.children.filter(function(d){
        if (filter.indexOf(d.name) >= 0) return false;
        if (!solo.length) return true;
        if (solo.indexOf(d.name) >= 0) return true;
        return false;
      })
      
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([nested_data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height)
        
      svg.transition().duration(vizwhiz.timing)
        .attr('width',width)
        .attr('height',height);
      
      // Ok, to get started, lets run our heirarchically nested
      // data object through the d3 treemap function to get a
      // flat array of data with X, Y, width and height vars
      var tmap_data = d3.layout.treemap()
        .round(false)
        .size([width, height])
        .children(function(d) { return d.children; })
        .sort(function(a, b) { return a.value - b.value; })
        .value(function(d) { return d[value_var]; })
        .nodes(nested_data)
        .filter(function(d) {
          return !d.children;
        })
      
      // We'll figure out how many levels of nesting there are to determine
      // the options for which depths to show
      // var max_depth = d3.max(tmap_data, function(d){ return d.depth; });
      
      // filter the tree map nodes to only the depth requested
      // tmap_data = tmap_data.filter(function(d) { return d.depth === (depth || max_depth); });
      
      // If it's the first time the app is being built, add group for nodes
      svg_enter.append("clipPath")
        .attr("id","clipping")
        .append("rect")
          .attr("width",width)
          .attr("height",height)
          
      d3.select("#clipping rect").transition(vizwhiz.timing)
        .attr("width",width)
        .attr("height",height)
        
      svg_enter.append("g")
        .attr("class", "viz")
        // .attr("transform", function(d){ return "translate("+(stroke_width/2)+", "+height+")"; })
        .attr("clip-path","url(#clipping)")
      
      var cell = d3.select("g.viz").selectAll("g")
        .data(tmap_data, function(d){ return d[id_var]; })
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for cells that are already in existance
      //-------------------------------------------------------------------

      // need to perform updates in "each" clause so that new data is 
      // propogated down to rects and text elements
      cell.transition().duration(vizwhiz.timing)
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .attr("opacity", 1)
        .each(function(g_data) {

          // update rectangles
          d3.select(this).selectAll("rect").transition().duration(vizwhiz.timing)
            .attr('width', function() {
              return g_data.dx+'px'
            })
            .attr('height', function() { 
              return g_data.dy+'px'
            })

          // text (name)
          d3.select(this).selectAll("text.name")
            .attr("opacity", function(){
              return 0;
            })
            .transition().duration(vizwhiz.timing)
            .each("end", function(q, i){
              // need to recalculate word wrapping because dimensions have changed
              if(g_data[text_var]){
                if (name_array) {
                  var text = []
                  name_array.forEach(function(n){
                    text.push(g_data[n])
                  })
                } else {
                  var text = g_data[id_var] ? [g_data[text_var],g_data[id_var]] : g_data[text_var]
                }
                vizwhiz.utils.wordwrap({
                  "text": text,
                  "parent": this,
                  "width": g_data.dx,
                  "height": g_data.dy,
                  "resize": true
                })
              }
              d3.select(this).transition().duration(vizwhiz.timing/2).attr("opacity", 1)
            })

          // text (share)
          d3.select(this).selectAll("text.share").transition().duration(vizwhiz.timing)
            .text(function(){
              var root = g_data;
              while(root.parent){ root = root.parent; } // find top most parent ndoe
              return vizwhiz.utils.format_num(g_data.value/root.value, true, 2);
            })
            .attr('font-size',function(){
              var size = (g_data.dx)/7
              if(g_data.dx < g_data.dy) var size = g_data.dx/7
              else var size = g_data.dy/7
              return size
            })
            .attr('x', function(){
              return g_data.dx/2
            })
            .attr('y',function(){
              return g_data.dy-(parseInt(d3.select(this).attr('font-size'),10)*0.10)
            })

        })

      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New cells enter, initialize them here
      //-------------------------------------------------------------------
      
      // cell aka container
      var cell_enter = cell.enter().append("g")
        .attr("opacity", 1)
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")"; 
        })
      
      // rectangle
      cell_enter.append("rect")
        .attr("stroke","#ffffff")
        .attr('width', function(d) {
          return d.dx+'px'
        })
        .attr('height', function(d) { 
          return d.dy+'px'
        })
        .attr("fill", function(d){
          // in case this depth doesn't have a color but a child of
          // this element DOES... use that color
          while(!d.color && d.children){
            d = d.children[0]
          }
          // if a color cannot be found (at this depth of deeper) use random
          return d.color ? d.color : vizwhiz.utils.rand_color();
        })
        .on(vizwhiz.evt.move, mouseover)
        .on(vizwhiz.evt.out, function(d){
          vizwhiz.tooltip.remove();
        })
        
      // text (name)
      cell_enter.append("text")
        .attr("opacity", 1)
        .attr("text-anchor","start")
        .style("font-weight","bold")
        .attr("font-family","Helvetica")
        .attr('class','name')
        .attr('x','0.2em')
        .attr('y','0em')
        .attr('dy','1em')
        .attr("fill", function(d){ return vizwhiz.utils.text_color(d.color); })
        .on(vizwhiz.evt.move, mouseover)
        .on(vizwhiz.evt.out, function(d){
          vizwhiz.tooltip.remove();
        })
        .each(function(d){
          if (name_array) {
            var text = []
            name_array.forEach(function(n){
              text.push(d[n])
            })
          } else {
            var text = d[id_var] ? [d[text_var],d[id_var]] : d[text_var]
          }
          vizwhiz.utils.wordwrap({
            "text": text,
            "parent": this,
            "width": d.dx,
            "height": d.dy,
            "resize": true
          })
        })
      
      // text (share)
      cell_enter.append("text")
        .attr('class','share')
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-family","Helvetica")
        .attr("fill", function(d){ return vizwhiz.utils.text_color(d.color); })
        .text(function(d) {
          var root = d;
          while(root.parent){ root = root.parent; } // find top most parent ndoe
          return vizwhiz.utils.format_num(d.value/root.value, true, 2);
        })
        .attr('font-size',function(d){
          var size = (d.dx)/7
          if(d.dx < d.dy) var size = d.dx/7
          else var size = d.dy/7
          return size
        })
        .attr('x', function(d){
          return d.dx/2
        })
        .attr('y',function(d){
          return d.dy-(parseInt(d3.select(this).attr('font-size'),10)*0.10)
        })
        .on(vizwhiz.evt.move, mouseover)
        .on(vizwhiz.evt.out, function(d){
          vizwhiz.tooltip.remove();
        })
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Exis, get rid of old cells
      //-------------------------------------------------------------------
      
      cell.exit().transition().duration(vizwhiz.timing)
        .attr("opacity", 0)
        .remove()

      //===================================================================
      
    });

    return chart;
  }
  
  function mouseover(d){
    // tooltip
    var svg = d3.select("svg");
    var tooltip_data = {}
    tooltip_info.forEach(function(t){
      if (d[t]) tooltip_data[t] = d[t]
    })
    vizwhiz.tooltip.create({
      "parent": svg,
      "id": d[id_var],
      "data": tooltip_data,
      "title": d[text_var],
      "x": d3.mouse(svg.node())[0],
      "y": d3.mouse(svg.node())[1],
      "offset": 10,
      "arrow": true
    })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------

  chart.dispatch = dispatch;

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
  
  chart.id_var = function(x) {
    if (!arguments.length) return id_var;
    id_var = x;
    return chart;
  };
  
  chart.value_var = function(x) {
    if (!arguments.length) return value_var;
    value_var = x;
    return chart;
  };
  
  chart.text_var = function(x) {
    if (!arguments.length) return text_var;
    text_var = x;
    return chart;
  };
  
  chart.name_array = function(x) {
    if (!arguments.length) return name_array;
    name_array = x;
    return chart;
  };
  
  chart.tooltip_info = function(x) {
    if (!arguments.length) return tooltip_info;
    tooltip_info = x;
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

  //===================================================================


  return chart;
};
