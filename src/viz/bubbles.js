vizwhiz.viz.bubbles = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = 300,
      height = 300,
      value_var = "value",
      id_var = "id",
      text_var = "name",
      grouping = "name",
      tooltip_info = []
      arc_angles = {},
      arc_sizes = {},
      arc_inners = {},
      avail_var = "available",
      layout = "pie",
      donut = "false",
      padding = 5;
      
  var arc = d3.svg.arc()
    .startAngle(0)
    .innerRadius(function(d) { return d.arc_inner })
    .outerRadius(function(d) { return d.arc_radius })
    .endAngle(function(d) { return d.arc_angle });
  
  var arc_else = d3.svg.arc()
    .startAngle(0)
    .innerRadius(function(d) { return d.arc_inner_else })
    .outerRadius(function(d) { return d.arc_radius_else })
    .endAngle(function(d) { return d.arc_angle_else });
  
  var arc_text = d3.svg.arc()
    .startAngle(0)
    .innerRadius(0)
    .outerRadius(function(d) { return d.arc_radius })
    .endAngle(360);
  
  var arc_bg = d3.svg.arc()
    .startAngle(0)
    .innerRadius(function(d) { return d.arc_inner_bg })
    .outerRadius(function(d) { return d.arc_radius_bg })
    .endAngle(360);

  //===================================================================


  function chart(selection) {
    selection.each(function(data, i) {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Private Variables
      //-------------------------------------------------------------------
      
      var this_selection = this,
          groups = {},
          donut_size = 0.4,
          title_height = 30;
            
      if (donut) var arc_offset = donut_size;
      else var arc_offset = 0;
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Calculate positioning for each bubble
      //-------------------------------------------------------------------
      
      if (grouping == "id" || grouping == "name") {
        
        if(data.length == 1) {
          var columns = 1,
              rows = 1
        } else {
          var rows = Math.ceil(Math.sqrt(data.length/(width/height))),
              columns = Math.ceil(Math.sqrt(data.length*(width/height)))
        }
        
        while ((rows-1)*columns >= data.length) rows--
        
        var max_size = d3.min([(width/columns)/2,(height/rows)/2-title_height])
        
        var size_range = d3.scale.linear()
          .domain(d3.extent(data,function(d){return d[value_var]}))
          .range([max_size/4,max_size])
        
        var r = 0, c = 0;

        data.forEach(function(d){
            
          var color = d3.rgb(d.color).hsl()
          if (color.s > 0.9) color.s = 0.75
          while (color.l > 0.75) color = color.darker()
          color = color.rgb()
          
          groups[d[grouping]] = {};
          groups[d[grouping]].color = color
          groups[d[grouping]].key = d[grouping];
          groups[d[grouping]].x = ((width/columns)*c)+((width/columns)/2)
          groups[d[grouping]].y = ((height/rows)*r)+((height/rows)/2)+(title_height/2)
          groups[d[grouping]].width = (width/columns)
          groups[d[grouping]].height = (height/rows)
          
          d.x = groups[d[grouping]].x;
          d.y = groups[d[grouping]].y;
          d.r = size_range(d[value_var]);

          if (c < columns-1) c++
          else {
            c = 0
            r++
          }
          
        })
        
      }
      else {
      
        var data_nested = {}
        data_nested.key = "root";
        data_nested.values = d3.nest()
          .key(function(d){ return d[grouping] })
          .entries(data)
      
        var pack = d3.layout.pack()
          .size([width,height])
          .children(function(d) { return d.values; })
          .padding(padding)
          .value(function(d) { return d[value_var]; })
          .sort(function(a,b) { 
            if (a.values && b.values) return a.values.length - b.values.length;
            else return a[value_var] - b[value_var];
          })
        
        var data_packed = pack.nodes(data_nested)
        var tm_data = {"key": "root", "children": []}
        
        data_packed.forEach(function(d){
          if (d.depth == 1) {
            var obj = {}
            obj.r = d.r;
            obj.key = d.key;
            tm_data.children.push(obj);
          }
        })
        
        if (tm_data.children.length < 4) var mode = "slice";
        else var mode = "squarify";
        
        var tm = d3.layout.treemap()
          .round(false)
          .mode(mode)
          .size([width,height])
          .value(function(d) { return d.r; })
          .sort(function(a,b) {
            return a.r - b.r
          })
          .nodes(tm_data)
        
        tm.forEach(function(value){
          if (value.key != 'root') {
            groups[value.key] = {};
            if (grouping == "category") {
              var c = data.filter(function(d){return d.category == value.key })[0].color;
            }
            else {
              var c = "#cccccc";
            }

            
            var color = d3.rgb(c).hsl()
            if (color.s > 0.9) color.s = 0.75
            while (color.l > 0.75) color = color.darker()
            color = color.rgb()
            groups[value.key].children = data_packed.filter(function(d){return d.key == value.key})[0].children.length
            groups[value.key].color = color
            groups[value.key].key = value.key;
            groups[value.key].width = value.dx;
            groups[value.key].height = value.dy;
            groups[value.key].x = value.x+value.dx/2;
            groups[value.key].y = value.y+value.dy/2;
            groups[value.key].r = value.r*0.9+5;
          }
        })

        data.forEach(function(d){
          var parent = data_packed.filter(function(p){ 
            if (d[grouping] === false) var key = "false";
            else if (d[grouping] === true) var key = "true";
            else var key = d[grouping]
            return key == p.key 
          })[0]
          d.x = (0.9*(d.x-parent.x))+groups[parent.key].x;
          d.y = (0.9*(d.y-parent.y))+groups[parent.key].y;
          d.r = d.r*0.9;
        })
        
      }
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Set up initial SVG and groups
      //-------------------------------------------------------------------
      
      var svg = d3.select(this_selection).selectAll("svg").data([data]);
      
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height);
        
      svg_enter.append('g')
        .attr('class','groups');
        
      svg_enter.append('g')
        .attr('class','bubbles');
        
      svg_enter.append('g')
        .attr('class','labels');
        
      svg.transition().duration(vizwhiz.timing)
        .attr("width", width)
        .attr("height", height);
        
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New labels enter, initialize them here
      //-------------------------------------------------------------------

      var group = d3.select("g.groups").selectAll("g.group")
        .data(d3.values(groups),function(d){ return d.key })
        
      group.enter().append("g")
        .attr("class", "group")
        .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
        .each(function(d){
          
          if (grouping != "id" && grouping != "name") {
          
            d3.select(this).append("circle")
              .attr("fill", d.color )
              .attr("stroke",d.color)
              .attr("stroke-width",1)
              .style('fill-opacity', 0.1 )
              .attr("r",0);

            arc_sizes[d.key+"_group"] = 0;
          
            d3.select(this).append("path")
              .attr("fill","transparent")
              .style('fill-opacity', 0.1 )
              .attr("id","path_"+d.key);
          
            d3.select(this).select("path").transition().duration(vizwhiz.timing)
              .attrTween("d",arcTween_text)
              
          }
          else {
            d3.select(this).append("text")
              .attr("opacity",0)
              .attr("text-anchor","middle")
              .attr("font-weight","bold")
              .attr("font-size","12px")
              .attr("font-family","Helvetica")
              .attr("fill",d.color)
              .attr('x',0)
              .attr('y',function(dd) {
                return -(d.height/2)-title_height/4;
              })
              .each(function(){
                vizwhiz.utils.wordwrap({
                  "text": d.key,
                  "parent": this,
                  "width": d.width,
                  "height": 30
                })
              })
          }
          
        });
        
      group.transition().duration(vizwhiz.timing)
        .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
        .each(function(d){
          
          if (grouping != "id" && grouping != "name") {
          
            var parent = this;
            
            d3.select(parent).select("circle").transition().duration(vizwhiz.timing)
              .attr("r",d.r);
        
            d.arc_radius = d.r+5;
            
            if (grouping == "active") {
              var t = d.key == "true" ? "Fully "+avail_var : "Not Fully "+avail_var
            } else {
              var t = d.key
            }
    
            var split = t.split(" "),
                text = [""];

            if (t.length * 3 > d.r && split.length > 1) {
              var i = 0;
              while (text[i].length * 3 < d.r) {
                var word = split.shift();
                text[i] = text[i] + word;
                
                if (text[i].length * 3 < d.r) text[i] = text[i] + " "
                else {
                  if (text[i].indexOf(" ") >= 0) {
                    text[i] = text[i].slice(0,text[i].lastIndexOf(" "))
                    split.unshift(word);
                  }
                  if (split.length > 0 && split[0]) {
                    text.push("");
                    i++;
                  } else {
                    break;
                  }
                }
                
              }
              if (split.length > 0 && split[0]) text.push(split.join(" "))
            }
            else {
              text[0] = t;
            }
            var start = -14*(text.length-1);
          
            d3.select(parent).selectAll("text").transition().duration(vizwhiz.timing)
              .attr("opacity",0)
              .remove();
              
            d3.select(parent).select("path").transition().duration(vizwhiz.timing)
              .attrTween("d",arcTween_text)
              .each("end", function(dd) {
              
                arc_sizes[d.key+"_group"] = d.arc_radius;
              
                text.forEach(function(t,i){
      
                  d3.select(parent).append("text")
                    .attr("fill", d.color )
                    .attr("opacity",0)
                    .attr("font-weight","bold")
                    .attr("font-size","12px")
                    .attr("font-family","Helvetica")
                    .attr("text-anchor","middle")
                    .attr("transform","translate(0,"+start+")")
                    .append("textPath")
                      .attr("startOffset",d.arc_radius*Math.PI)
                      .attr("xlink:href","#path_"+d.key)
                      .text(t);
          
                  start += 14;
                })
      
                d3.select(parent).selectAll("text").transition().duration(vizwhiz.timing)
                  .attr("opacity",1)
              
              })
            
          }
          else {
            d3.select(this).select("text").transition().duration(vizwhiz.timing)
              .attr("opacity",1)
          }
          
        });
        
      group.exit().transition().duration(vizwhiz.timing)
        .each(function(d){
          
          d3.select(this).select("circle").transition().duration(vizwhiz.timing)
            .attr("r",0);
        
          d.arc_radius = 0;
          
          d3.select(this).selectAll("text").transition().duration(vizwhiz.timing)
            .attr("opacity",0);

          d3.select(this).select("path").transition().duration(vizwhiz.timing)
            .attrTween("d",arcTween_text)
            
        }).remove();
        
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New bubbles enter, initialize them here
      //-------------------------------------------------------------------

      var bubble = d3.select("g.bubbles").selectAll("g.bubble")
        .data(data,function(d){ return d[id_var] })
        
      bubble.enter().append("g")
        .attr("class", "bubble")
        .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
        .on(vizwhiz.evt.over, function(d){
          
          var tooltip_data = {}
          tooltip_info.forEach(function(t){
            if (d[t]) tooltip_data[t] = d[t]
          })
          
          vizwhiz.tooltip.create({
            "parent": svg,
            "id": d[id_var],
            "data": tooltip_data,
            "title": d[text_var],
            "x": d.x,
            "y": d.y,
            "offset": d.r,
            "arrow": true
          })
          
        })
        .on(vizwhiz.evt.out, function(d){
          vizwhiz.tooltip.remove(d[id_var])
        })
        .each(function(d){
          
          arc_sizes[d[id_var]+"_bg"] = 0
          arc_inners[d[id_var]+"_bg"] = 0
          
          d3.select(this).append("path")
            .attr("class","bg")
            .attr("fill", d.color )
            .attr("stroke", d.color )
            .attr("stroke-width",1)
            .style('fill-opacity', 0.1 )
          
          d3.select(this).select("path.bg").transition().duration(vizwhiz.timing)
            .attrTween("d",arcTween_bg)
        
          if (d.elsewhere) {
        
            arc_angles[d[id_var]+"_else"] = 0
            arc_sizes[d[id_var]+"_else"] = 0
            arc_inners[d[id_var]+"_else"] = 0
          
            d3.select(this).append("path")
              .attr("class","elsewhere")
              .style('fill', d.color )
              .style('fill-opacity', 0.5 )
          
            d3.select(this).select("path.elsewhere").transition().duration(vizwhiz.timing)
              .attrTween("d",arcTween_else)
          }
          
          arc_angles[d[id_var]] = 0
          arc_sizes[d[id_var]] = 0
          arc_inners[d[id_var]] = 0
          
          d3.select(this).append("path")
            .each(function(dd) { dd.arc_id = dd[id_var]; })
            .attr("class","available")
            .style('fill', d.color )
          
          d3.select(this).select("path.available").transition().duration(vizwhiz.timing)
            .attrTween("d",arcTween)
            
        });
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for things that are already in existance
      //-------------------------------------------------------------------
        
      bubble.transition().duration(vizwhiz.timing)
        .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
        .each(function(d){
        
          if (donut) d.arc_inner_bg = d.r*arc_offset;
          else d.arc_inner_bg = 0;
          d.arc_radius_bg = d.r;
          
          d3.select(this).select("path.bg").transition().duration(vizwhiz.timing)
            .attrTween("d",arcTween_bg)
            .each("end", function() {
              arc_sizes[d[id_var]+"_bg"] = d.arc_radius_bg
              arc_inners[d[id_var]+"_bg"] = d.arc_inner_bg
            })
        
          if (layout != "inner") d.arc_radius = d.r;
          else d.arc_radius = d.r*(arc_offset+(1-arc_offset)/2);
        
          if (d.total) d.arc_angle = (((d[avail_var] / d.total)*360) * (Math.PI/180));
          else if (d.active) d.arc_angle = 360; 
        
          if (layout == "outer") d.arc_inner = d.r*(arc_offset+(1-arc_offset)/2);
          else d.arc_inner = d.r*arc_offset;

          d3.select(this).select("path.available").transition().duration(vizwhiz.timing)
            .attrTween("d",arcTween)
            .each("end", function() {
              arc_angles[d[id_var]] = d.arc_angle
              arc_sizes[d[id_var]] = d.arc_radius
              arc_inners[d[id_var]] = d.arc_inner
            })
        
          if (d.elsewhere) {
          
            if (layout != "donut" && layout != "pie") d.arc_angle_else = (((d.elsewhere / d.total)*360) * (Math.PI/180));
            else d.arc_angle_else = d.arc_angle + (((d.elsewhere / d.total)*360) * (Math.PI/180));
          
            if (layout == "outer") d.arc_radius_else = d.r*(arc_offset+(1-arc_offset)/2);
            else d.arc_radius_else = d.r;
        
            if (layout == "inner") d.arc_inner_else = d.r*(arc_offset+(1-arc_offset)/2);
            else d.arc_inner_else = d.r*arc_offset;
          
            d3.select(this).select("path.elsewhere").transition().duration(vizwhiz.timing)
              .attrTween("d",arcTween_else)
              .each("end", function() {
                arc_angles[d[id_var]+"_else"] = d.arc_angle_else
                arc_sizes[d[id_var]+"_else"] = d.arc_radius_else
                arc_inners[d[id_var]+"_else"] = d.arc_inner_else
              })
          }
          
        })

      // label.transition().duration(vizwhiz.timing/2)
      //   .attr('opacity',1)
          
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Exit, for nodes and links that are being removed
      //-------------------------------------------------------------------

      bubble.exit().transition().duration(vizwhiz.timing)
        .each(function(d){
        
          d.arc_radius_bg = 0;
          d.arc_inner_bg = 0;
          
          d3.select(this).select("path.bg").transition().duration(vizwhiz.timing)
            .attrTween("d",arcTween_bg)
            .each("end", function() {
              arc_sizes[d[id_var]+"_bg"] = d.arc_radius_bg
              arc_inners[d[id_var]+"_bg"] = d.arc_inner_bg
            })
        
          d.arc_radius = 0;
          d.arc_angle = 0; 
          d.arc_inner = 0;

          d3.select(this).select("path.available").transition().duration(vizwhiz.timing)
            .attrTween("d",arcTween)
            .each("end", function() {
              arc_angles[d[id_var]] = d.arc_angle
              arc_sizes[d[id_var]] = d.arc_radius
              arc_inners[d[id_var]] = d.arc_inner
            })
        
          if (d.elsewhere) {
          
            d.arc_angle_else = 0;
            d.arc_radius_else = 0;
            d.arc_inner_else = 0;
          
            d3.select(this).select("path.elsewhere").transition().duration(vizwhiz.timing)
              .attrTween("d",arcTween_else)
              .each("end", function(dd) {
                arc_angles[d[id_var]+"_else"] = d.arc_angle_else
                arc_sizes[d[id_var]+"_else"] = d.arc_radius_else
                arc_inners[d[id_var]+"_else"] = d.arc_inner_else
              })
          }

          d3.select(this).select("circle.hole").transition().duration(vizwhiz.timing)
            .attr("r", 0)
          
        })
        .remove();

      //===================================================================
      
      function arcTween(b) {
        var i = d3.interpolate({arc_angle: arc_angles[b[id_var]], arc_radius: arc_sizes[b[id_var]], arc_inner: arc_inners[b[id_var]]}, b);
        return function(t) {
          return arc(i(t));
        };
      }
      
      function arcTween_else(b) {
        var i = d3.interpolate({arc_angle_else: arc_angles[b[id_var]+"_else"], arc_radius_else: arc_sizes[b[id_var]+"_else"], arc_inner_else: arc_inners[b[id_var]+"_else"]}, b);
        return function(t) {
          return arc_else(i(t));
        };
      }
      
      function arcTween_text(b) {
        var i = d3.interpolate({arc_radius: arc_sizes[b.key+"_group"]}, b);
        return function(t) {
          return arc_text(i(t));
        };
      }
      
      function arcTween_bg(b) {
        var i = d3.interpolate({arc_radius_bg: arc_sizes[b[id_var]+"_bg"], arc_inner_bg: arc_inners[b[id_var]+"_bg"]}, b);
        return function(t) {
          return arc_bg(i(t));
        };
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
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return chart;
  };

  chart.grouping = function(x) {
    if (!arguments.length) return grouping;
    grouping = x;
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
  
  chart.avail_var = function(x) {
    if (!arguments.length) return avail_var;
    avail_var = x;
    return chart;
  };
  
  chart.tooltip_info = function(x) {
    if (!arguments.length) return tooltip_info;
    tooltip_info = x;
    return chart;
  };
  
  chart.layout = function(x) {
    if (!arguments.length) return layout;
    layout = x;
    return chart;
  };
  
  chart.donut = function(x) {
    if (!arguments.length) return donut;
    if (x == "true") donut = true;
    else if (x == "false") donut = false;
    else donut = x;
    return chart;
  };

  //===================================================================


  return chart;
};
