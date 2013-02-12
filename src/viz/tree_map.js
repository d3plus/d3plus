
vizwhiz.viz.tree_map = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 380,
    height = 30,
    dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

  //===================================================================


  function chart(selection) {
    selection.each(function(d, i) {
      
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height)
      
      // Ok, to get started, lets run our heirarchically nested
      // data object through the d3 treemap function to get a
      // flat array of data with X, Y, width and height vars
      var tmap_data = d3.layout.treemap()
        .round(false)
        .size([width, height])
        .children(function(d) { return d.children; })
        .sort(function(a, b) { return a.value - b.value; })
        .value(function(d) { return d.value; })
        .nodes(data)
        .filter(function(d) { return !d.children; })
      
      // If it's the first time the app is being built, add group for nodes
      svg_enter.append("clipPath")
        .attr("id","clipping")
        .append("rect")
          .attr("width",width)
          .attr("height",height)
          
      d3.select("#clipping rect").transition(750)
        .attr("width",width)
        .attr("height",height)
        
      svg_enter.append("g")
        .attr("class", "viz")
        // .attr("transform", function(d){ return "translate("+(stroke_width/2)+", "+height+")"; })
        .attr("clip-path","url(#clipping)")
      
      var cell = d3.select("g.viz").selectAll("g")
        .data(tmap_data)
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New cells enter, initialize them here
      //-------------------------------------------------------------------
      
      // cell aka container
      var cell_enter = cell.enter().append("g")
        .attr("transform", function(d) {
          "translate(" + d.x + "," + d.y + ")"; 
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
          return d.color ? d.color : vizwhiz.utils.rand_color();
        })
      
      // text (name)
      cell_enter.append("text")
        .attr("text-anchor","start")
        .style("font-weight","bold")
        .attr("font-family","Helvetica")
        .attr('class','name')
        .attr('x','0.2em')
        .attr('y','0em')
        .attr('dy','1em')
        .attr("fill", "white")
      
      // text (share)
      cell_enter.append("text")
        .attr('class','share')
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-family","Helvetica")
        .attr("fill", "white")
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
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for cells that are already in existance
      //-------------------------------------------------------------------
      
      cell
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      
      cell.selectAll("rect")
        .attr("width", function(d){ return d.dx })
        .attr("height", function(d){ return d.dy })
        .attr("fill", function(d){
          return d.color ? d.color : vizwhiz.utils.rand_color();
        })
      
      cell.selectAll("text.name")
        .each(function(d){
          wordWrap(d.name,this,d.dx,d.dy,true)
        })

      //===================================================================
      
    });


    return chart;
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

  chart.margin = function(x) {
    if (!arguments.length) return margin;
    margin.top    = typeof x.top    != 'undefined' ? x.top    : margin.top;
    margin.right  = typeof x.right  != 'undefined' ? x.right  : margin.right;
    margin.bottom = typeof x.bottom != 'undefined' ? x.bottom : margin.bottom;
    margin.left   = typeof x.left   != 'undefined' ? x.left   : margin.left;
    return chart;
  };

  //===================================================================


  return chart;
};