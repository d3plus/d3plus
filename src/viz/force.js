vizwhiz.viz.force = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = 300,
      height = 300,
      dragging = false,
      clicked = false,
      spotlight = true,
      highlight = null,
      highlight_color = "#cc0000"
      timing = 100,
      zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
      force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .friction(0)
        .linkStrength(0),
      nodes = force.nodes(),
      links = force.links(),
      linked = {};

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
      var scale = {},
          x_range = d3.extent(d3.values(nodes), function(d){return d.x}),
          y_range = d3.extent(d3.values(nodes), function(d){return d.y}),
          aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0]),
          padding = 20
        
      var offset_top = 0, offset_left = 0
      if (aspect > width/height) {
        var viz_height = width/aspect, viz_width = width
        offset_top = ((height-viz_height)/2)
      } else {
        var viz_width = height*aspect, viz_height = height
        offset_left = ((width-viz_width)/2)
      }
      // x scale
      scale["x"] = d3.scale.linear()
        .domain(x_range)
        .range([padding+offset_left, viz_width-padding])
        .nice()
      // y scale
      scale["y"] = d3.scale.linear()
        .domain(y_range)
        .range([padding+offset_top, viz_height-padding])
        .nice()
      // size scale
      var val_range = d3.extent(d3.values(data), function(d){
        return d.value > 0 ? d.value : null
      });
      scale["size"] = d3.scale.log()
        .domain(val_range)
        .range([2, 8])
        
      // Create viz group on svg_enter
      var viz_enter = svg_enter.append("g")
        .call(zoom_behavior.on("zoom", zoom))
        .on(vizwhiz.evt.down,function(d){dragging = true})
        .on(vizwhiz.evt.up,function(d){dragging = false})
        .append('g')
          .attr('class','viz')
        
      viz_enter.append('rect')
        .attr('class','overlay')
        .attr("width", width)
        .attr("height", height)
        .attr("fill","transparent")
        .on(vizwhiz.evt.click,function(d){
          clicked = null
          highlight = null;
          update();
        })
        
      viz_enter.append('g')
        .attr('class','links')
        
      viz_enter.append('g')
        .attr('class','nodes')
        
      viz_enter.append('g')
        .attr('class','highlight')
        
      // Create Zoom Controls group on svg_enger
      var zoom_controls = svg_enter.append("g")
        .attr("id","zoom_controls")
        .attr("transform","translate(5,5)");
        
      zoom_controls.append("rect")
        .attr("width","22px")
        .attr("height","22px")
        .attr("fill","#dddddd")
        .style("cursor","pointer")
        .on(vizwhiz.evt.click,function(){ zoom("in") });
        
      zoom_controls.append("text")
        .attr("fill","#333333")
        .attr("text-anchor","middle")
        .attr("font-family","Arial")
        .style("font-weight","bold")
        .style("cursor","pointer")
        .attr("font-size","18px")
        .attr("x",11)
        .attr("y",0)
        .attr("dy","1em")
        .text("+")
        .on(vizwhiz.evt.click,function(){ zoom("in") });
        
      zoom_controls.append("rect")
        .attr("width","22px")
        .attr("height","22px")
        .attr("fill","#dddddd")
        .style("cursor","pointer")
        .attr("transform","translate(0,27)")
        .on(vizwhiz.evt.click,function(){ zoom("out") });
        
      zoom_controls.append("text")
        .attr("fill","#333333")
        .attr("text-anchor","middle")
        .attr("font-family","Tahoma")
        .style("font-weight","bold")
        .style("cursor","pointer")
        .attr("font-size","23px")
        .attr("x",11)
        .attr("y",22)
        .attr("dy","1em")
        .text("-")
        .on(vizwhiz.evt.click,function(){ zoom("out") });
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New nodes and links enter, initialize them here
      //-------------------------------------------------------------------
      
      var node = d3.select("g.nodes").selectAll("circle.node")
        .data(nodes, function(d) { return d.id; })
      
      node.enter().append("circle")
        .attr("class","node")
        .attr("cx", function(d) { return scale.x(d.x); })
        .attr("cy", function(d) { return scale.y(d.y); })
        .attr("r", function(d) { return scale.size(val_range[0]); })
        .attr("fill","#eeeeee")
        .attr("stroke","#dedede")
        .attr("stroke-width",1)
        .on(vizwhiz.evt.over, function(d){
          if (!clicked) {
            highlight = d.id;
            update();
          }
        })
        .on(vizwhiz.evt.out, function(d){
          if (!clicked) {
            highlight = null;
            update();
          }
        })
        .on(vizwhiz.evt.click, function(d){
          if (!clicked) clicked = true
          else {
            highlight = d.id;
            update();
          }
        })
      
      var bg = d3.select("g.bgs").selectAll("circle.bg")
        .data(nodes, function(d) { return d.id; })
      
      bg.enter().append("circle")
        .attr("class","bg")
        .attr("cx", function(d) { return scale.x(d.x); })
        .attr("cy", function(d) { return scale.y(d.y); })
        .attr("r", function(d) { return scale.size(val_range[0]); })
        .attr("fill",highlight_color)
        .attr("stroke-width",0)
      
      var link = d3.select("g.links").selectAll("line.link")
        .data(links, function(d) { return d.source.id + "-" + d.target.id; })
        
      link.enter().append("line")
        .attr("class","link")
        .attr("x1", function(d) { return scale.x(d.source.x); })
        .attr("y1", function(d) { return scale.y(d.source.y); })
        .attr("x2", function(d) { return scale.x(d.target.x); })
        .attr("y2", function(d) { return scale.y(d.target.y); })
        .attr("stroke", "#dedede")
        .attr("stroke-width", "1px");
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for nodes and links that are already in existance
      //-------------------------------------------------------------------

      node
        .attr("r", function(d) { 
          var value = data[d.id].value
          return value > 0 ? scale.size(value) : scale.size(val_range[0])
        })
        .attr("fill", function(d){
          var color = data[d.id].color ? data[d.id].color : vizwhiz.utils.rand_color()
          if (data[d.id].active) {
            this.parentNode.appendChild(this)
            return color;
          } else if (spotlight) return "#eeeeee";
          else {
            color = d3.hsl(color)
            color.l = 0.95
            return color.toString()
          }
        })
        .attr("stroke", function(d){
          var color = data[d.id].color ? data[d.id].color : vizwhiz.utils.rand_color()
          if (data[d.id].active) return d3.rgb(color).darker().darker().toString();
          else if (spotlight) return "#dedede";
          else return d3.rgb(color).darker().toString()
        })
        .attr("stroke-width", function(d){
          if(data[d.id].active) return 2;
          else return 1;
        })
          
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Exit, for nodes and links that are being removed
      //-------------------------------------------------------------------

      node.exit().remove()
      link.exit().remove()

      //===================================================================
      
      force.start();
      update();
      
      function update() {
        bg
          .attr("r", function(d) { 
            var value = data[d.id].value
            value = value > 0 ? scale.size(value) : scale.size(val_range[0])
            return d.id == highlight || neighbors(d.id,highlight) ? value+2 : value
          });
        
        link
          .attr("stroke", function(d) {
            if (d.source.id === highlight || d.target.id === highlight) {
              this.parentNode.appendChild(this)
              return highlight_color
            } else return "#dedede"
          });
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
          } else {
            if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
            else multiplier = 0.5
          }
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
          zoom_behavior.translate(translate).scale(evt_scale)
        
        }
        
        // Auto center visualization
        if (translate[0] > 0) translate[0] = 0
        else if (translate[0] < -((width*evt_scale)-width)) translate[0] = -((width*evt_scale)-width)
        if (translate[1] > 0) translate[1] = 0
        else if (translate[1] < -((height*evt_scale)-height)) translate[1] = -((height*evt_scale)-height)
        
        d3.select(".viz").attr("transform", 
          "translate(" + translate + ")" + 
          "scale(" + evt_scale + ")")
      }

      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Function that determines if 2 ids are connected
      //-------------------------------------------------------------------
      
      function neighbors(a, b) {
        return linked[a + "," + b]
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
    force.size([width,height]);
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    force.size([width,height]);
    return chart;
  };

  chart.nodes = function(x) {
    if (!arguments.length) return nodes;
    nodes = nodes.concat(x);
    return chart;
  };

  chart.links = function(x) {
    if (!arguments.length) return links;
    links = links.concat(x);
    links.forEach(function(d) {
      linked[d.source.id + "," + d.target.id] = true
      linked[d.target.id + "," + d.source.id] = true
    })
    return chart;
  };

  chart.spotlight = function(x) {
    if (!arguments.length) return spotlight;
    spotlight = x;
    return chart;
  };

  chart.highlight = function(x) {
    if (!arguments.length) highlight = null;
    highlight = x;
    return chart;
  };

  //===================================================================


  return chart;
};