(function(){
var vizwhiz = window.vizwhiz || {};

vizwhiz.version = '0.0.1';
vizwhiz.dev = true //set false when in production

window.vizwhiz = vizwhiz;

vizwhiz.tooltip = {}; // For the tooltip system
vizwhiz.utils = {}; // Utility subsystem
vizwhiz.viz = {}; //stores all the possible visualizations
vizwhiz.evt = {}; // stores all mouse events that could occur

// Modernizr touch events
if (Modernizr.touch) {
  vizwhiz.evt.click = 'touchend'
  vizwhiz.evt.down = 'touchstart'
  vizwhiz.evt.up = 'touchend'
  vizwhiz.evt.over = 'touchstart'
  vizwhiz.evt.out = 'touchend'
  vizwhiz.evt.move = 'touchmove'
} else {
  vizwhiz.evt.click = 'click'
  vizwhiz.evt.down = 'mousedown'
  vizwhiz.evt.up = 'mouseup'
  vizwhiz.evt.over = 'mouseover'
  vizwhiz.evt.out = 'mouseout'
  vizwhiz.evt.move = 'mousemove'
}
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Number formatter
//-------------------------------------------------------------------

vizwhiz.utils.format_num = function(val, percent, sig_figs, abbrv) {
  
  // test if number is REALLY small
  if(Math.abs(val - 1e-16) < 1e-10){
    val = 0;
  }
  
  if(percent){
    val = d3.format("."+sig_figs+"p")(val)
  }
  else if(abbrv){
    var symbol = d3.formatPrefix(val).symbol
    symbol = symbol.replace("G", "B") // d3 uses G for giga

    // Format number to precision level using proper scale
    val = d3.formatPrefix(val).scale(val)
    val = parseFloat(d3.format("."+sig_figs+"g")(val))
    val = val + " " + symbol;
  }
  else {
    val = d3.format(",."+sig_figs+"d")(val)
  }
  
  return val;
};

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator (if no color is given)
//-------------------------------------------------------------------

vizwhiz.utils.color_scale = d3.scale.category20();
vizwhiz.utils.rand_color = function() {
  var rand_int = Math.floor(Math.random()*20)
  return vizwhiz.utils.color_scale(rand_int);
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//-------------------------------------------------------------------

vizwhiz.utils.merge = function(obj1, obj2) {
  var obj3 = {};
  for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
  for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
  return obj3;
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// recursive function to rename "values" to "children" and "key" to "id"
// src: https://groups.google.com/group/d3-js/tree/browse_frm/month/2011-11/a5dc689238c3a685
//-------------------------------------------------------------------

vizwhiz.utils.rename_key_value = function(obj) { 
  if (obj.values && obj.values.length) { 
    return { 
      'name': obj.key, 
      'id': obj.key, 
      'children': obj.values.map(function(obj) { 
        return vizwhiz.utils.rename_key_value(obj);
      }) 
    }; 
  } 
  else if(obj.values) { 
    return obj.values
  }
  else {
    return obj; 
  }
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//-------------------------------------------------------------------

vizwhiz.utils.nest = function(flat_data, nesting, flatten, extra) {

  var flattened = [];
  var nested_data = d3.nest();
  
  nesting.forEach(function(nest_key, i){
    
    nested_data.key(function(d){
      return d[nest_key];
    })
    
    if(i == nesting.length-1){
      nested_data.rollup(function(leaves){
        if(leaves.length == 1){
          flattened.push(leaves[0]);
          return leaves[0]
        }
        to_return = leaves[0]
        to_return.value = d3.sum(leaves, function(d){ return d.value; })
        to_return.name = leaves[0][nest_key]
        to_return.num_children = leaves.length;
        to_return.num_children_active = d3.sum(leaves, function(d){ return d.active; });
        
        if(extra){
          extra.forEach(function(e){
            if(e.agg == "sum"){
              to_return[e.key] = d3.sum(leaves, function(d){ return d[e.key]; })
            }
            else if(e.agg == "avg"){
              to_return[e.key] = d3.mean(leaves, function(d){ return d[e.key]; })
            }
          })
        }
        
        flattened.push(to_return);
        
        return to_return
      })
    }
    
  })
    
  nested_data = nested_data
    .entries(flat_data)
    .map(vizwhiz.utils.rename_key_value);

  if(flatten){
    return flattened;
  }

  return {"name":"root", "children": nested_data};

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// for SVGs word wrapping is not built in, so here we must creat this
// function ourselves
//-------------------------------------------------------------------

vizwhiz.utils.wordWrap = function(text, parent, width, height, resize) {
  
  var words = text.split(/[\s-]/),
      tspan,
      width = width*0.9, // width & height slightly smaller for buffer
      height = height*0.9;
  
  if (resize) {
    
    // default max and min font sizes
    var max_font_size = 40, min_font_size = 8;
    
    // base scaling on whichever is larger width or height
    var size = height
    if (width < height) {
      var size = width
    }
    
    d3.select(parent).attr('font-size',size)

    var text_width = 0
    for(var i=0; i<words.length; i++) {
      tspan = d3.select(parent).append('tspan')
        .attr('x',0)
        .attr('dx','0.15em')
        .text(words[i]+" ...")
        
      if (tspan.node().getComputedTextLength() > text_width) {
        text_width = tspan.node().getComputedTextLength()
      }
    }
  
    if (text_width > width) {
      size = size*(width/text_width)
    }
  
    if (size < min_font_size) {
      d3.select(parent).selectAll('tspan').remove()
      return
    } else if (size > max_font_size) size = max_font_size
    
    d3.select(parent).attr('font-size',size)
    
    flow()
    
    if (parent.childNodes.length*parent.getBBox().height > height) {
      var temp_size = size*(height/(parent.childNodes.length*parent.getBBox().height))
      if (temp_size < min_font_size) size = min_font_size
      else size = temp_size
      d3.select(parent).attr('font-size',size)
    }
    
  }
  
  flow()
  truncate()
  d3.select(parent).selectAll('tspan').attr("dy", d3.select(parent).style('font-size'))
  
  function flow() {
    
    d3.select(parent).selectAll('tspan').remove()
    
    var tspan = d3.select(parent).append('tspan')
      .attr('x',parent.getAttribute('x'))
      .text(words[0])

    for (var i=1; i<words.length; i++) {
        
      tspan.text(tspan.text()+" "+words[i])
      
      if (tspan.node().getComputedTextLength() > width) {
            
        tspan.text(tspan.text().substr(0,tspan.text().lastIndexOf(" ")))
    
        tspan = d3.select(parent).append('tspan')
          .attr('x',parent.getAttribute('x'))
          .text(words[i])
            
      }
    }
  
  }
  
  function truncate() {
    var cut = false
    while (parent.childNodes.length*parent.getBBox().height > height) {
      parent.removeChild(parent.lastChild)
      cut = true
    }
    if (cut && parent.childNodes.length != 0) {
    // if (cut) {
      tspan = parent.lastChild
      words = d3.select(tspan).text().split(/[\s-]/)
      
      var last_char = words[words.length-1].charAt(words[words.length-1].length-1)
      if (last_char == ',' || last_char == ';' || last_char == ':') words[words.length-1] = words[words.length-1].substr(0,words[words.length-1].length-1)
      
      d3.select(tspan).text(words.join(' ')+'...')
      
      if (tspan.getComputedTextLength() > width) {
        if (words.length > 1) words.pop(words.length-1)
        last_char = words[words.length-1].charAt(words[words.length-1].length-1)
        if (last_char == ',' || last_char == ';' || last_char == ':') words[words.length-1].substr(0,words[words.length-1].length-2)
        d3.select(tspan).text(words.join(' ')+'...')
      }
    }
  }
  
}

//===================================================================


//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Drop shadow function, adds the proper definition with th parameters
// used to the page
//-------------------------------------------------------------------

vizwhiz.utils.drop_shadow = function(defs) {
  
  // add filter to svg defs
  var drop_shadow_filter = defs.append('filter')
    .attr('id', 'dropShadow')
    .attr('filterUnits', "userSpaceOnUse")
    .attr('width', '100%')
    .attr('height', '100%');
  
  // shadow blue
  drop_shadow_filter.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', 2);
  
  // shadow offset
  drop_shadow_filter.append('feOffset')
    .attr('dx', 1)
    .attr('dy', 1)
    .attr('result', 'offsetblur');
  
  var feMerge = drop_shadow_filter.append('feMerge');  
  feMerge.append('feMergeNode');
  
  // put original on top of shadow
  feMerge.append('feMergeNode')
    .attr('in', "SourceGraphic");

}
vizwhiz.viz.network = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = 300,
      height = 300,
      value_var = "value",
      id_var = "id",
      text_var = "name",
      clicked = false,
      spotlight = true,
      highlight = null,
      timing = 100,
      zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
      nodes = [],
      x_range,
      y_range,
      aspect,
      links = [],
      connections = {};

  //===================================================================


  function chart(selection) {
    selection.each(function(data, i) {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Private Variables
      //-------------------------------------------------------------------

      var this_selection = this,
          dragging = false,
          highlight_color = "#cc0000",
          select_color = "#ee0000",
          secondary_color = "#ffdddd",
          scale = {},
          offset_top = 0,
          offset_left = 0,
          info_width = 300;

      //===================================================================
      
      // Select the svg element, if it exists.
      var svg = d3.select(this_selection).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height);
        
      // Define Scale
      if (aspect > width/height) {
        var viz_height = width/aspect, viz_width = width
        offset_top = ((height-viz_height)/2)
      } else {
        var viz_width = height*aspect, viz_height = height
        offset_left = ((width-viz_width)/2)
      }
          
      var columns = Math.ceil(Math.sqrt(Object.keys(nodes).length*(viz_width/viz_height))),
          max_size = viz_width/(columns*3),
          min_size = max_size/5 < 2 ? 2 : max_size/5
          
      // x scale
      scale["x"] = d3.scale.linear()
        .domain(x_range)
        .range([offset_left+(max_size*2), width-(max_size*2)-offset_left])
      // y scale
      scale["y"] = d3.scale.linear()
        .domain(y_range)
        .range([offset_top+(max_size*2), height-(max_size*2)-offset_top])
      // size scale
      var val_range = d3.extent(d3.values(data), function(d){
        return d[value_var] > 0 ? d[value_var] : null
      });
      scale["size"] = d3.scale.log()
        .domain(val_range)
        .range([min_size, max_size])
        
      // Create viz group on svg_enter
      var viz_enter = svg_enter.append("g")
        .call(zoom_behavior.on("zoom", zoom))
        .on(vizwhiz.evt.down,function(d){dragging = true})
        .on(vizwhiz.evt.up,function(d){dragging = false})
        .append('g')
          .attr('class','viz')
        
      viz_enter.append('rect')
        .attr('class','overlay')
        .attr("width", viz_width)
        .attr("height", viz_height)
        .attr("fill","transparent")
        .on(vizwhiz.evt.over,function(d){
          if (!clicked && highlight) {
            highlight = null;
            update();
          }
        })
        .on(vizwhiz.evt.click,function(d){
          clicked = null;
          highlight = null;
          zoom("reset");
          update();
        })
        
      var link_group = viz_enter.append('g')
        .attr('class','links')
        
      var node_group = viz_enter.append('g')
        .attr('class','nodes')
        
      var highlight_group = viz_enter.append('g')
        .attr('class','highlight')
        
      // Create group outside of zoom group for info panel
      var info_group = svg_enter.append("g")
        .attr("class","info")
        
      // Create Zoom Controls div on svg_enter
      var zoom_div = svg.enter().append("div")
        .attr("id","zoom_controls")
        
      zoom_div.append("div")
        .attr("id","zoom_in")
        .attr("unselectable","on")
        .on(vizwhiz.evt.click,function(){ zoom("in") })
        .text("+")
        
      zoom_div.append("div")
        .attr("id","zoom_out")
        .attr("unselectable","on")
        .on(vizwhiz.evt.click,function(){ zoom("out") })
        .text("-")
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New nodes and links enter, initialize them here
      //-------------------------------------------------------------------
      
      var node = node_group.selectAll("circle.node")
        .data(nodes, function(d) { return d[id_var]; })
      
      node.enter().append("circle")
        .attr("class","node")
        .call(size_nodes)
        .call(color_nodes)
        .on(vizwhiz.evt.over, function(d){
          if (!clicked) {
            highlight = d[id_var];
            update();
          } else {
            d3.select(this).attr("stroke",highlight_color)
          }
        })
        .on(vizwhiz.evt.out, function(d){
          if (clicked) {
            d3.select(this).attr("stroke","#dedede")
          }
        })
        .on(vizwhiz.evt.click, function(d){
          highlight = d[id_var];
          zoom(highlight);
          update();
        })
      
      var link = link_group.selectAll("line.link")
        .data(links, function(d) { return d.source[id_var] + "-" + d.target[id_var]; })
        
      link.enter().append("line")
        .attr("class","link")
        .call(position_links)
        .attr("stroke", "#dedede")
        .attr("stroke-width", "1px")
        .on(vizwhiz.evt.click,function(d){
          clicked = null
          highlight = null;
          zoom("reset");
          update();
        });
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for nodes and links that are already in existance
      //-------------------------------------------------------------------

      node.transition().duration(timing)
        .call(size_nodes)
        .call(color_nodes);
        
      link.transition().duration(timing)
        .call(position_links);
        
      d3.select('.overlay').transition().duration(timing)
        .attr("width", viz_width)
        .attr("height", viz_height)
        
      svg.transition().duration(timing)
        .attr("width", width)
        .attr("height", height)
          
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Exit, for nodes and links that are being removed
      //-------------------------------------------------------------------

      node.exit().remove()
      link.exit().remove()

      //===================================================================
      
      update();
      if (highlight && clicked) zoom(highlight);
          
      function position_links(l) {
        l
          .attr("x1", function(d) { return scale.x(d.source.x); })
          .attr("y1", function(d) { return scale.y(d.source.y); })
          .attr("x2", function(d) { return scale.x(d.target.x); })
          .attr("y2", function(d) { return scale.y(d.target.y); });
      }
      
      function size_nodes(n) {
        n
          .attr("cx", function(d) { return scale.x(d.x); })
          .attr("cy", function(d) { return scale.y(d.y); })
          .attr("r", function(d) { 
            var value = data[d[id_var]][value_var]
            return value > 0 ? scale.size(value) : scale.size(val_range[0])
          })
          .attr("stroke-width", function(d){
            if(data[d[id_var]].active) return 2;
            else return 1;
          })
      }
      
      function size_bgs(b) {
        b
          .attr("cx", function(d) { return scale.x(d.x); })
          .attr("cy", function(d) { return scale.y(d.y); })
          .attr("r", function(d) { 
            var value = data[d[id_var]][value_var],
                buffer = data[d[id_var]].active ? 3 : 2
            value = value > 0 ? scale.size(value) : scale.size(val_range[0])
            return value+buffer
          })
          .attr("stroke-width",0)
      }
      
      function color_nodes(n) {
        n
          .attr("fill", function(d){
            var color = data[d[id_var]].color ? data[d[id_var]].color : vizwhiz.utils.rand_color()
            if (data[d[id_var]].active) {
              this.parentNode.appendChild(this)
              return color;
            } else if (spotlight && !highlight) return "#eeeeee";
            else {
              color = d3.hsl(color)
              color.l = 0.98
              return color.toString()
            }
          })
          .attr("stroke", function(d){
            var color = data[d[id_var]].color ? data[d[id_var]].color : vizwhiz.utils.rand_color()
            if (data[d[id_var]].active) return d3.rgb(color).darker().darker().toString();
            else if (spotlight && !highlight) return "#dedede";
            else return d3.rgb(color).darker().toString()
          })
      }
      
      function update() {
        
        highlight_group.selectAll("*").remove()
        info_group.selectAll("*").remove()
        
        if (highlight) {
          
          node
            .attr("fill","#efefef")
            .attr("stroke","#dedede")
            
          var center = connections[highlight].center,
              primaries = connections[highlight].primary,
              secondaries = connections[highlight].secondary
              
          // Draw Primary, Secondary and Center Connection Lines and BGs
          highlight_group.selectAll("line.sec_links")
            .data(secondaries.links).enter()
            .append("line")
              .attr("class","sec_links")
              .attr("stroke-width", "1px")
              .attr("stroke", secondary_color)
              .call(position_links)
              .on(vizwhiz.evt.click, function(d){
                zoom("reset");
                clicked = false;
                update();
              });
          highlight_group.selectAll("circle.sec_bgs")
            .data(secondaries.nodes).enter()
            .append("circle")
              .attr("class","sec_bgs")
              .attr("fill", secondary_color)
              .call(size_bgs);
          
          // Draw Secondary Nodes
          highlight_group.selectAll("circle.sec_nodes")
            .data(secondaries.nodes).enter()
            .append("circle")
              .attr("class","sec_nodes")
              .call(size_nodes)
              .attr("fill","#efefef")
              .attr("stroke","#dedede")
              .on(vizwhiz.evt.over, function(d){
                if (!clicked) {
                  highlight = d[id_var];
                  update();
                } else {
                  d3.select(this).attr("stroke",highlight_color)
                }
              })
              .on(vizwhiz.evt.out, function(d){
                if (clicked) {
                  d3.select(this).attr("stroke","#dedede")
                }
              })
              .on(vizwhiz.evt.click, function(d){
                highlight = d[id_var];
                zoom(highlight);
                update();
              });
              
          // Draw Primary Connection Lines and BGs
          highlight_group.selectAll("line.prim_links")
            .data(primaries.links).enter()
            .append("line")
              .attr("class","prim_links")
              .attr("stroke", highlight_color)
              .attr("stroke-width", "2px")
              .call(position_links)
              .on(vizwhiz.evt.click, function(d){
                zoom("reset");
                clicked = false;
                update();
              });
          highlight_group.selectAll("circle.prim_bgs")
            .data(primaries.nodes).enter()
            .append("circle")
              .attr("class","prim_bgs")
              .call(size_bgs)
              .attr("fill",highlight_color);
          
          // Draw Primary Nodes
          highlight_group.selectAll("circle.prim_nodes")
            .data(primaries.nodes).enter()
            .append("circle")
              .attr("class","prim_nodes")
              .call(size_nodes)
              .call(color_nodes)
              .on(vizwhiz.evt.over, function(d){
                if (!clicked) {
                  highlight = d[id_var];
                  update();
                }
              })
              .on(vizwhiz.evt.click, function(d){
                highlight = d[id_var];
                zoom(highlight);
                update();
              });
          
          // Draw Main Center Node and BG
          highlight_group.selectAll("circle.center_bg")
            .data([center]).enter()
            .append("circle")
              .attr("class","center_bg")
              .call(size_bgs)
              .attr("fill",select_color);
          highlight_group.selectAll("circle.center")
            .data([center]).enter()
            .append("circle")
              .attr("class","center")
              .call(size_nodes)
              .call(color_nodes)
              .on(vizwhiz.evt.out, function(d){
                if (!clicked) {
                  highlight = null;
                  update();
                }
              })
              .on(vizwhiz.evt.click, function(d){
                if (!clicked) {
                  zoom(highlight);
                  clicked = true;
                  update();
                } else {
                  zoom("reset");
                  clicked = false;
                  update();
                }
              })
              
          // Draw Info Panel
          var d = data[highlight]
          if (scale.x(connections[highlight].extent.x[1]) > (width-info_width-5)) var x_pos = 37
          else var x_pos = width-info_width
          var bg = info_group.append("rect")
            .attr("width",info_width+"px")
            .attr("height",height-10+"px")
            .attr("y","5px")
            .attr("x",(x_pos-5)+"px")
            .attr("ry","3")
            .attr("fill","#dddddd")
          var text = info_group.append("text")
            .attr("y","8px")
            .attr("x",x_pos+"px")
            .attr("fill","#333333")
            .attr("text-anchor","start")
            .style("font-weight","bold")
            .attr("font-size","14px")
            .attr("font-family","Helvetica")
            .each(function(dd){vizwhiz.utils.wordWrap(d[text_var],this,info_width-10,info_width,false)})
          if (!clicked) {
            text.append("tspan")
              .attr("dy","14px")
              .attr("font-size","10px")
              .attr("x",x_pos+"px")
              .style("font-weight","normal")
              .text("Click Node for More Info")
            bg.attr("height",(text.node().getBBox().height+10)+"px")
          } else {
            for (var id in d) {
              if ([text_var,"color","text_color","active"].indexOf(id) < 0) {
                text.append("tspan")
                  .attr("dy","14px")
                  .attr("font-size","12px")
                  .attr("x",x_pos+"px")
                  .style("font-weight","normal")
                  .text(id+": "+d[id])
              }
            }
            var y = (text.node().getBBox().height+15)
            var primary_title = info_group.append("text")
              .attr("x",x_pos+"px")
              .attr("y",y+"px")
              .attr("dy","18px")
              .attr("fill","#333333")
              .attr("text-anchor","start")
              .attr("font-size","12px")
              .attr("font-family","Helvetica")
              .attr("x",x_pos+"px")
              .style("font-weight","bold")
              .text("Primary Connections")
                  
            y += primary_title.node().getBBox().height+5
            var prims = [], trunc = false
            connections[highlight].primary.nodes.forEach(function(c){
              prims.push(c[id_var])
            })
            prims.forEach(function(c,i){
              if (!trunc) {
                info_group.append("circle")
                  .attr("cx",(x_pos+5)+"px")
                  .attr("cy",(y+8)+"px")
                  .attr("r",5)
                  .attr("fill", function(){
                    var color = data[c].color ? data[c].color : vizwhiz.utils.rand_color()
                    if (data[c].active) {
                      return color;
                    } else {
                      color = d3.hsl(color)
                      color.l = 0.98
                      return color.toString()
                    }
                  })
                  .attr("stroke", function(){
                    var color = data[c].color ? data[c].color : vizwhiz.utils.rand_color()
                    if (data[c].active) return d3.rgb(color).darker().darker().toString();
                    else return d3.rgb(color).darker().toString()
                  })
                  .attr("stroke-width", function(){
                    if(data[c].active) return 2;
                    else return 1;
                  })
                var temp_title = info_group.append("text")
                  .attr("x",(x_pos+13)+"px")
                  .attr("y",y+"px")
                  .attr("fill","#333333")
                  .attr("text-anchor","start")
                  .attr("font-size","12px")
                  .attr("font-family","Helvetica")
                  .style("font-weight","normal")
                  .on(vizwhiz.evt.over,function(){
                    d3.select(this).attr("fill",highlight_color).style("cursor","pointer")
                  })
                  .on(vizwhiz.evt.out,function(){
                    d3.select(this).attr("fill","#333333")
                  })
                  .on(vizwhiz.evt.click,function(){
                    highlight = c;
                    zoom(highlight);
                    update();
                  })
                  .each(function(dd){vizwhiz.utils.wordWrap(data[c][text_var],this,info_width-10,info_width,false)})
                y += temp_title.node().getBBox().height
                if (y > height-40) trunc = true
              }
            })
            bg.attr("height",y+"px")
          }
          
        } else {
          node.call(color_nodes)
        }
        
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
          } else if (direction == "out") {
            if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
            else multiplier = 0.5
          } else if (connections[direction]) {
            var x_bounds = [scale.x(connections[direction].extent.x[0]),scale.x(connections[direction].extent.x[1])],
                y_bounds = [scale.y(connections[direction].extent.y[0]),scale.y(connections[direction].extent.y[1])]
                
            if (x_bounds[1] > (width-info_width-5)) var offset_left = info_width+32
            else var offset_left = 0
                
            var w_zoom = (width-info_width-10)/(x_bounds[1]-x_bounds[0]),
                h_zoom = height/(y_bounds[1]-y_bounds[0])
            
            if (w_zoom < h_zoom) {
              x_bounds = [x_bounds[0]-(max_size*2),x_bounds[1]+(max_size*2)]
              evt_scale = (width-info_width-10)/(x_bounds[1]-x_bounds[0])
              if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
              offset_x = -(x_bounds[0]*evt_scale)
              offset_y = -(y_bounds[0]*evt_scale)+((height-((y_bounds[1]-y_bounds[0])*evt_scale))/2)
            } else {
              y_bounds = [y_bounds[0]-(max_size*2),y_bounds[1]+(max_size*2)]
              evt_scale = height/(y_bounds[1]-y_bounds[0])
              if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
              offset_x = -(x_bounds[0]*evt_scale)+(((width-info_width-10)-((x_bounds[1]-x_bounds[0])*evt_scale))/2)
              offset_y = -(y_bounds[0]*evt_scale)
            }

            translate = [offset_x+offset_left,offset_y]
          } else if (direction == "reset") {
            translate = [0,0]
            evt_scale = 1
          }
          
          if (direction == "in" || direction == "out") {
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
          }
        
        }
        
        zoom_behavior.translate(translate).scale(evt_scale)
        
        // Auto center visualization
        if (translate[0] > 0) translate[0] = 0
        else if (translate[0] < -((width*evt_scale)-width)) {
          translate[0] = -((width*evt_scale)-width)
        }
        if (translate[1] > 0) translate[1] = 0
        else if (translate[1] < -((height*evt_scale)-height)) translate[1] = -((height*evt_scale)-height)
        if (d3.event.scale) {
          if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
            d3.select(".viz")
              .attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
          } else {
            d3.select(".viz").transition().duration(timing)
              .attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
          }
        } else {
          d3.select(".viz").transition().duration(timing*4)
            .attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
        }
        
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

  chart.nodes = function(x) {
    if (!arguments.length) return nodes;
    nodes = x;
    x_range = d3.extent(d3.values(nodes), function(d){return d.x});
    y_range = d3.extent(d3.values(nodes), function(d){return d.y});
    aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0]);
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
      var node_check = connections[c].primary.nodes.concat(connections[c].secondary.nodes).concat([connections[c].center])
      connections[c].extent = {}
      connections[c].extent.x = d3.extent(d3.values(node_check),function(v){return v.x;}),
      connections[c].extent.y = d3.extent(d3.values(node_check),function(v){return v.y;})
    }
    return chart;
  };

  chart.spotlight = function(x) {
    if (!arguments.length) return spotlight;
    spotlight = x;
    return chart;
  };

  chart.highlight = function(x) {
    if (!arguments.length) return highlight;
    highlight = x;
    if (highlight) clicked = true;
    else clicked = false;
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

  //===================================================================


  return chart;
};
vizwhiz.viz.stacked = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 5, right: 40, bottom: 20, left: 120},
    width = window.innerWidth,
    height = window.innerHeight,
    size = {
      "width": width-margin.left-margin.right,
      "height": height-margin.top-margin.bottom,
      "x": margin.left,
      "y": margin.top
    },
    depth = null,
    value_var = null,
    id_var = null,
    text_var = null,
    xaxis_var = null,
    xaxis_label = "",
    yaxis_label = "",
    nesting = [],
    dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

  //===================================================================


  function chart(selection) {
    selection.each(function(data) {
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // INIT vars & data munging
      //-------------------------------------------------------------------
      
      // get unique values for xaxis
      xaxis_vals = data
        .reduce(function(a, b){ return a.concat(b.year) }, [])
        .filter(function(value, index, self) { 
          return self.indexOf(value) === index;
        })
      
      // nest data properly according to nesting array
      nested_data = nest_data(xaxis_vals, data);
      
      // get max total for sums of each year
      var data_max = d3.max(d3.nest()
        .key(function(d){return d.year})
        .rollup(function(leaves){
          return d3.sum(leaves, function(d){return d[value_var];})
        })
        .entries(data), function(d){ return d.values; });
      
      // scales for both X and Y values
      var x_scale = d3.scale.linear()
        .domain([xaxis_vals[0], xaxis_vals[xaxis_vals.length-1]]).range([0, size.width]);
      // **WARNING reverse scale from 0 - max converts from height to 0 (inverse)
      var y_scale = d3.scale.linear()
        .domain([0, data_max]).range([size.height, 0]);
      
      // Helper function unsed to convert stack values to X, Y coords 
      var area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return x_scale(parseInt(d.key)); })
        .y0(function(d) { return y_scale(d.y0); })
        .y1(function(d) { return y_scale(d.y0 + d.y); });
      
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height)
      
      // container for the visualization
      var viz_enter = svg_enter.append("g").attr("class", "viz")
        .attr("transform", "translate(" + size.x + "," + size.y + ")")

      // add grey background for viz
      viz_enter.append("rect")
        .style('stroke','#000')
        .style('stroke-width',1)
        .style('fill','#efefef')
        .attr("class","background")
        .attr('width', size.width)
        .attr('height', size.height)
        .attr('x',0)
        .attr('y',0)
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // X AXIS
      //-------------------------------------------------------------------
      
      // enter
      var xaxis_enter = viz_enter.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + size.height + ")")
      
      // update
      d3.select(".xaxis").call(x_axis.scale(x_scale).ticks(xaxis_vals.length))
      
      // label
      xaxis_enter.append('text')
        .attr('width', size.width)
        .attr('x', size.width/2)
        .attr('y', 60)
        .attr('class', 'axis_title x')
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("font-family", "Helvetica")
        .attr("fill", "#4c4c4c")
        .text(xaxis_label)
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Y AXIS
      //-------------------------------------------------------------------
      
      // enter
      var yaxis_enter = viz_enter.append("g")
        .attr("class", "yaxis")
      
      // update
      d3.select(".yaxis").call(y_axis.scale(y_scale))
      
      // label
      yaxis_enter.append('text')
        .attr('width', size.width)
        .attr('class', 'axis_title y')
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("font-family", "Helvetica")
        .attr("fill", "#4c4c4c")
        .attr("transform", "translate(" + (-size.x+25) + "," + (size.y+size.height/2) + ") rotate(-90)")
        .text(yaxis_label)
      
      //===================================================================
      
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // LAYERS
      //-------------------------------------------------------------------
      
      // Get layers from d3.stack function (gives x, y, y0 values)
      var layers = stack(nested_data)
      
      // give data with key function to variables to draw
      var paths = d3.select("g.viz").selectAll(".layer")
        .data(layers, function(d){ return d.key; })
      
      // enter new paths, could be next level deep or up a level
      paths.enter().append("path")
        .attr("class", "layer")
        .attr("fill-opacity", 0.8)
        .attr("stroke-width",1)
        .attr("stroke", "#ffffff")
        .attr("fill", function(d){
          return d.color
        })
        .attr("d", function(d) {
          return area(d.values);
        })
      
      // update
      paths
        .attr("fill", function(d){
          return d.color
        })
        .attr("d", function(d) {
          return area(d.values);
        })
      
      // exit
      paths.exit().remove()
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // TEXT LAYERS
      //-------------------------------------------------------------------
      
      var defs = svg_enter.append('svg:defs')
      vizwhiz.utils.drop_shadow(defs)
      
      // filter layers to only the ones with a height larger than 6% of viz
      var text_layers = [];
      var text_height_scale = d3.scale.linear().range([0, 1]).domain([0, data_max]);
      layers.forEach(function(layer){
        
        // find out which is the largest
        var tallest = d3.max(layer.values, function(d){ return d.y; });
        tallest = layer.values.filter(function(d){ return d.y == tallest; })[0]
        
        // if the height is taller than 6% of the viz height add it to the list
        if(text_height_scale(tallest.y) > 0.06){
          // tallest["id"] = layer.key;
          layer.tallest = tallest;
          text_layers.push(layer)
        }
      })
      
      // give data with key function to variables to draw
      var texts = d3.select("g.viz").selectAll(".label")
        .data(text_layers, function(d){ return d.key; })
      
      // enter new paths, could be next level deep or up a level
      texts.enter().append("text")
        .attr('filter', 'url(#dropShadow)')
        .attr("class", "label")
        .style("font-weight","bold")
        .attr("font-size","14px")
        .attr("font-family","Helvetica")
        .attr("x", function(d){
          var pad = 0;
          // determine the index of the tallest item
          var values_index = d.values.indexOf(d.tallest)
          // if first, push it off 10 pixels from left side
          if(values_index == 0) pad += 10;
          // if last, push it off 10 pixels from right side
          if(values_index == d.values.length-1) pad -= 10;
          return x_scale(d.tallest.key) + pad;
        })
        .attr("dy", 6)
        .attr("y", function(d){
          var height = size.height - y_scale(d.tallest.y)
          return y_scale(d.tallest.y0 + d.tallest.y) + (height/2);
        })
        .attr("text-anchor", function(d){
          // determine the index of the tallest item
          var values_index = d.values.indexOf(d.tallest)
          // if first, left-align text
          if(values_index == 0) return "start";
          // if last, right-align text
          if(values_index == d.values.length-1) return "end";
          // otherwise go with middle
          return "middle"
        })
        .attr("fill", function(d){
          return "white"
        })
        .text(function(d) {
          return d[nesting[nesting.length-1]]
        })
        .each(function(d){
          // set usable width to 2x the width of each x-axis tick
          var tick_width = (size.width / xaxis_vals.length) * 2;
          // if the text box's width is larger than the tick width wrap text
          if(this.getBBox().width > tick_width){
            // first remove the current text
            d3.select(this).text("")
            // figure out the usable height for this location along x-axis
            var height = size.height-y_scale(d.tallest.y)
            // wrap text WITHOUT resizing
            vizwhiz.utils.wordWrap(d[nesting[nesting.length-1]], this, tick_width, height, false)
            // reset Y to compensate for new multi-line height
            var offset = (height - this.getBBox().height) / 2;
            // top of the element's y attr
            var y_top = y_scale(d.tallest.y0 + d.tallest.y);
            d3.select(this).attr("y", y_top + offset)
          }
        })
      
      // exit
      texts.exit().remove()
      
      //===================================================================
      
      
      // Draw foreground bounding box
      viz_enter.append('rect')
        .style('stroke','#000')
        .style('stroke-width',1*2)
        .style('fill','none')
        .attr('class', "border")
        .attr('width', size.width)
        .attr('height', size.height)
        .attr('x',0)
        .attr('y',0)
      
      // Always bring to front
      d3.select("rect.border").node().parentNode.appendChild(d3.select("rect.border").node())
      
    });

    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Nest data function (needed for getting flat data ready for stacks)
  //-------------------------------------------------------------------
  
  function nest_data(xaxis_vals, data){
    var nest_key = nesting[nesting.length-1];
    var info_lookup = {};
    
    var nested = d3.nest()
      .key(function(d){ return d[nest_key]; })
      .rollup(function(leaves){
        info_lookup[leaves[0][nest_key]] = JSON.parse(JSON.stringify(leaves[0]))
        delete info_lookup[leaves[0][nest_key]][xaxis_var]
        delete info_lookup[leaves[0][nest_key]][value_var]
        
        var values = d3.nest()
          .key(function(d){ return d.year; })
          .rollup(function(l) { return d3.sum(l, function(d){ return d[value_var]})})
          .entries(leaves)
        
        // Make sure all years at least have 0 values
        years_available = values
          .reduce(function(a, b){ return a.concat(b.key)}, [])
          .filter(function(y, i, arr) { return arr.indexOf(y) == i })
        
        xaxis_vals.forEach(function(y){
          if(years_available.indexOf(""+y) < 0){
            values.push({"key": ""+y, "values": 0})
          }
        })

        return values.sort(function(a,b){return a.key-b.key;});
      })
      .entries(data)
    
    nested.forEach(function(d, i){
      d["total"] = d3.sum(d.values, function(dd){ return dd.values; })
      nested[i] = vizwhiz.utils.merge(d, info_lookup[d.key]);
    })
    return nested
    
    return nested.sort(function(a,b){
      if(a[sort]<b[sort]) return -1;
      if(a[sort]>b[sort]) return 1;
      return 0;
    });
    
  }

  //===================================================================

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper function used to create stack polygon
  //-------------------------------------------------------------------
  
  var stack = d3.layout.stack()
    .offset("zero")
    .values(function(d) { return d.values; })
    .x(function(d) { return parseInt(d.key); })
    .y(function(d) { return d.values; });
  
  //===================================================================
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X & Y Axis formatting help
  //-------------------------------------------------------------------
  
  var x_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('bottom')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 1)
        .attr("y2", 10)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      return d
    });
  
  var y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('left')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0+1)
        .attr("x2", 0+size.width-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1/2)
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", -10)
        .attr("x2", 0-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      return vizwhiz.utils.format_num(d, false, 3, true)
    });

  //===================================================================

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
  
  chart.depth = function(x) {
    if (!arguments.length) return depth;
    depth = x;
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
  
  chart.xaxis_var = function(x) {
    if (!arguments.length) return xaxis_var;
    xaxis_var = x;
    return chart;
  };
  
  chart.xaxis_label = function(x) {
    if (!arguments.length) return xaxis_label;
    xaxis_label = x;
    return chart;
  };
  
  chart.yaxis_label = function(x) {
    if (!arguments.length) return yaxis_label;
    yaxis_label = x;
    return chart;
  };
  
  chart.nesting = function(x) {
    if (!arguments.length) return nesting;
    nesting = x;
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
vizwhiz.viz.tree_map = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = window.innerWidth,
    height = window.innerHeight,
    depth = null,
    value_var = "value",
    id_var = "id",
    text_var = "name",
    nesting = null,
    dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

  //===================================================================


  function chart(selection) {
    selection.each(function(data) {
      
      var cloned_data = JSON.parse(JSON.stringify(data));
      
      var nested_data = vizwhiz.utils.nest(cloned_data, nesting)
      
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([nested_data]);
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
        .value(function(d) { return value_var ? d[value_var] : d.value; })
        .nodes(nested_data)
        .filter(function(d) { return !d.children; });
      
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
          
      d3.select("#clipping rect").transition(750)
        .attr("width",width)
        .attr("height",height)
        
      svg_enter.append("g")
        .attr("class", "viz")
        // .attr("transform", function(d){ return "translate("+(stroke_width/2)+", "+height+")"; })
        .attr("clip-path","url(#clipping)")
      
      var cell = d3.select("g.viz").selectAll("g")
        .data(tmap_data, function(d){ return id_var ? d[id_var] : d.id; })
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New cells enter, initialize them here
      //-------------------------------------------------------------------
      
      // cell aka container
      var cell_enter = cell.enter().append("g")
        .attr("transform", function(d) {
          return "translate(" + d.x/2 + "," + d.y/2 + ")"; 
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
      
      // text (name)
      cell_enter.append("text")
        .attr("text-anchor","start")
        .style("font-weight","bold")
        .attr("font-family","Helvetica")
        .attr('class','name')
        .attr('x','0.2em')
        .attr('y','0em')
        .attr('dy','1em')
        .attr("fill", function(d){
          if(d.text_color) return d.text_color
          return d3.hsl(d.color).l > 0.6 ? "#333" : "#fff";
        })
        .each(function(d){
          var text = text_var ? d[text_var] : d.name;
          if(text){
            vizwhiz.utils.wordWrap(text, this, d.dx, d.dy, true)
          }
        })
      
      // text (share)
      cell_enter.append("text")
        .attr('class','share')
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-family","Helvetica")
        .attr("fill", function(d){
          if(d.text_color) return d.text_color
          return d3.hsl(d.color).l > 0.6 ? "#333" : "#fff";
        })
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
      
      // need to perform updates in "each" clause so that new data is 
      // propogated down to rects and text elements
      cell
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .each(function(g_data) {
          
          // update rectangles
          d3.select(this).selectAll("rect")
            .attr('width', function() {
              return g_data.dx+'px'
            })
            .attr('height', function() { 
              return g_data.dy+'px'
            })
          
          // text (name)
          d3.select(this).selectAll("text.name")
            .each(function(){
              // need to recalculate word wrapping because dimensions have changed
              var text = text_var ? g_data[text_var] : g_data.name;
              if(text){
                // vizwhiz.utils.wordWrap(text, this, g_data.dx, g_data.dy, true)
              }
            })
          
          // text (share)
          d3.select(this).selectAll("text.share")
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
      // Exis, get rid of old cells
      //-------------------------------------------------------------------
      
      cell.exit().remove()

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
  
  chart.depth = function(x) {
    if (!arguments.length) return depth;
    depth = x;
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
  
  chart.nesting = function(x) {
    if (!arguments.length) return nesting;
    nesting = x;
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
};vizwhiz.viz.geo_map = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = 300,
      height = 300,
      value_var = "value",
      id_var = "id",
      text_var = "name",
      clicked = false,
      highlight = null,
      timing = 500,
      zoom_timing = null,
      coords = null,
      shape = null,
      terrain = true,
      background = null,
      default_opacity = 0.25,
      select_opacity = 0.75,
      land_style = {"fill": "#F1EEE8"},
      water_color = "#B5D0D0",
      stroke_width = 1,
      color_gradient = ["#00008f", "#003fff", "#00efff", "#ffdf00", "#ff3000", "#7f0000"];

  //===================================================================


  function chart(selection) {
    selection.each(function(data, i) {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Private Variables
      //-------------------------------------------------------------------
      
      var this_selection = this,
          dragging = false,
          info_width = 300,
          projection = d3.geo.mercator()
            .scale(width)
            .translate([width/2,height/2]),
          path = d3.geo.path().projection(projection),
          zoom_behavior = d3.behavior.zoom()
            .scale(projection.scale())
            .scaleExtent([width, 1 << 23])
            .translate(projection.translate())
            .on("zoom",zoom),
          tile = d3.geo.tile().size([width, height]),
          old_scale = projection.scale(),
          old_translate = projection.translate();
          

      if (data) {
        data_extent = d3.extent(d3.values(data),function(d){
          return d[value_var] && d[value_var] != 0 ? d[value_var] : null
        })
        var data_range = [],
            step = 0.0
        while(step <= 1) {
          data_range.push((data_extent[0]*Math.pow((data_extent[1]/data_extent[0]),step)))
          step += 0.2
        }
        var value_color = d3.scale.log()
          .domain(data_range)
          .interpolate(d3.interpolateRgb)
          .range(color_gradient)
      }

      //===================================================================
      
      // Select the svg element, if it exists.
      var svg = d3.select(this_selection).selectAll("svg").data([data]);
      
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height)
        .style("z-index", 10)
        .style("position","absolute");
        
      if (background) {
            
        svg_enter.append("rect")
          .attr("width",width)
          .attr("height",height)
          .attr("fill",water_color);
          
        svg_enter.append("g")
          .attr("class","viz")
            .append("path")
              .datum(topojson.object(background, background.objects.land))
              .attr("id","land")
              .attr("d",path)
              .attr(land_style)
            
      }
          
      if (terrain) {
        var tile_group = svg_enter.append('g')
          .attr('class','tiles');
          
        update_tiles();
      }
        
      // Create viz group on svg_enter
      var viz_enter = svg_enter.append('g')
        .call(zoom_behavior)
        .on(vizwhiz.evt.down,function(d){dragging = true})
        .on(vizwhiz.evt.up,function(d){dragging = false})
        .append('g')
          .attr('class','viz');
        
      viz_enter.append("rect").attr("class", "overlay");
      
      
      var v = 44;
      
      
      
    });
    
    return chart;
    
  }

  return chart;
};
vizwhiz.viz.pie_scatter = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 20, right: 40, bottom: 80, left: 120},
    width = window.innerWidth,
    height = window.innerHeight,
    size = {
      "width": width-margin.left-margin.right,
      "height": height-margin.top-margin.bottom,
      "x": margin.left,
      "y": margin.top
    },
    depth = null,
    value_var = null,
    id_var = null,
    text_var = null,
    xaxis_var = null,
    xaxis_label = "",
    yaxis_var = null,
    yaxis_label = "",
    size_var = null,
    nesting = [],
    stroke = 2,
    dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

  //===================================================================


  function chart(selection) {
    selection.each(function(data) {
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // INIT vars & data munging
      //-------------------------------------------------------------------
      
      // first clone input so we know we are working with fresh data
      var cloned_data = JSON.parse(JSON.stringify(data));
      // nest the flat data by nesting array
      var nested_data = vizwhiz.utils.nest(cloned_data, nesting, true,
          [{"key":"complexity", "agg":"avg"}, {"key":"distance", "agg":"avg"}]);
      // console.log(nested_data.length)
      // return
      
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height)
      
      // container for the visualization
      var viz_enter = svg_enter.append("g").attr("class", "viz")
        .attr("transform", "translate(" + size.x + "," + size.y + ")")

      // add grey background for viz
      viz_enter.append("rect")
        .style('stroke','#000')
        .style('stroke-width',1)
        .style('fill','#efefef')
        .attr("class","background")
        .attr('width', size.width)
        .attr('height', size.height)
        .attr('x',0)
        .attr('y',0)      
      
        var size_scale = d3.scale.linear()
          .domain(d3.extent(nested_data, function(d){ return d[size_var]; }))
          .range([10, d3.min([width,height])/10])
          .nice()

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // X AXIS
      //-------------------------------------------------------------------
      var x_scale = d3.scale.linear()
        .domain(d3.extent(nested_data, function(d){ return d[xaxis_var]; }))
        .range([0, size.width])
        .nice()
      
      // enter
      var xaxis_enter = viz_enter.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + size.height + ")")
      
      // update
      d3.select(".xaxis").call(x_axis.scale(x_scale))
      
      // label
      xaxis_enter.append('text')
        .attr('width', size.width)
        .attr('x', size.width/2)
        .attr('y', 60)
        .attr('class', 'axis_title x')
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("font-family", "Helvetica")
        .attr("fill", "#4c4c4c")
        .text(xaxis_label)
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Y AXIS
      //-------------------------------------------------------------------
      
      var y_scale = d3.scale.linear()
        .domain(d3.extent(nested_data, function(d){ return d[yaxis_var]; }).reverse())
        .range([0, size.height])
        .nice()
        
      // enter
      var yaxis_enter = viz_enter.append("g")
        .attr("class", "yaxis")
      
      // update
      d3.select(".yaxis").call(y_axis.scale(y_scale))
      
      // label
      yaxis_enter.append('text')
        .attr('width', size.width)
        .attr('class', 'axis_title y')
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("font-family", "Helvetica")
        .attr("fill", "#4c4c4c")
        .attr("transform", "translate(" + (-size.x+25) + "," + (size.y+size.height/2) + ") rotate(-90)")
        .text(yaxis_label)
      
      //===================================================================
      
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // NODES
      //-------------------------------------------------------------------
      
      var arc = d3.svg.arc()
        .innerRadius(0)
        .startAngle(0)
      
      var has_children = nested_data[0].num_children ? true : false;
      
      var nodes = d3.select("g.viz")
        .selectAll("g.circle")
        .data(nested_data, function(d){ return d[nesting[nesting.length-1]]; })
      
      var nodes_enter = nodes.enter().append("g")
        .attr("class", "circle")
        .attr("transform", function(d) { return "translate("+x_scale(d[xaxis_var])+","+y_scale(d[yaxis_var])+")" } )
      
      nodes_enter
        .append("circle")
        .style('stroke', function(d){ return d.color })
        .style('stroke-width', 3)
        .style('fill', function(d){ return d.color })
        .style("fill-opacity", function(d) {
          return d.active ? 0.75 : 0.25;
        })
        .attr("r", function(d){ 
          return size_scale(d[size_var]);
        })
      

      nodes_enter
        .append("path")
        .style('fill', function(d){ return d.color })
        .style("fill-opacity", 1)
      
      // update
      nodes
        .attr("transform", function(d) { return "translate("+x_scale(d[xaxis_var])+","+y_scale(d[yaxis_var])+")" } )
      
      nodes.selectAll("circle")
        .style('fill', function(d){ return d.color })
        .attr("r", function(d){ 
          return size_scale(d[size_var]);
        })
        .on("mouseover", function(d){ console.log(d); })
      
      nodes.selectAll("path")
        .attr("d", function(d){
          var angle = 0, radius = 0;
          if(d.num_children){
            angle = (((d.num_children_active / d.num_children)*360) * (Math.PI/180));
            radius = size_scale(d[size_var]);
          }
          return arc.endAngle(angle).outerRadius(radius)(d);
        })
      
      // exit
      nodes.exit().remove()
      
      //===================================================================
      
    });

    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Nest data function (needed for getting flat data ready for stacks)
  //-------------------------------------------------------------------
  
  function nest_data(xaxis_vals, data){
    var nest_key = nesting[nesting.length-1];
    var info_lookup = {};
    
    var nested = d3.nest()
      .key(function(d){ return d[nest_key]; })
      .rollup(function(leaves){
        info_lookup[leaves[0][nest_key]] = JSON.parse(JSON.stringify(leaves[0]))
        delete info_lookup[leaves[0][nest_key]][xaxis_var]
        delete info_lookup[leaves[0][nest_key]][value_var]
        
        var values = d3.nest()
          .key(function(d){ return d.year; })
          .rollup(function(l) { return d3.sum(l, function(d){ return d[value_var]})})
          .entries(leaves)
        
        // Make sure all years at least have 0 values
        years_available = values
          .reduce(function(a, b){ return a.concat(b.key)}, [])
          .filter(function(y, i, arr) { return arr.indexOf(y) == i })
        
        xaxis_vals.forEach(function(y){
          if(years_available.indexOf(""+y) < 0){
            values.push({"key": ""+y, "values": 0})
          }
        })

        return values.sort(function(a,b){return a.key-b.key;});
      })
      .entries(data)
    
    nested.forEach(function(d, i){
      d["total"] = d3.sum(d.values, function(dd){ return dd.values; })
      nested[i] = vizwhiz.utils.merge(d, info_lookup[d.key]);
    })
    return nested
    
    return nested.sort(function(a,b){
      if(a[sort]<b[sort]) return -1;
      if(a[sort]>b[sort]) return 1;
      return 0;
    });
    
  }

  //===================================================================

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper function used to create stack polygon
  //-------------------------------------------------------------------
  
  var stack = d3.layout.stack()
    .offset("zero")
    .values(function(d) { return d.values; })
    .x(function(d) { return parseInt(d.key); })
    .y(function(d) { return d.values; });
  
  //===================================================================
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X & Y Axis formatting help
  //-------------------------------------------------------------------
  
  var x_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('bottom')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0+stroke)
        .attr("y2", -size.height-stroke)
        .attr("stroke", "#ccc")
        .attr("stroke-width",stroke/2)
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 1)
        .attr("y2", 10)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      return d
    });
  
  var y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('left')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0+stroke)
        .attr("x2", 0+size.width-stroke)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width",stroke/2)
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", -10)
        .attr("x2", 0-stroke)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#4c4c4c")
        .attr("stroke-width",stroke)
      // return parseFloat(d.toFixed(3))
      return vizwhiz.utils.format_num(d, false, 3, true)
    });

  //===================================================================

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
  
  chart.depth = function(x) {
    if (!arguments.length) return depth;
    depth = x;
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
  
  chart.xaxis_var = function(x) {
    if (!arguments.length) return xaxis_var;
    xaxis_var = x;
    return chart;
  };
  
  chart.xaxis_label = function(x) {
    if (!arguments.length) return xaxis_label;
    xaxis_label = x;
    return chart;
  };
  
  chart.yaxis_var = function(x) {
    if (!arguments.length) return yaxis_var;
    yaxis_var = x;
    return chart;
  };
  
  chart.yaxis_label = function(x) {
    if (!arguments.length) return yaxis_label;
    yaxis_label = x;
    return chart;
  };
  
  chart.size_var = function(x) {
    if (!arguments.length) return size_var;
    size_var = x;
    return chart;
  };
  
  chart.nesting = function(x) {
    if (!arguments.length) return nesting;
    nesting = x;
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
})();