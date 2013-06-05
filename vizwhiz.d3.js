(function(){
var vizwhiz = window.vizwhiz || {};

vizwhiz.version = '0.0.1';
vizwhiz.dev = true //set false when in production

window.vizwhiz = vizwhiz;

vizwhiz.timing = 600; // milliseconds for animations

vizwhiz.tooltip = {}; // For the tooltip system
vizwhiz.utils = {}; // Utility subsystem
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
    val = d3.format(",."+sig_figs+"f")(val)
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
// Returns appropriate text color based off of a given color
//-------------------------------------------------------------------

vizwhiz.utils.text_color = function(color) {
  var hsl = d3.hsl(color),
      light = "#fff", 
      dark = "#333";
  if (hsl.l > 0.65) return dark;
  else if (hsl.l < 0.48) return light;
  return hsl.h > 35 && hsl.s >= 0.3 && hsl.l >= 0.41 ? dark : light;
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//-------------------------------------------------------------------
        
vizwhiz.utils.uniques = function(data,value) {
  return d3.nest().key(function(d) { 
    return d[value]
  }).entries(data).reduce(function(a,b,i,arr){ 
    return a.concat(parseInt(b['key'])) 
  },[])
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
      'name': obj.key.split("|")[1], 
      'id': obj.key.split("|")[0], 
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
// for SVGs word wrapping is not built in, so here we must creat this
// function ourselves
//-------------------------------------------------------------------

vizwhiz.utils.wordwrap = function(params) {
  
  var parent = params.parent,
      padding = params.padding ? params.padding : 10,
      width = params.width ? params.width-(padding*2) : 20000,
      height = params.height ? params.height : 20000,
      resize = params.resize,
      font_max = params.font_max ? params.font_max : 40,
      font_min = params.font_min ? params.font_min : 8;
      
  if (params.text instanceof Array) wrap(String(params.text.shift()).split(/[\s-]/))
  else wrap(String(params.text).split(/[\s-]/))
  
  function wrap(words) {
    
    if (resize) {
    
      // Start by trying the largest font size
      var size = font_max
      d3.select(parent).attr('font-size',size)
    
      // Add each word to it's own line (to test for longest word)
      d3.select(parent).selectAll('tspan').remove()
      for(var i=0; i<words.length; i++) {
        if (words.length == 1) var t = words[i]
        else var t = words[i]+"..."
        d3.select(parent).append('tspan').attr('x',0).text(t)
      }
    
      // If the longest word is too wide, make the text proportionately smaller
      if (parent.getBBox().width > width) size = size*(width/parent.getBBox().width)
  
      // If the new size is too small, return NOTHING
      if (size < font_min) {
        d3.select(parent).selectAll('tspan').remove();
        if (typeof params.text == "string" || params.text.length == 0) return;
        else wrap(String(params.text.shift()).split(/[\s-]/))
        return;
      }
    
      // Use new text size
      d3.select(parent).attr('font-size',size);
    
      // Flow text into box
      flow();
    
      // If text doesn't fit height-wise, shrink it!
      if (parent.childNodes.length*parent.getBBox().height > height) {
        var temp_size = size*(height/(parent.childNodes.length*parent.getBBox().height))
        if (temp_size < font_min) size = font_min
        else size = temp_size
        d3.select(parent).attr('font-size',size)
      } else finish();
    
    }
  
    flow();
    truncate();
    finish();
  
    function flow() {
    
      d3.select(parent).selectAll('tspan').remove()
    
      var tspan = d3.select(parent).append('tspan')
        .attr('x',parent.getAttribute('x'))
        .text(words[0])

      for (var i=1; i < words.length; i++) {
        
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
      while (parent.childNodes.length*parent.getBBox().height > height && parent.lastChild && !cut) {
        parent.removeChild(parent.lastChild)
        if (parent.childNodes.length*parent.getBBox().height < height && parent.lastChild) cut = true
      }
      if (cut) {
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
  
  function finish() {
    d3.select(parent).selectAll('tspan').attr("dy", d3.select(parent).style('font-size'));
    return;
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

//===================================================================
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.create = function(params) {
  
  if (!params.parent) {
    params.parent = d3.select("body").append("svg")
      .attr("id","tooltip")
      .style("position","absolute")
      .style("z-index",10000)
    if (params.width) params.parent.attr("width",params.width+"px")
    else params.parent.attr("width","200px")
  
    params.window_width = window.innerWidth
    params.window_height = window.innerHeight;
    
  } else {
    params.window_width = parseInt(params.parent.attr("width"),10);
    params.window_height = parseInt(params.parent.attr("height"),10);
  }
  
  params.width = params.width ? params.width : 200;
  params.offset = params.offset ? params.offset : 0;
  params.margin = 5;
  params.padding = 10;
  params.triangle_size = params.arrow ? 20 : 0;
  params.stroke_width = 2;
  params.id = params.id ? params.id : "default";
  
  var group = params.parent.append("g")
    .datum(params)
    .attr("class","vizwhiz_tooltip")
    .attr("id",function(d){ return "vizwhiz_tooltip_"+d.id; })
  
  var box = group.append("rect")
    .attr("width",function(d){ return d.width+"px"; })
    .attr("ry","3")
    .attr("rx","3")
    .attr("fill","white")
    .attr("stroke","#cccccc")
    .attr("stroke-width",function(d){ return d.stroke_width; })
  
  if (params.title) {
    var text = group.append("text")
      .attr("fill","#000000")
      .attr("font-size","16px")
      .style("font-weight","bold")
      .attr("x",function(d){ return d.padding+"px"; })
      .attr("y",function(d){ return (d.padding*0.75)+"px"; })
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .each(function(d){
        vizwhiz.utils.wordwrap({
          "text": d.title,
          "parent": this,
          "width": d.width-(d.padding*2)
        });
      })
      var y_offset = params.padding+text.node().getBBox().height
  } else var y_offset = params.padding
    
    
  if (params.description) {
    var text = group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .attr("x",function(d){ return d.padding+"px"; })
      .attr("y",y_offset+"px")
      .style("font-weight","normal")
      .each(function(d){
        vizwhiz.utils.wordwrap({
          "text": d.description,
          "parent": this,
          "width": d.width-(d.padding*2)
        });
      });
    y_offset += text.node().getBBox().height;
  }
  
  for (var id in params.data) {
    group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .style("font-weight","normal")
      .attr("x",function(d){ return d.padding+"px"; })
      .attr("y",y_offset+"px")
      .attr("dy","12px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .text(id+":")
      
    if (typeof params.data[id] == "number") {
      if (params.data[id] > 9999) var t = vizwhiz.utils.format_num(params.data[id], false, 2, true);
      else var t = vizwhiz.utils.format_num(params.data[id], false, 2, false);
    } else var t = params.data[id];
    
    var text = group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .style("font-weight","normal")
      .attr("x",function(d){ return d.width-d.padding+"px"; })
      .attr("y",y_offset+"px")
      .attr("dy","12px")
      .attr("text-anchor","end")
      .attr("font-family","Helvetica")
      .text(t)
    y_offset += text.node().getBBox().height;
  }
  
  if (params.appends) {
    if (params.appends.length > 0) y_offset += params.padding
    var truncate = false;
    params.appends.forEach(function(a){
      if (a.append && !truncate) {
        var text = append(group,a);
        y_offset += text.node().getBBox().height;
        if (y_offset > params.window_height-(params.margin*2)-(params.padding*2)) {
          y_offset -= text.node().getBBox().height;
          text.remove()
          truncate = true;
        }
      }
    })
  }
  
  var box_height = y_offset+params.padding
    
  box.attr("height",function(d){ 
    d.height = box_height;
    return d.height+"px";
  })
  
  if (d3.select("svg#tooltip")[0][0]) {
    d3.select("svg#tooltip")
      .datum(params)
      .attr("height",function(d){
        d.height = box_height;
        return (d.height+(d.triangle_size/2)+2)+"px";
      });
  }
  
  if (params.arrow) {
    group.append("line")
      .attr("class","arrow_line")
      .attr("stroke-width",function(d){ return d.stroke_width*2; })
      .attr("stroke","white");
    
    group.append("path")
      .attr("class","arrow")
      .attr("fill","white")
      .attr("stroke","#cccccc")
      .attr("stroke-width",function(d){ return d.stroke_width; });
  }
  
  vizwhiz.tooltip.move(params.x,params.y,params.id);
  
  function append(parent,obj) {
    var obj_x = obj.x || obj.cx ? obj.x : params.padding,
        obj_y = obj.y || obj.cy ? obj.y : y_offset
    var a = parent.append(obj.append)
    if (obj.append == "g") a.attr("transform","translate("+obj_x+","+obj_y+")")
    else if (obj.append == "circle") {
      if (!obj.cx) a.attr("cx",obj_x)
      if (!obj.cy) a.attr("cy",obj_y)
    }
    else {
      if (!obj.x) a.attr("x",obj_x)
      if (!obj.y) a.attr("y",obj_y)
    }
    for (var attr in obj) if (attr != "children" && attr != "events" && attr != "text") a[attr](obj[attr])
    if (obj.append == "text" && obj.text) a.each(function(dd){
      vizwhiz.utils.wordwrap({
        "text": obj.text,
        "parent": this,
        "width": params.width-(params.padding*2)
      });
    })
    if (obj.events) for (var evt in obj.events) a.on(evt,obj.events[evt])
    if (obj.children) obj.children.forEach(function(c){ var child = append(a,c); })
    return a;
  }

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Destroy Tooltips
//-------------------------------------------------------------------

vizwhiz.tooltip.remove = function(id) {
  
  if (d3.select("svg#tooltip")[0][0]) d3.select("svg#tooltip").remove();
  else if (id) d3.select("g#vizwhiz_tooltip_"+id).remove();
  else d3.selectAll("g.vizwhiz_tooltip").remove();

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get X and Y position for Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.move = function(x,y,id) {
  
  if (d3.select("svg#tooltip")[0][0]) {
    d3.select("svg#tooltip")
      .style("left",function(d){
        
        if (x-d.margin < d.width/2) var tooltip_x = d.margin
        else if (x+d.margin > d.window_width-(d.width/2)) var tooltip_x = d.window_width-d.width-d.margin
        else var tooltip_x = x-(d.width/2)
        
        return tooltip_x;
      
      })
      .style("top",function(d){
        
        if (y-d.offset-d.margin < d.height+d.triangle_size/2) {
          var tooltip_y = y+d.offset+(d.triangle_size/2)
          if (tooltip_y < d.margin) tooltip_y = d.margin;
        } else var tooltip_y = y-d.offset-d.height-(d.triangle_size/2)
        
        return tooltip_y;
        
      })
      .each(function(d){
        
        if (d.arrow) {
          
          if (y-d.offset-d.margin < d.height+d.triangle_size/2) {
            var tooltip_y = y+d.offset+(d.triangle_size/2),
                triangle_y = 0,
                p = "M "+(-d.triangle_size/2)+" 0 L 0 "+(-d.triangle_size/2)+" L "+(d.triangle_size/2)+" 0";
            if (tooltip_y < d.margin) tooltip_y = d.margin;
          } else {
            var tooltip_y = y-d.offset-d.height-(d.triangle_size/2),
                triangle_y = d.height,
                p = "M "+(-d.triangle_size/2)+" 0 L 0 "+(d.triangle_size/2)+" L "+(d.triangle_size/2)+" 0";
          }
  
          if (x-d.margin < d.width/2) var tooltip_x = d.margin
          else if (x+d.margin > d.window_width-(d.width/2)) var tooltip_x = d.window_width-d.width-d.margin
          else var tooltip_x = x-(d.width/2)
  
          var triangle_x = x-tooltip_x
          if (triangle_x < d.padding+d.triangle_size/2) var triangle_x = d.padding+d.triangle_size/2
          else if (triangle_x > d.width-d.padding-d.triangle_size/2) var triangle_x = d.width-d.padding-d.triangle_size/2
    
          d3.select(this).select("line.arrow_line")
            .attr("x1",(triangle_x-d.triangle_size/2+1))
            .attr("x2",(triangle_x+d.triangle_size/2-1))
            .attr("y1",triangle_y)
            .attr("y2",triangle_y);
    

          d3.select(this).select("path.arrow").attr("d",p)
            .attr("transform","translate("+triangle_x+","+triangle_y+")");
        }
        
      })
  } else {
    
    if (!id) var obj = d3.selectAll("g.vizwhiz_tooltip")
    else var obj = d3.selectAll("g#vizwhiz_tooltip_"+id)

    obj.attr("transform",function(d){
  
      if (y-d.offset-d.margin < d.height+d.triangle_size/2) {
        var tooltip_y = y+d.offset+(d.triangle_size/2),
            triangle_y = 0,
            p = "M "+(-d.triangle_size/2)+" 0 L 0 "+(-d.triangle_size/2)+" L "+(d.triangle_size/2)+" 0";
        if (tooltip_y < d.margin) tooltip_y = d.margin;
      } else {
        var tooltip_y = y-d.offset-d.height-(d.triangle_size/2),
            triangle_y = d.height,
            p = "M "+(-d.triangle_size/2)+" 0 L 0 "+(d.triangle_size/2)+" L "+(d.triangle_size/2)+" 0";
      }
  
      if (x-d.offset-d.margin < d.width/2) var tooltip_x = d.margin
      else if (x+d.offset+d.margin > d.window_width-(d.width/2)) var tooltip_x = d.window_width-d.width-d.margin
      else var tooltip_x = x-(d.width/2)
    
      if (d.arrow) {
  
        var triangle_x = x-tooltip_x
        if (triangle_x < d.padding+d.triangle_size/2) var triangle_x = d.padding+d.triangle_size/2
        else if (triangle_x > d.width-d.padding-d.triangle_size/2) var triangle_x = d.width-d.padding-d.triangle_size/2
    
        d3.select(this).select("line.arrow_line")
          .attr("x1",(triangle_x-d.triangle_size/2+1))
          .attr("x2",(triangle_x+d.triangle_size/2-1))
          .attr("y1",triangle_y)
          .attr("y2",triangle_y);
    

        d3.select(this).select("path.arrow").attr("d",p)
          .attr("transform","translate("+triangle_x+","+triangle_y+")");
      }
    
      return "translate("+tooltip_x+","+tooltip_y+")";
    })
    
  }

}

//===================================================================
vizwhiz.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var vars = {
    "active_var": "active",
    "arc_angles": {},
    "arc_inners": {},
    "arc_sizes": {},
    "boundries": null,
    "connections": null,
    "coords": null,
    "csv_columns": null,
    "csv_data": [],
    "depth": null,
    "donut": true,
    "filter": [],
    "group_bgs": true,
    "grouping": "name",
    "highlight": null,
    "id_var": "id",
    "init": true,
    "keys": [],
    "labels": true,
    "layout": "value",
    "links": null,
    "map": {"coords": null, 
            "style": {"land": {"fill": "#f9f4e8"}, 
                      "water": {"fill": "#bfd1df"}
                     }
           },
    "margin": {"top": 0, "right": 0, "bottom": 0, "left": 0},
    "name_array": null,
    "nesting": [],
    "nesting_aggs": {},
    "order": "asc",
    "projection": d3.geo.mercator(),
    "solo": [],
    "sort": "total",
    "spotlight": true,
    "sub_title": null,
    "svg_height": window.innerHeight,
    "svg_width": window.innerWidth,
    "text_var": "name",
    "tiles": true,
    "title": null,
    "tooltip_info": [],
    "total_bar": false,
    "type": "tree_map",
    "value_var": "value",
    "xaxis_domain": null,
    "xaxis_var": null,
    "yaxis_domain": null,
    "yaxis_var": null,
    "year": null,
    "years": null,
    "year_var": "year",
    "zoom_behavior": d3.behavior.zoom()
  }
  
  var links;
  
  //===================================================================

  chart = function(selection) {
    selection.each(function(data) {

      vars.parent = d3.select(this)
      
      vars.svg = vars.parent.selectAll("svg").data([data]);
      
      vars.svg_enter = vars.svg.enter().append("svg")
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
        .style("z-index", 10)
        .style("position","absolute");
    
      vars.svg.transition().duration(vizwhiz.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
        
      vars.years = vizwhiz.utils.uniques(data,vars.year_var)
      if (!vars.year) vars.year = vars.years[vars.years.length-1]

      vars.keys = {}
      var filtered_data = data.filter(function(d){
        for (k in d) {
          if (!vars.keys[k]) {
            vars.keys[k] = typeof d[k]
          }
        }
        if (vars.xaxis_var) {
          if (typeof d[vars.xaxis_var] == "undefined") return false
        }
        if (vars.yaxis_var) {
          if (typeof d[vars.yaxis_var] == "undefined") return false
        }
        if (vars.spotlight && vars.type == "pie_scatter") {
          if (d[vars.active_var]) return false
        }
        if (vars.year && vars.type != "stacked") return d[vars.year_var] == vars.year;
        return true;
      })
      
      // Filter & Solo the data!
      removed_ids = []
      if (vars.solo.length || vars.filter.length) {
        filtered_data = filtered_data.filter(function(d){
          var check = [d[vars.id_var],d[vars.text_var]]
          vars.nesting.forEach(function(key){
            for (x in d[key]) {
              check.push(d[key][x])
            }
          })
          var match = false
          if (d[vars.id_var] != vars.highlight || vars.type != "rings") {
            if (vars.solo.length) {
              check.forEach(function(c){
                if (vars.solo.indexOf(c) >= 0) match = true;
              })
              if (match) return true
              removed_ids.push(d[vars.id_var])
              return false
            }
            else {
              check.forEach(function(c){
                if (vars.filter.indexOf(c) >= 0) match = true;
              })
              if (match) {
                removed_ids.push(d[vars.id_var])
                return false
              }
              return true
            }
          }
          else {
            return true
          }
        })
      }
      
      // create CSV data
      vars.csv_data = filtered_data;
      
      var total_val = d3.sum(filtered_data, function(d){ 
        return d[vars.value_var] 
      })
      if (!vars.total_bar) var total_val = null
        
      if (["tree_map","pie_scatter"].indexOf(vars.type) >= 0) {
        var cleaned_data = nest(filtered_data)
      }
      else if (vars.type == "stacked") {
        var temp_data = []
        vars.years.forEach(function(year){
          var year_data = filtered_data.filter(function(d){
            return d[vars.year_var] == year;
          })
          year_data = nest(year_data)
          temp_data = temp_data.concat(year_data)
        })
        cleaned_data = temp_data
      }
      else if (vars.type == "geo_map") {
        cleaned_data = {};
        filtered_data.forEach(function(d){
          cleaned_data[d[vars.id_var]] = d;
        })
      }
      else {
        cleaned_data = filtered_data
      }
      
      if (["network","rings"].indexOf(vars.type) >= 0) {
        vars.links = links.filter(function(l){
          if (removed_ids.indexOf(l.source[vars.id_var]) >= 0
           || removed_ids.indexOf(l.target[vars.id_var]) >= 0) {
            return false;
          }
          else {
            return true;
          }
        })
        vars.connections = get_connections(vars.links)
      }
      
      vars.width = vars.svg_width;
      
      vars.margin.top = 0;
      if (vars.svg_width < 300 || vars.svg_height < 200) {
        vars.small = true;
        make_title(null,"title");
        make_title(null,"sub_title");
        make_title(null,"total_bar");
      }
      else {
        vars.small = false;
        make_title(vars.title,"title");
        make_title(vars.sub_title,"sub_title");
        make_title(total_val,"total_bar");
      }
      
      if (vars.margin.top > 0) vars.margin.top += 3
      
      vars.height = vars.svg_height - vars.margin.top;
      
      vars.svg_enter.append("clipPath")
        .attr("id","clipping")
        .append("rect")
          .attr("width",vars.width)
          .attr("height",vars.height)
      
      vars.svg.select("#clipping rect").transition().duration(vizwhiz.timing)
        .attr("width",vars.width)
        .attr("height",vars.height)
    
      vars.parent_enter = vars.svg_enter.append("g")
        .attr("class","parent")
        .attr("width",vars.width)
        .attr("height",vars.height)
        .attr("clip-path","url(#clipping)")
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
    
      vars.svg.select("g.parent").transition().duration(vizwhiz.timing)
        .attr("width",vars.width)
        .attr("height",vars.height)
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
        
      vizwhiz[vars.type](cleaned_data,vars);
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper Functions
  //-------------------------------------------------------------------

  nest = function(flat_data) {
  
    var flattened = [];
    var nested_data = d3.nest();
    
    var levels = vars.depth ? vars.nesting.slice(0,vars.nesting.indexOf(vars.depth)+1) : vars.nesting
    
    levels.forEach(function(nest_key, i){
    
      nested_data
        .key(function(d){ return d[nest_key].id+"|"+d[nest_key].name; })
        
      if (i == levels.length-1) {
        nested_data.rollup(function(leaves){
          
          if(leaves.length == 1){
            flattened.push(leaves[0]);
            return leaves[0]
          }
          
          to_return = {
            "name": leaves[0][nest_key].name,
            "id": leaves[0][nest_key].id,
            "num_children": leaves.length,
            "num_children_active": d3.sum(leaves, function(d){ return d.active; })
          }
          
          if (leaves[0][nest_key].display_id) to_return.display_id = leaves[0][nest_key].display_id;
          
          for (key in vars.keys) {
            if (vars.nesting_aggs[key]) {
              to_return[key] = d3[vars.nesting_aggs[key]](leaves, function(d){ return d[key]; })
            }
            else {
              if (["color",vars.year_var].indexOf(key) >= 0) {
                to_return[key] = leaves[0][key];
              }
              else if (vars.keys[key] === "number") {
                to_return[key] = d3.sum(leaves, function(d){ return d[key]; })
              }
            }
          }
          
          if(vars.type != "tree_map"){
            levels.forEach(function(nk){
              to_return[nk] = leaves[0][nk]
            })
            flattened.push(to_return);
          }
        
          return to_return
        })
      }
    
    })
    
    nested_data = nested_data
      .entries(flat_data)
      .map(vizwhiz.utils.rename_key_value);

    if(vars.type != "tree_map"){
      return flattened;
    }

    return {"name":"root", "children": nested_data};

  }
  
  filter = function(d) {
    
  }
  
  mouseover = function(d){
    
    var svg = d3.select("svg");
    var tooltip_data = {}
    vars.tooltip_info.forEach(function(t){
      if (d[t]) tooltip_data[t] = d[t]
    })
    tooltip_data["Share"] = d.share;
    vizwhiz.tooltip.create({
      "parent": svg,
      "id": d[vars.id_var],
      "data": tooltip_data,
      "title": d[vars.text_var],
      "x": d3.mouse(svg.node())[0],
      "y": d3.mouse(svg.node())[1],
      "offset": 10,
      "arrow": true
    })
  }

  make_title = function(title,type){
    
    // Set the total value as data for element.
    var data = title ? [title] : [],
        font_size = type == "title" ? 18 : 13,
        font_color = type == "title" ? "#333" : "#666",
        total = vars.svg.selectAll("g."+type).data(data),
        title_position = {
          "x": vars.width/2,
          "y": vars.margin.top+font_size
        }
    
    // Enter
    total.enter().append("g")
      .attr("class",type)
      .style("opacity",0)
      .append("text")
        .attr(title_position)
        .attr("font-size",font_size)
        .attr("fill",font_color)
        .attr("text-anchor", "middle")
        .attr("font-family", "'Helvetica Neue', Helvetica, Arial, sans-serif")
        .style("font-weight", "bold")
        .text(function(d){
          var text = d, format = ",f";
          if (type == "total_bar") {
            if (vars.total_bar.format) {
              text = d3.format(vars.total_bar.format)(text);
            }
            else {
              text = d3.format(format)(text);
            }
            vars.total_bar.prefix ? text = vars.total_bar.prefix + text : null;
            vars.total_bar.suffix ? text = text + vars.total_bar.suffix : null;
          }
          return text;
        })
    
    // Update
    total.transition().duration(vizwhiz.timing)
      .style("opacity",1)
    total.select("text").transition().duration(vizwhiz.timing)
      .attr(title_position)
      .text(function(d){
        var text = d, format = ",f";
        if (type == "total_bar") {
          if (vars.total_bar.format) {
            text = d3.format(vars.total_bar.format)(text);
          }
          else {
            text = d3.format(format)(text);
          }
          vars.total_bar.prefix ? text = vars.total_bar.prefix + text : null;
          vars.total_bar.suffix ? text = text + vars.total_bar.suffix : null;
        }
        return text;
      })
    
    // Exit
    total.exit().transition().duration(vizwhiz.timing)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }
  
  get_connections = function(links) {
    var connections = {};
    links.forEach(function(d) {
      if (!connections[d.source[vars.id_var]]) {
        connections[d.source[vars.id_var]] = []
      }
      connections[d.source[vars.id_var]].push(d.target)
      if (!connections[d.target[vars.id_var]]) {
        connections[d.target[vars.id_var]] = []
      }
      connections[d.target[vars.id_var]].push(d.source)
    })
    return connections;
  }
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------
  
  chart.active_var = function(x) {
    if (!arguments.length) return vars.active_var;
    vars.active_var = x;
    return chart;
  };
  
  chart.csv_data = function(x) {
    if (!arguments.length) {
      var csv_to_return = []
      
      // filter out the columns (if specified)
      if(vars.csv_columns){
        vars.csv_data.map(function(d){
          d3.keys(d).forEach(function(d_key){
            if(vars.csv_columns.indexOf(d_key) < 0){
              delete d[d_key]
            }
          })
        })
      }
      
      csv_to_return.push(d3.keys(vars.csv_data[0]));
      vars.csv_data.forEach(function(d){
        csv_to_return.push(d3.values(d))
      })
      return csv_to_return;
    }
    return chart;
  };
  
  chart.csv_columns = function(x) {
    if (!arguments.length) return vars.csv_columns;
    vars.csv_columns = x;
    return chart;
  };
  
  chart.coords = function(x) {
    if (!arguments.length) return vars.coords;
    vars.coords = topojson.object(x, x.objects[Object.keys(x.objects)[0]]).geometries;
    vars.boundries = {"coordinates": [[]], "type": "Polygon"}
    vars.coords.forEach(function(v,i){
      v.coordinates.forEach(function(c){
        c.forEach(function(a){
          if (a.length == 2) vars.boundries.coordinates[0].push(a)
          else {
            a.forEach(function(aa){
              vars.boundries.coordinates[0].push(aa)
            })
          }
        })
      })
    })
    return chart;
  };
  
  chart.depth = function(x) {
    if (!arguments.length) return vars.depth;
    vars.depth = x;
    return chart;
  };

  chart.donut = function(x) {
    if (!arguments.length) return vars.donut;
    if (typeof x == "boolean")  vars.donut = x;
    else if (x === "false") vars.donut = false;
    else vars.donut = true;
    return chart;
  };

  chart.filter = function(x) {
    if (!arguments.length) return vars.filter;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      vars.filter = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(vars.filter.indexOf(x) > -1){
        vars.filter.splice(vars.filter.indexOf(x), 1)
      }
      // if element is in the solo array remove it and add to this one
      else if(vars.solo.indexOf(x) > -1){
        vars.solo.splice(vars.solo.indexOf(x), 1)
        vars.filter.push(x)
      }
      // element not in current filter so add it
      else {
        vars.filter.push(x)
      }
    }
    return chart;
  };

  chart.group_bgs = function(x) {
    if (!arguments.length) return vars.group_bgs;
    if (typeof x == "boolean")  vars.group_bgs = x;
    else if (x === "false") vars.group_bgs = false;
    else vars.group_bgs = true;
    return chart;
  };

  chart.grouping = function(x) {
    if (!arguments.length) return vars.grouping;
    vars.grouping = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return vars.svg_height;
    vars.svg_height = x;
    return chart;
  };
  
  chart.highlight = function(value) {
    if (!arguments.length) return vars.highlight;
    vars.highlight = value;
    return chart;
  };
  
  chart.id_var = function(x) {
    if (!arguments.length) return vars.id_var;
    vars.id_var = x;
    return chart;
  };

  chart.labels = function(x) {
    if (!arguments.length) return vars.labels;
    vars.labels = x;
    return chart;
  };
  
  chart.layout = function(x) {
    if (!arguments.length) return vars.layout;
    vars.layout = x;
    return chart;
  };
  
  chart.links = function(x) {
    if (!arguments.length) return vars.links;
    links = x;
    return chart;
  };
  
  chart.map = function(x,style) {
    if (!arguments.length) return vars.map;
    vars.map.coords = x;
    if (style) {
      vars.map.style.land = style.land ? style.land : map.style.land;
      vars.map.style.water = style.water ? style.water : map.style.water;
    }
    return chart;
  };
  
  chart.name_array = function(x) {
    if (!arguments.length) return vars.name_array;
    vars.name_array = x;
    return chart;
  };
  
  chart.nesting = function(x) {
    if (!arguments.length) return vars.nesting;
    vars.nesting = x;
    return chart;
  };
  
  chart.nesting_aggs = function(x) {
    if (!arguments.length) return vars.nesting_aggs;
    vars.nesting_aggs = x;
    return chart;
  };
  
  chart.order = function(x) {
    if (!arguments.length) return vars.order;
    vars.order = x;
    return chart;
  };
    
  chart.solo = function(x) {
    if (!arguments.length) return vars.solo;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      vars.solo = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(vars.solo.indexOf(x) > -1){
        vars.solo.splice(vars.solo.indexOf(x), 1)
      }
      // if element is in the filter array remove it and add to this one
      else if(vars.filter.indexOf(x) > -1){
        vars.filter.splice(vars.filter.indexOf(x), 1)
        vars.solo.push(x)
      }
      // element not in current filter so add it
      else {
        vars.solo.push(x)
      }
    }
    return chart;
  };
  
  chart.sort = function(x) {
    if (!arguments.length) return vars.sort;
    vars.sort = x;
    return chart;
  };

  chart.spotlight = function(x) {
    if (!arguments.length) return vars.spotlight;
    if (typeof x == "boolean")  vars.spotlight = x;
    else if (x === "false") vars.spotlight = false;
    else vars.spotlight = true;
    return chart;
  };
  
  chart.sub_title = function(x) {
    if (!arguments.length) return vars.sub_title;
    vars.sub_title = x;
    return chart;
  };
  
  chart.text_var = function(x) {
    if (!arguments.length) return vars.text_var;
    vars.text_var = x;
    return chart;
  };
  
  chart.tiles = function(x) {
    if (!arguments.length) return vars.tiles;
    if (typeof x == "boolean")  vars.tiles = x;
    else if (x === "false") vars.tiles = false;
    else vars.tiles = true;
    return chart;
  };
  
  chart.title = function(x) {
    if (!arguments.length) return vars.title;
    vars.title = x;
    return chart;
  };
  
  chart.tooltip_info = function(x) {
    if (!arguments.length) return vars.tooltip_info;
    vars.tooltip_info = x;
    return chart;
  };
  
  chart.total_bar = function(x) {
    if (!arguments.length) return vars.total_bar;
    vars.total_bar = x;
    return chart;
  };
  
  chart.type = function(x) {
    if (!arguments.length) return vars.type;
    vars.type = x;
    return chart;
  };
  
  chart.value_var = function(x) {
    if (!arguments.length) return vars.value_var;
    vars.value_var = x;
    return chart;
  };

  chart.width = function(x) {
    if (!arguments.length) return vars.svg_width;
    vars.svg_width = x;
    return chart;
  };
  
  chart.xaxis_domain = function(x) {
    if (!arguments.length) return vars.xaxis_domain;
    vars.xaxis_domain = x;
    return chart;
  };
  
  chart.xaxis_var = function(x) {
    if (!arguments.length) return vars.xaxis_var;
    vars.xaxis_var = x;
    return chart;
  };
  
  chart.yaxis_domain = function(x) {
    if (!arguments.length) return vars.yaxis_domain;
    vars.yaxis_domain = x;
    return chart;
  };
  
  chart.yaxis_var = function(x) {
    if (!arguments.length) return vars.yaxis_var;
    vars.yaxis_var = x;
    return chart;
  };
  
  chart.year = function(x) {
    if (!arguments.length) return vars.year;
    vars.year = x;
    return chart;
  };
  
  chart.year_var = function(x) {
    if (!arguments.length) return vars.year_var;
    vars.year_var = x;
    return chart;
  };

  //===================================================================

  return chart;
};
vizwhiz.network = function(data,vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------
  
  var dragging = false,
      highlight_color = "#cc0000",
      secondary_color = "#ffdddd",
      offset_top = 0,
      offset_left = 0,
      info_width = 300,
      zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
      scale = {},
      hover = null,
      last_hover = null,
      last_highlight = null,
      highlight_extent = {};

  //===================================================================
    

  var x_range = d3.extent(d3.values(data), function(d){return d.x});
  var y_range = d3.extent(d3.values(data), function(d){return d.y});
  var aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0]);
    
  // Define Scale
  if (aspect > vars.width/vars.height) {
    var viz_height = vars.width/aspect, viz_width = vars.width
    offset_top = ((vars.height-viz_height)/2)
  } else {
    var viz_width = vars.height*aspect, viz_height = vars.height
    offset_left = ((vars.width-viz_width)/2)
  }
  
  // x scale
  scale.x = d3.scale.linear()
    .domain(x_range)
    .range([offset_left, vars.width-offset_left])
  // y scale
  scale.y = d3.scale.linear()
    .domain(y_range)
    .range([offset_top, vars.height-offset_top])
    
  var val_range = d3.extent(d3.values(data), function(d){
    return d[vars.value_var] ? d[vars.value_var] : null
  });
  
  if (typeof val_range[0] == "undefined") val_range = [1,1]
  
  var max_dist = 0
  d3.values(data).forEach(function(n){
    d3.values(data).forEach(function(n2){
      if (n != n2) {
        var xx = Math.abs(scale.x(n.x)-scale.x(n2.x));
        var yy = Math.abs(scale.y(n.y)-scale.y(n2.y));
        var dd = Math.sqrt((xx*xx)+(yy*yy))
        if (dd > max_dist) max_dist = dd;
      }
    })
  })
  
  var min_dist = {"value": 0};
  d3.values(data).forEach(function(n){
    d3.values(data).forEach(function(n2){
      if (n != n2) {
        var xx = Math.abs(scale.x(n.x)-scale.x(n2.x));
        var yy = Math.abs(scale.y(n.y)-scale.y(n2.y));
        var dd = Math.sqrt((xx*xx)+(yy*yy))
        var v1 = n[vars.value_var] ? n[vars.value_var] : 0
        var v2 = n2[vars.value_var] ? n2[vars.value_var] : 0
        var factor = max_dist/dd+(v1+v2)/(val_range[1]*2)
        if (factor > min_dist.value) {
          min_dist = {"value": factor, "node1": n, "node2": n2, "v1": v1, "v2": v2, "distance": dd}
        }
      }
    })
  })
  
  var biggest = min_dist.v1 > min_dist.v2 ? min_dist.v1 : min_dist.v2
  var dd = min_dist.distance*(biggest/(min_dist.v1+min_dist.v2))
  var wc = (vars.height-dd*2)/vars.height
  var hc = (vars.width-dd*2)/vars.width
  var delta = wc < hc ? wc : hc
  var max_size = dd*delta-1;
  if (!max_size) max_size = 10;
  var min_size = max_size/5 < 2 ? 2 : max_size/5;
  // return
  // x scale
  scale.x.range([offset_left+(max_size*1.5), vars.width-(max_size*1.5)-offset_left])
  // y scale
  scale.y.range([offset_top+(max_size*1.5), vars.height-(max_size*1.5)-offset_top])
  // size scale
  scale.size = d3.scale.log()
    .domain(val_range)
    .range([min_size, max_size])
    
  // Create viz group on vars.parent_enter
  var viz_enter = vars.parent_enter.append("g")
    .call(zoom_behavior.on("zoom",function(){ zoom(); }))
    .on(vizwhiz.evt.down,function(d){
      dragging = true
    })
    .on(vizwhiz.evt.up,function(d){
      dragging = false
    })
    .append('g')
      .attr('class','viz')
    
  viz_enter.append('rect')
    .attr('class','overlay')
    .attr("fill","transparent");
    
  d3.select("rect.overlay")
    .attr("width", vars.width)
    .attr("height", vars.height)
    .on(vizwhiz.evt.over,function(d){
      if (!vars.highlight && hover) {
        hover = null;
        update();
      }
    })
    .on(vizwhiz.evt.click,function(d){
      vars.highlight = null;
      zoom("reset");
      update();
    })
    .on(vizwhiz.evt.move,function(d){
      if (zoom_behavior.scale() > 1) {
        d3.select(this).style("cursor","move")
        if (dragging) {
          d3.select(this).style("cursor","-moz-grabbing")
          d3.select(this).style("cursor","-webkit-grabbing")
        }
        else {
          d3.select(this).style("cursor","-moz-grab")
          d3.select(this).style("cursor","-webkit-grab")
        }
      }
      else {
        d3.select(this).style("cursor","default")
      }
    });
    
  viz_enter.append('g')
    .attr('class','links')
    
  viz_enter.append('g')
    .attr('class','nodes')
    
  viz_enter.append('g')
    .attr('class','highlight')
    
  viz_enter.append('g')
    .attr('class','hover')
    
  if (!vars.small) {
    // Create Zoom Controls div on vars.parent_enter
    vars.parent.select("div#zoom_controls").remove()
    var zoom_div = vars.parent.append("div")
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
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New nodes and links enter, initialize them here
  //-------------------------------------------------------------------
  
  var node = d3.select("g.nodes").selectAll("circle.node")
    .data(data, function(d) { return d[vars.id_var]; })
  
  node.enter().append("circle")
    .attr("class","node")
    .attr("r",0)
    .call(node_position)
    .call(node_color)
    .call(node_stroke);
  
  var link = d3.select("g.links").selectAll("line.link")
    .data(vars.links, function(d) { return d.source[vars.id_var] + "-" + d.target[vars.id_var]; })
    
  link.enter().append("line")
    .attr("class","link")
    .attr("pointer-events","none")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .call(link_position);
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for nodes and links that are already in existance
  //-------------------------------------------------------------------

  node
    .on(vizwhiz.evt.over, function(d){
      hover = d[vars.id_var];
      update();
    });

  node.transition().duration(vizwhiz.timing)
    .call(node_size)
    .call(node_stroke)
    .call(node_position)
    .call(node_color);
    
  link
    .call(link_events);
    
  link.transition().duration(vizwhiz.timing)
    .attr("stroke", "#dedede")
    .call(link_position);
      
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit, for nodes and links that are being removed
  //-------------------------------------------------------------------

  node.exit().transition().duration(vizwhiz.timing)
    .attr("r",0)
    .remove()
    
  link.exit().transition().duration(vizwhiz.timing)
    .attr("stroke", "white")
    .remove()

  //===================================================================
  
  if (vars.highlight) {
    var present = false;
    data.forEach(function(d){
      if (d[vars.id_var] == vars.highlight) present = true;
    })
    if (!present) {
      vizwhiz.tooltip.remove()
      d3.select("g.highlight").selectAll("*").remove()
      vars.highlight = null;
      zoom("reset");
    }
    else {
      zoom(vars.highlight);
    }
  }
  update();
      
  function link_position(l) {
    l
      .attr("x1", function(d) { return scale.x(d.source.x); })
      .attr("y1", function(d) { return scale.y(d.source.y); })
      .attr("x2", function(d) { return scale.x(d.target.x); })
      .attr("y2", function(d) { return scale.y(d.target.y); });
  }
  
  function link_events(l) {
    l
      .on(vizwhiz.evt.click,function(d){
        vars.highlight = null;
        zoom("reset");
        update();
      })
  }
  
  function node_position(n) {
    n
      .attr("cx", function(d) { return scale.x(d.x); })
      .attr("cy", function(d) { return scale.y(d.y); })
  }
  
  function node_size(n) {
    n
      .attr("r", function(d) { 
        var value = d[vars.value_var] ? d[vars.value_var] : 0
        return value > 0 ? scale.size(value) : scale.size(val_range[0])
      })
  }
  
  function node_stroke(b) {
    b
      .attr("stroke-width", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal
        var class_name = this.className.baseVal
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        var bg = class_name == "bg"
        
        if (bg) {
          if (vars.highlight == d[vars.id_var]) return 3;
          else return 2;
        }
        else if (highlighted) return 0;
        else return 1;
      })
  }
  
  function node_color(n) {
    n
      .attr("fill", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal
        
        // "True" if node is a background node and a node has been highlighted
        var background_node = vars.highlight && parent_group == "nodes"
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        // "True" if vars.spotlight is true and node vars.active_var is false
        var active = d[vars.active_var] ? d[vars.active_var] : false
        var hidden = vars.spotlight && !active
        // Grey out nodes that are in the background or hidden by spotlight,
        // otherwise, use the active_color function
        return (background_node || hidden) && !highlighted ? "#efefef" : fill_color(d);
        
      })
      .attr("stroke", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal;
        
        // "True" if node is a background node and a node has been highlighted
        var background_node = vars.highlight && parent_group == "nodes";
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        // "True" if vars.spotlight is true and node vars.active_var is false
        var active = d[vars.active_var] ? d[vars.active_var] : false
        var hidden = vars.spotlight && !active
        
        if (highlighted) return fill_color(d);
        else if (background_node || hidden) return "#dedede";
        else return stroke_color(d);
        
      })
  }
  
  function fill_color(d) {
    
    // Get elements' color
    var color = get_color(d);
    
    // If node is not active, lighten the color
    var active = d[vars.active_var] ? d[vars.active_var] : false
    if (!active) {
      var color = d3.hsl(color);
      color.l = 0.95;
    }
    
    // Return the color
    return color;
    
  }
  
  function stroke_color(d) {
    
    // Get elements' color
    var color = get_color(d);
    
    // If node is active, return a darker color, else, return the normal color
    var active = d[vars.active_var] ? d[vars.active_var] : false
    return active ? "#333" : color;
    
  }
  
  // Helper function to acquire an elements' color, or set one randomly
  function get_color(d) {
    
    // If no color exists, get one randomly
    return d.color ? d.color : vizwhiz.utils.rand_color()
    
  }
  
  function node_events(n) {
    n
      .on(vizwhiz.evt.over, function(d){
        
        d3.select(this).style("cursor","pointer")
        d3.select(this).style("cursor","-moz-zoom-in")
        d3.select(this).style("cursor","-webkit-zoom-in")
          
        if (d[vars.id_var] == vars.highlight) {
          d3.select(this).style("cursor","-moz-zoom-out")
          d3.select(this).style("cursor","-webkit-zoom-out")
        }
        
        if (d[vars.id_var] != hover) {
          hover = d[vars.id_var];
          update();
        }
        
      })
      .on(vizwhiz.evt.out, function(d){
        
        // Returns false if the mouse has moved into a child element.
        // This is used to catch when the mouse moves onto label text.
        var id_check = d3.event.toElement.__data__[vars.id_var] == d[vars.id_var]
        if (d3.event.toElement.parentNode != this && !id_check) {
          hover = null;
          update();
        }
        
      })
      .on(vizwhiz.evt.click, function(d){
        
        d3.select(this).style("cursor","auto")

        // If there is no highlighted node, 
        // or the hover node is not the highlighted node
        if (!vars.highlight || vars.highlight != d[vars.id_var]) {
          vars.highlight = d[vars.id_var];
        } 
        
        // Else, the user is clicking on the highlighted node.
        else {
          vars.highlight = null;
        }
        
        update();
        
      })
  }
  
  function update() {
    
    // If highlight variable has ACTUALLY changed, do this stuff
    if (last_highlight != vars.highlight) {
      
      // Remove all tooltips on page
      vizwhiz.tooltip.remove()
      d3.select("g.highlight").selectAll("*").remove()
      d3.select("g.hover").selectAll("*").remove()
      
      if (vars.highlight) {
                          
        create_nodes("highlight")
        
      }
      else {
        zoom("reset");
      }
      
      node.call(node_color)
      
      last_highlight = vars.highlight
    }

    // If hover variable has ACTUALLY changed, do this stuff
    if (last_hover != hover) {

      d3.select("g.hover").selectAll("*").remove()
      
      // If a new hover element exists, create it
      if (hover && hover != vars.highlight) {
        create_nodes("hover")
      }
      
      // Set last_hover to the new hover ID
      last_hover = hover
    }
    
    function create_nodes(group) {
      
      if (group == "highlight") {
        var c = vars.highlight
      }
      else {
        var c = hover
      }
      
      var node_data = data.filter(function(n){
                          return n[vars.id_var] == c
                        })
      
      if (group == "highlight" || !vars.highlight) {

        var prim_nodes = [],
            prim_links = [];
            
        if (vars.connections[c]) {
          vars.connections[c].forEach(function(n){
            prim_nodes.push(data.filter(function(d){return d[vars.id_var] == n[vars.id_var]})[0])
          })
          prim_nodes.forEach(function(n){
            prim_links.push({"source": node_data[0], "target": n})
          })
        }
        
        var node_data = prim_nodes.concat(node_data)
        highlight_extent.x = d3.extent(d3.values(node_data),function(v){return v.x;}),
        highlight_extent.y = d3.extent(d3.values(node_data),function(v){return v.y;})

        if (group == "highlight") {
          zoom(c);
          
          // Draw Info Panel
          if (scale.x(highlight_extent.x[1]) > (vars.width-info_width-10)) var x_pos = 37+(info_width/2)
          else var x_pos = vars.width
      
          var tooltip_data = {},
              tooltip_appends = []
              
          var h = data.filter(function(d){return d[vars.id_var] == vars.highlight})[0]
          vars.tooltip_info.forEach(function(t){
            if (h[t]) tooltip_data[t] = h[t]
          })
          tooltip_appends.push({
            "append": "text",
            "attr": {
              "dy": "18px",
              "fill": "#333333",
              "text-anchor": "start",
              "font-size": "12px",
              "font-family": "Helvetica"
            },
            "style": {
              "font-weight": "bold"
            },
            "text": "Primary Connections"
          })
      
          prim_nodes.forEach(function(n){
            var obj = {
              "append": "g",
              "children": [
                {
                  "append": "circle",
                  "attr": {
                    "r": "5",
                    "cx": "5",
                    "cy": "8"
                  },
                  "style": {
                    "font-weight": "normal"
                  },
                  "text": n[vars.text_var],
                  "events": {}
                },
                {
                  "append": "text",
                  "attr": {
                    "fill": "#333333",
                    "text-anchor": "start",
                    "font-size": "12px",
                    "font-family": "Helvetica",
                    "y": "0",
                    "x": "13"
                  },
                  "style": {
                    "font-weight": "normal"
                  },
                  "text": n[vars.text_var],
                  "events": {}
                }
              ]
            }
            obj.children[0].attr["fill"] = function(){
                var color = n.color ? n.color : vizwhiz.utils.rand_color()
                if (n[vars.active_var]) {
                  return color;
                } else {
                  color = d3.hsl(color)
                  color.l = 0.95
                  return color.toString()
                }
              }
            obj.children[0].attr["stroke"] = function(){
                var color = n.color ? n.color : vizwhiz.utils.rand_color()
                return n[vars.active_var] ? "#333" : color
              }
            obj.children[0].attr["stroke-width"] = 1
            obj.children[1].events[vizwhiz.evt.over] = function(){
                d3.select(this).attr('fill',highlight_color).style('cursor','pointer')
              }
            obj.children[1].events[vizwhiz.evt.out] = function(){
                d3.select(this).attr("fill","#333333")
              }
            obj.children[1].events[vizwhiz.evt.click] = function(){
                vars.highlight = n[vars.id_var];
                update();
              }
            tooltip_appends.push(obj)
          })
      
          vizwhiz.tooltip.create({
            "parent": vars.svg,
            "data": tooltip_data,
            "title": h[vars.text_var],
            "x": x_pos,
            "y": 0,
            "width": info_width,
            "arrow": false,
            "appends": tooltip_appends
          })
          
        }
        
        d3.select("g."+group).selectAll("line")
          .data(prim_links).enter().append("line")
            .attr("pointer-events","none")
            .attr("stroke",highlight_color)
            .attr("stroke-width",1.5)
            .call(link_position)
      }
      
      var node_groups = d3.select("g."+group).selectAll("g")
        .data(node_data).enter().append("g")
          .attr("class","hover_node")
          .call(node_events)
    
      node_groups
        .append("circle")
          .attr("class","bg")
          .call(node_size)
          .call(node_position)
          .call(node_stroke)
          .attr("stroke",highlight_color);
        
      node_groups
        .append("circle")
          .call(node_size)
          .call(node_position)
          .call(node_stroke)
          .call(node_color)
          .call(create_label);
    }
    
  }
  
  function create_label(n) {
    if (vars.labels) {
      n.each(function(d){

        var font_size = Math.ceil(10/zoom_behavior.scale()),
            value = d[vars.value_var] ? d[vars.value_var] : 0,
            size = value > 0 ? scale.size(value) : scale.size(val_range[0])
        if (font_size < size || d[vars.id_var] == hover || d[vars.id_var] == vars.highlight) {
          d3.select(this.parentNode).append("text")
            .attr("pointer-events","none")
            .attr("x",scale.x(d.x))
            .attr("fill",vizwhiz.utils.text_color(fill_color(d)))
            .attr("font-size",font_size+"px")
            .attr("text-anchor","middle")
            .attr("font-family","Helvetica")
            .style("font-weight","bold")
            .each(function(e){
              var tw = size*8,
                  th = size < font_size*2 ? font_size*2 : size
              if (vars.name_array) {
                var text = []
                vars.name_array.forEach(function(n){
                  if (d[n]) text.push(d[n])
                })
              } else {
                var text = d[vars.id_var] ? [d[vars.text_var],d[vars.id_var]] : d[vars.text_var]
              }
                
              vizwhiz.utils.wordwrap({
                "text": text,
                "parent": this,
                "width": tw,
                "height": th,
                "padding": 0
              });
              if (!d3.select(this).select("tspan")[0][0]) {
                d3.select(this).remove();
              }
              else {
                finish_label(d3.select(this));
              }
            })
        }
              
        function finish_label(text) {
          
          var w = text.node().getBBox().width,
              h = text.node().getBBox().height
        
          text.attr("y",scale.y(d.y)-(h/2))
          
          if (h+(font_size*1.5) > size*2 && d[vars.id_var] != hover && d[vars.id_var] != vars.highlight) {
            text.remove();
          }
          else if (w+(font_size) > size*2) {
            d3.select(text.node().parentNode)
              .insert("rect","circle")
                .attr("class","bg")
                .attr("rx",font_size)
                .attr("ry",font_size)
                .attr("width",w+(font_size*1.5))
                .attr("height",h+(font_size*1.5))
                .attr("y",scale.y(d.y)-((h+(font_size*1.5))/2))
                .attr("x",scale.x(d.x)-((w+(font_size*1.5))/2))
                .call(node_stroke)
                .attr("stroke",highlight_color);
            d3.select(text.node().parentNode)
              .insert("rect","text")
                .attr("rx",font_size)
                .attr("ry",font_size)
                .attr("stroke-width", 0)
                .attr("fill",fill_color(d))
                .attr("width",w+(font_size*1.5))
                .attr("height",h+(font_size*1.5))
                .attr("y",scale.y(d.y)-((h+(font_size*1.5))/2))
                .attr("x",scale.x(d.x)-((w+(font_size*1.5))/2));
          }
        }
        
      })
      
    }
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function that handles the zooming and panning of the visualization
  //-------------------------------------------------------------------
  
  function zoom(direction) {
    
    var zoom_extent = zoom_behavior.scaleExtent()
    // If d3 zoom event is detected, use it!
    if(!direction) {
      evt_scale = d3.event.scale
      translate = d3.event.translate
    } else {
      if (direction == "in") {
        if (zoom_behavior.scale() > zoom_extent[1]/2) multiplier = zoom_extent[1]/zoom_behavior.scale()
        else multiplier = 2
      } else if (direction == "out") {
        if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
        else multiplier = 0.5
      } else if (direction == vars.highlight) {
        var x_bounds = [scale.x(highlight_extent.x[0]),scale.x(highlight_extent.x[1])],
            y_bounds = [scale.y(highlight_extent.y[0]),scale.y(highlight_extent.y[1])]
            
        if (x_bounds[1] > (vars.width-info_width-5)) var offset_left = info_width+32
        else var offset_left = 0
            
        var w_zoom = (vars.width-info_width-10)/(x_bounds[1]-x_bounds[0]),
            h_zoom = vars.height/(y_bounds[1]-y_bounds[0])
        
        if (w_zoom < h_zoom) {
          x_bounds = [x_bounds[0]-(max_size*2),x_bounds[1]+(max_size*2)]
          evt_scale = (vars.width-info_width-10)/(x_bounds[1]-x_bounds[0])
          if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
          offset_x = -(x_bounds[0]*evt_scale)
          offset_y = -(y_bounds[0]*evt_scale)+((vars.height-((y_bounds[1]-y_bounds[0])*evt_scale))/2)
        } else {
          y_bounds = [y_bounds[0]-(max_size*2),y_bounds[1]+(max_size*2)]
          evt_scale = vars.height/(y_bounds[1]-y_bounds[0])
          if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
          offset_x = -(x_bounds[0]*evt_scale)+(((vars.width-info_width-10)-((x_bounds[1]-x_bounds[0])*evt_scale))/2)
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
          offset_x = (vars.width/2)-(((vars.width/2)-offset_x)*multiplier)
          offset_y = (vars.height/2)-(((vars.height/2)-offset_y)*multiplier)
        }
      
        translate = [offset_x,offset_y]
        evt_scale = zoom_var*multiplier
      }
    
    }
    
    zoom_behavior.translate(translate).scale(evt_scale)
    
    // Auto center visualization
    if (translate[0] > 0) translate[0] = 0
    else if (translate[0] < -((vars.width*evt_scale)-vars.width)) {
      translate[0] = -((vars.width*evt_scale)-vars.width)
    }
    if (translate[1] > 0) translate[1] = 0
    else if (translate[1] < -((vars.height*evt_scale)-vars.height)) translate[1] = -((vars.height*evt_scale)-vars.height)
    if (!direction) {
      if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
        var viz_timing = d3.select(".viz")
      } else {
        var viz_timing = d3.select(".viz").transition().duration(vizwhiz.timing)
      }
    } else {
      var viz_timing = d3.select(".viz").transition().duration(vizwhiz.timing)
    }
    viz_timing.attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
    
  }

  //===================================================================
      
};

vizwhiz.stacked = function(data,vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper function used to create stack polygon
  //-------------------------------------------------------------------
  
  var stack = d3.layout.stack()
    .offset("zero")
    .values(function(d) { return d.values; })
    .x(function(d) { return parseInt(d.key); })
    .y(function(d) { return d.values; });
  
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
      // vertical lines up and down
      
      var bgtick = d3.select(this.parentNode).selectAll(".bgtick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","bgtick")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0-1)
        .attr("y2", -graph.height+1)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1/2)
      
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("y2", -graph.height+1) 
      
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
      // horizontal lines across
      
      var bgtick = d3.select(this.parentNode).selectAll(".bgtick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","bgtick")
        .attr("x1", 0+1)
        .attr("x2", 0+graph.width-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1/2)
      
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("x2", 0+graph.width-1)
        
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", -10)
        .attr("x2", 0-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      if(vars.layout == "share"){
        return d3.format("p")(d);
      }
      return vizwhiz.utils.format_num(d, false, 3, true)
    });
    
  //===================================================================
      
  if (vars.small) {
    var graph_margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
  }
  else {
    var graph_margin = {"top": 10, "right": 40, "bottom": 80, "left": 90}
  }
  
  graph = {
        "width": vars.width-graph_margin.left-graph_margin.right,
        "height": vars.height-graph_margin.top-graph_margin.bottom,
        "x": graph_margin.left,
        "y": graph_margin.top
      }
      
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------
  
  // get unique values for xaxis
  xaxis_vals = data
    .reduce(function(a, b){ return a.concat(b[vars.xaxis_var]) }, [])
    .filter(function(value, index, self) { 
      return self.indexOf(value) === index;
    })
    
  // get max total for sums of each xaxis
  var xaxis_sums = d3.nest()
    .key(function(d){return d[vars.xaxis_var] })
    .rollup(function(leaves){
      return d3.sum(leaves, function(d){return d[vars.value_var];})
    })
    .entries(data)
  
  var data_max = vars.layout == "share" ? 1 : d3.max(xaxis_sums, function(d){ return d.values; });
  
  // nest data properly according to nesting array
  nested_data = nest_data(xaxis_vals, data, xaxis_sums);
  
  // scales for both X and Y values
  var x_scale = d3.scale.linear()
    .domain([xaxis_vals[0], xaxis_vals[xaxis_vals.length-1]]).range([0, graph.width]);
  // **WARNING reverse scale from 0 - max converts from height to 0 (inverse)
  var y_scale = d3.scale.linear()
    .domain([0, data_max]).range([graph.height, 0]);
  
  // Helper function unsed to convert stack values to X, Y coords 
  var area = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return x_scale(parseInt(d.key)); })
    .y0(function(d) { return y_scale(d.y0)-1; })
    .y1(function(d) { return y_scale(d.y0 + d.y); });
  
  // container for the visualization
  var viz_enter = vars.parent_enter.append("g")
    .attr("class", "viz")
    .attr("width", graph.width)
    .attr("height", graph.height)
    .attr("transform", "translate(" + graph.x + "," + graph.y + ")")

  // add grey background for viz
  viz_enter.append("rect")
    .style('stroke','#000')
    .style('stroke-width',1)
    .style('fill','#efefef')
    .attr("class","background")
    .attr('x',0)
    .attr('y',0)
    .attr("opacity",0)
    .attr('width', graph.width)
    .attr('height', graph.height)
  
  // update (in case width and height are changed)
  d3.select(".viz").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr('height', graph.height)
    .attr("transform", "translate(" + graph.x + "," + graph.y + ")")
    .select(".viz rect")
      .attr("opacity",1)
      .attr('width', graph.width)
      .attr('height', graph.height)
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X AXIS
  //-------------------------------------------------------------------
  
  // enter axis ticks
  var xaxis_enter = viz_enter.append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(0," + graph.height + ")")
    .attr("opacity",0)
    .call(x_axis.scale(x_scale))
  
  // update axis ticks
  d3.select(".xaxis").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(0," + graph.height + ")")
    .attr("opacity",1)
    .call(x_axis.scale(x_scale))
  
  // enter label
  xaxis_enter.append('text')
    .attr('class', 'axis_title_x')
    .attr('y', 60)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Helvetica")
    .attr("fill", "#4c4c4c")
    .attr("opacity",0)
    .attr('width', graph.width)
    .attr('x', graph.width/2)
    .text(vars.xaxis_var)
  
  // update label
  d3.select(".axis_title_x").transition().duration(vizwhiz.timing)
    .attr("opacity",1)
    .attr('width', graph.width)
    .attr('x', graph.width/2)
    .text(vars.xaxis_var)
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Y AXIS
  //-------------------------------------------------------------------
  
  // enter
  var yaxis_enter = viz_enter.append("g")
    .attr("class", "yaxis")
    .attr("opacity",0)
    .call(y_axis.scale(y_scale))
  
  // update
  d3.select(".yaxis").transition().duration(vizwhiz.timing)
    .attr("opacity",1)
    .call(y_axis.scale(y_scale))
  
  // also update background tick lines
  d3.selectAll(".y_bg_line")
    .attr("x2", graph.width)
  
  // label
  yaxis_enter.append('text')
    .attr('class', 'axis_title_y')
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Helvetica")
    .attr("fill", "#4c4c4c")
    .attr("opacity",0)
    .attr('width', graph.width)
    .attr("transform", "translate(" + (graph.x-150) + "," + (graph.y+graph.height/2) + ") rotate(-90)")
    .text(vars.value_var)
  
  // update label
  d3.select(".axis_title_y").transition().duration(vizwhiz.timing)
    .attr("opacity",1)
    .attr('width', graph.width)
    .attr("transform", "translate(" + (graph.x-150) + "," + (graph.y+graph.height/2) + ") rotate(-90)")
    .text(vars.value_var)
  
  //===================================================================
  
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // LAYERS
  //-------------------------------------------------------------------
  
  // Get layers from d3.stack function (gives x, y, y0 values)
  var offset = vars.layout == "value" ? "zero" : "expand";
  var layers = stack.offset(offset)(nested_data)
  
  // container for layers
  viz_enter.append("g").attr("class", "layers")
  
  // give data with key function to variables to draw
  var paths = d3.select("g.layers").selectAll(".layer")
    .data(layers, function(d){ return d.key; })
  
  // ENTER
  // enter new paths, could be next level deep or up a level
  paths.enter().append("path")
    .attr("opacity", 0)
    .attr("class", "layer")
    .attr("fill", function(d){
      return d.color
    })
    .attr("d", function(d) {
      return area(d.values);
    })
  
  // UPDATE
  paths
    .on(vizwhiz.evt.move, path_tooltip)
    .on(vizwhiz.evt.out, function(d){
      d3.selectAll("line.rule").remove();
      vizwhiz.tooltip.remove();
    })
  
  paths.transition().duration(vizwhiz.timing)
    .attr("opacity", 1)
    .attr("fill", function(d){
      return d.color
    })
    .attr("d", function(d) {
      return area(d.values);
    })
    
  function path_tooltip(d){
    d3.selectAll("line.rule").remove();
    var mouse_x = d3.event.layerX-graph_margin.left;
    var rev_x_scale = d3.scale.linear()
      .domain(x_scale.range()).range(x_scale.domain());
    var this_x = Math.round(rev_x_scale(mouse_x));
    var this_x_index = xaxis_vals.indexOf(this_x)
    var this_value = d.values[this_x_index]
    // add dashed line at closest X position to mouse location
    d3.select("g.viz").append("line")
      .datum(d)
      .attr("class", "rule")
      .attr({"x1": x_scale(this_x), "x2": x_scale(this_x)})
      .attr({"y1": y_scale(this_value.y0), "y2": y_scale(this_value.y + this_value.y0)})
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", "5,3")
      .on(vizwhiz.evt.over, path_tooltip)
    
    // tooltip
    var tooltip_data = {}
    tooltip_data["Value ("+this_x+")"] = this_value.values;
    vars.tooltip_info.forEach(function(t){
      if (d[t]) tooltip_data[t] = d[t]
    })

    vizwhiz.tooltip.remove();
    vizwhiz.tooltip.create({
      "parent": vars.svg,
      "id": d[vars.id_var],
      "data": tooltip_data,
      "title": d[vars.text_var],
      "x": x_scale(this_x)+graph_margin.left,
      "y": y_scale(this_value.y0 + this_value.y)+(graph.height-y_scale(this_value.y))/2+graph_margin.top,
      "offset": ((graph.height-y_scale(this_value.y))/2)+2,
      "arrow": true
    })
  }
  
  // EXIT
  paths.exit()
    .transition().duration(vizwhiz.timing)
    .attr("opacity", 0)
    .remove()
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // TEXT LAYERS
  //-------------------------------------------------------------------
  
  if (!vars.small) {

    var defs = vars.parent_enter.append('svg:defs')
    vizwhiz.utils.drop_shadow(defs)
  
    // filter layers to only the ones with a height larger than 6% of viz
    var text_layers = [];
    var text_height_scale = d3.scale.linear().range([0, 1]).domain([0, data_max]);
  
    layers.forEach(function(layer){
      // find out which is the largest
      var available_areas = layer.values.filter(function(d,i,a){
        
        var min_height = 30;
        if (i == 0) {
          return (graph.height-y_scale(d.y)) >= min_height 
              && (graph.height-y_scale(a[i+1].y)) >= min_height
              && (graph.height-y_scale(a[i+2].y)) >= min_height
              && y_scale(d.y)-(graph.height-y_scale(d.y0)) < y_scale(a[i+1].y0)
              && y_scale(a[i+1].y)-(graph.height-y_scale(a[i+1].y0)) < y_scale(a[i+2].y0)
              && y_scale(d.y0) > y_scale(a[i+1].y)-(graph.height-y_scale(a[i+1].y0))
              && y_scale(a[i+1].y0) > y_scale(a[i+2].y)-(graph.height-y_scale(a[i+2].y0));
        }
        else if (i == a.length-1) {
          return (graph.height-y_scale(d.y)) >= min_height 
              && (graph.height-y_scale(a[i-1].y)) >= min_height
              && (graph.height-y_scale(a[i-2].y)) >= min_height
              && y_scale(d.y)-(graph.height-y_scale(d.y0)) < y_scale(a[i-1].y0)
              && y_scale(a[i-1].y)-(graph.height-y_scale(a[i-1].y0)) < y_scale(a[i-2].y0)
              && y_scale(d.y0) > y_scale(a[i-1].y)-(graph.height-y_scale(a[i-1].y0))
              && y_scale(a[i-1].y0) > y_scale(a[i-2].y)-(graph.height-y_scale(a[i-2].y0));
        }
        else {
          return (graph.height-y_scale(d.y)) >= min_height 
              && (graph.height-y_scale(a[i-1].y)) >= min_height
              && (graph.height-y_scale(a[i+1].y)) >= min_height
              && y_scale(d.y)-(graph.height-y_scale(d.y0)) < y_scale(a[i+1].y0)
              && y_scale(d.y)-(graph.height-y_scale(d.y0)) < y_scale(a[i-1].y0)
              && y_scale(d.y0) > y_scale(a[i+1].y)-(graph.height-y_scale(a[i+1].y0))
              && y_scale(d.y0) > y_scale(a[i-1].y)-(graph.height-y_scale(a[i-1].y0));
        }
      });
      var best_area = d3.max(layer.values,function(d,i){
        if (available_areas.indexOf(d) >= 0) {
          if (i == 0) {
            return (graph.height-y_scale(d.y))
                 + (graph.height-y_scale(layer.values[i+1].y))
                 + (graph.height-y_scale(layer.values[i+2].y));
          }
          else if (i == layer.values.length-1) {
            return (graph.height-y_scale(d.y))
                 + (graph.height-y_scale(layer.values[i-1].y))
                 + (graph.height-y_scale(layer.values[i-2].y));
          }
          else {
            return (graph.height-y_scale(d.y))
                 + (graph.height-y_scale(layer.values[i-1].y))
                 + (graph.height-y_scale(layer.values[i+1].y));
          }
        } else return null;
      });
      var best_area = layer.values.filter(function(d,i,a){
        if (i == 0) {
          return (graph.height-y_scale(d.y))
               + (graph.height-y_scale(layer.values[i+1].y))
               + (graph.height-y_scale(layer.values[i+2].y)) == best_area;
        }
        else if (i == layer.values.length-1) {
          return (graph.height-y_scale(d.y))
               + (graph.height-y_scale(layer.values[i-1].y))
               + (graph.height-y_scale(layer.values[i-2].y)) == best_area;
        }
        else {
          return (graph.height-y_scale(d.y))
               + (graph.height-y_scale(layer.values[i-1].y))
               + (graph.height-y_scale(layer.values[i+1].y)) == best_area;
        }
      })[0]
      if (best_area) {
        layer.tallest = best_area
        text_layers.push(layer)
      }
    
    })
    // container for text layers
    viz_enter.append("g").attr("class", "text_layers")

    // RESET
    var texts = d3.select("g.text_layers").selectAll(".label")
      .data([])
  
    // EXIT
    texts.exit().remove()
  
    // give data with key function to variables to draw
    var texts = d3.select("g.text_layers").selectAll(".label")
      .data(text_layers)
    
    // ENTER
    texts.enter().append("text")
      .attr('filter', 'url(#dropShadow)')
      .attr("class", "label")
      .style("font-weight","bold")
      .attr("font-size","14px")
      .attr("font-family","Helvetica")
      .attr("dy", 6)
      .attr("opacity",0)
      .attr("text-anchor", function(d){
        // if first, left-align text
        if(d.tallest.key == x_scale.domain()[0]) return "start";
        // if last, right-align text
        if(d.tallest.key == x_scale.domain()[1]) return "end";
        // otherwise go with middle
        return "middle"
      })
      .attr("fill", function(d){
        return "white"
      })
      .attr("x", function(d){
        var pad = 0;
        // if first, push it off 10 pixels from left side
        if(d.tallest.key == x_scale.domain()[0]) pad += 10;
        // if last, push it off 10 pixels from right side
        if(d.tallest.key == x_scale.domain()[1]) pad -= 10;
        return x_scale(d.tallest.key) + pad;
      })
      .attr("y", function(d){
        var height = graph.height - y_scale(d.tallest.y);
        return y_scale(d.tallest.y0 + d.tallest.y) + (height/2);
      })
      .text(function(d) {
        return d[vars.text_var]
      })
      .on(vizwhiz.evt.over, path_tooltip)
      .each(function(d){
        // set usable width to 2x the width of each x-axis tick
        var tick_width = (graph.width / xaxis_vals.length) * 2;
        // if the text box's width is larger than the tick width wrap text
        if(this.getBBox().width > tick_width){
          // first remove the current text
          d3.select(this).text("")
          // figure out the usable height for this location along x-axis
          var height = graph.height-y_scale(d.tallest.y)
          // wrap text WITHOUT resizing
          // vizwhiz.utils.wordwrap(d[nesting[nesting.length-1]], this, tick_width, height, false)
        
          vizwhiz.utils.wordwrap({
            "text": d[vars.text_var],
            "parent": this,
            "width": tick_width,
            "height": height,
            "resize": false
          })
        
          // reset Y to compensate for new multi-line height
          var offset = (height - this.getBBox().height) / 2;
          // top of the element's y attr
          var y_top = y_scale(d.tallest.y0 + d.tallest.y);
          d3.select(this).attr("y", y_top + offset)
        }
      })
  
    // UPDATE
    texts.transition().duration(vizwhiz.timing)
      .attr("opacity",1)
      
  }
  
  //===================================================================
  
  
  // Draw foreground bounding box
  viz_enter.append('rect')
    .style('stroke','#000')
    .style('stroke-width',1*2)
    .style('fill','none')
    .attr('class', "border")
    .attr('width', graph.width)
    .attr('height', graph.height)
    .attr('x',0)
    .attr('y',0)
    .attr("opacity",0)
  
  // update (in case width and height are changed)
  d3.select(".border").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr('height', graph.height)
    .attr("opacity",1)
  
  // Always bring to front
  d3.select("rect.border").node().parentNode.appendChild(d3.select("rect.border").node())
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Nest data function (needed for getting flat data ready for stacks)
  //-------------------------------------------------------------------
  
  function nest_data(xaxis_vals, data, xaxis_sums){
    var info_lookup = {};
    
    var nested = d3.nest()
      .key(function(d){ return d[vars.id_var]; })
      .rollup(function(leaves){
        
        info_lookup[leaves[0][vars.id_var]] = JSON.parse(JSON.stringify(leaves[0]))
        delete info_lookup[leaves[0][vars.id_var]][vars.xaxis_var]
        delete info_lookup[leaves[0][vars.id_var]][vars.value_var]
        
        var values = d3.nest()
          .key(function(d){ return d[vars.xaxis_var]; })
          .rollup(function(l) {
            return d3.sum(l, function(d){ return d[vars.value_var]});
          })
          .entries(leaves)
        
        // Make sure all xaxis_vars at least have 0 values
        xaxis_vars_available = values
          .reduce(function(a, b){ return a.concat(b.key)}, [])
          .filter(function(y, i, arr) { return arr.indexOf(y) == i })
        
        xaxis_vals.forEach(function(y){
          if(xaxis_vars_available.indexOf(""+y) < 0){
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
    // return nested
    
    return nested.sort(function(a,b){
      if(a[vars.sort]<b[vars.sort]) return vars.order == "desc" ? -1 : 1;
      if(a[vars.sort]>b[vars.sort]) return vars.order == "desc" ? 1 : -1;
      return 0;
    });
    
  }

  //===================================================================
    
};
vizwhiz.tree_map = function(data,vars) {
  
  // Ok, to get started, lets run our heirarchically nested
  // data object through the d3 treemap function to get a
  // flat array of data with X, Y, width and height vars
  var tmap_data = d3.layout.treemap()
    .round(false)
    .size([vars.width, vars.height])
    .children(function(d) { return d.children; })
    .sort(function(a, b) { return a.value - b.value; })
    .value(function(d) { return d[vars.value_var]; })
    .nodes(data)
    .filter(function(d) {
      return !d.children;
    })
    
  var cell = d3.select("g.parent").selectAll("g")
    .data(tmap_data, function(d){ return d[vars.id_var]; })
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New cells enter, initialize them here
  //-------------------------------------------------------------------
  
  // cell aka container
  var cell_enter = cell.enter().append("g")
    .attr("opacity", 0)
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; 
    })
    .on(vizwhiz.evt.move, mouseover)
    .on(vizwhiz.evt.out, function(d){
      vizwhiz.tooltip.remove();
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
    .attr("opacity", 1)
    .attr("text-anchor","start")
    .style("font-weight","bold")
    .attr("font-family","Helvetica")
    .attr('class','name')
    .attr('x','0.2em')
    .attr('y','0em')
    .attr('dy','1em')
    .attr("fill", function(d){ return vizwhiz.utils.text_color(d.color); })
    
  // text (share)
  cell_enter.append("text")
    .attr('class','share')
    .attr("text-anchor","middle")
    .style("font-weight","bold")
    .attr("font-family","Helvetica")
    .attr("fill", function(d){ return vizwhiz.utils.text_color(d.color); })
    .attr("fill-opacity",0.75)
    .text(function(d) {
      var root = d;
      while(root.parent){ root = root.parent; } // find top most parent node
      d.share = vizwhiz.utils.format_num(d.value/root.value, true, 2);
      return d.share;
    })
    .attr('font-size',function(d){
      var size = (d.dx)/7
      if(d.dx < d.dy) var size = d.dx/7
      else var size = d.dy/7
      if (size < 10) size = 10;
      return size
    })
    .attr('x', function(d){
      return d.dx/2
    })
    .attr('y',function(d){
      return d.dy-(parseInt(d3.select(this).attr('font-size'),10)*0.10)
    })
    .each(function(d){
      var el = d3.select(this).node().getBBox()
      if (d.dx < el.width) d3.select(this).remove()
      else if (d.dy < el.height) d3.select(this).remove()
    })
    
    
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for cells that are already in existance
  //-------------------------------------------------------------------
  
  cell.transition().duration(vizwhiz.timing)
    .attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")"; 
    })
    .attr("opacity", 1)
    
  // update rectangles
  cell.select("rect").transition().duration(vizwhiz.timing)
    .attr('width', function(d) {
      return d.dx+'px'
    })
    .attr('height', function(d) { 
      return d.dy+'px'
    })

  // text (name)
  cell.select("text.name").transition()
    .duration(vizwhiz.timing/2)
    .attr("opacity", 0)
    .transition().duration(vizwhiz.timing/2)
    .each("end", function(d){
      d3.select(this).selectAll("tspan").remove();
      if(d[vars.text_var] && d.dx > 30 && d.dy > 30){
        if (vars.name_array) {
          var text = []
          vars.name_array.forEach(function(n){
            if (d[n]) text.push(d[n])
          })
        } 
        else {
          var text = d[vars.id_var] ? [d[vars.text_var],d[vars.id_var]] : d[vars.text_var]
        }
        vizwhiz.utils.wordwrap({
          "text": text,
          "parent": this,
          "width": d.dx,
          "height": d.dy,
          "resize": true
        })
      }
      
      d3.select(this).transition().duration(vizwhiz.timing/2)
        .attr("opacity", 1)
    })


  // text (share)
  cell.select("text.share").transition().duration(vizwhiz.timing/2)
    .attr("opacity", 0)
    .each("end",function(d){
      d3.select(this)
        .text(function(d){
          var root = d.parent;
          while(root.parent){ root = root.parent; } // find top most parent ndoe
          d.share = vizwhiz.utils.format_num(d.value/root.value, true, 2)
          return d.share;
        })
        .attr('font-size',function(d){
          var size = (d.dx)/7
          if(d.dx < d.dy) var size = d.dx/7
          else var size = d.dy/7
          if (size < 10) size = 10;
          return size
        })
        .attr('x', function(d){
          return d.dx/2
        })
        .attr('y',function(d){
          return d.dy-(parseInt(d3.select(this).attr('font-size'),10)*0.10)
        })
        .each(function(d){
          var el = d3.select(this).node().getBBox()
          if (d.dx < el.width) d3.select(this).remove()
          else if (d.dy < el.height) d3.select(this).remove()
        })
      d3.select(this).transition().duration(vizwhiz.timing/2)
        .attr("opacity", 1)
    })
    

  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exis, get rid of old cells
  //-------------------------------------------------------------------
  
  cell.exit().transition().duration(vizwhiz.timing)
    .attr("opacity", 0)
    .remove()

  //===================================================================
  
}
vizwhiz.geo_map = function(data,vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables with Default Settings
  //-------------------------------------------------------------------
  
  if (vars.init) {
    
    vars.projection
      .scale(vars.width/(2*Math.PI))
      .translate([vars.width/2,vars.height/2]);
      
    vars.zoom_behavior
      .scale(vars.projection.scale()*2*Math.PI)
      .translate(vars.projection.translate())
      .on("zoom",function(d){ zoom(d); })
      .scaleExtent([vars.width, 1 << 23]);
      
  }
  
  var default_opacity = 0.25,
      select_opacity = 0.75,
      stroke_width = 1,
      color_gradient = ["#00008f", "#003fff", "#00efff", "#ffdf00", "#ff3000", "#7f0000"],
      dragging = false,
      info_width = vars.small ? 0 : 300,
      scale_height = 10,
      scale_padding = 20,
      path = d3.geo.path().projection(vars.projection),
      tile = d3.geo.tile().size([vars.width, vars.height]),
      old_scale = vars.projection.scale()*2*Math.PI,
      old_translate = vars.projection.translate();

  //===================================================================
  
  if (data) {
    data_extent = d3.extent(d3.values(data),function(d){
      return d[vars.value_var] && d[vars.value_var] != 0 ? d[vars.value_var] : null
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
    
  var defs = vars.parent_enter.append("defs")
    
  if (vars.map.coords) {
        
    vars.parent_enter.append("rect")
      .attr("width",vars.width)
      .attr("height",vars.height)
      .attr(vars.map.style.water);
      
    vars.parent_enter.append("g")
      .attr("id","land")
      .attr("class","viz")
          
    var land = d3.select("g#land").selectAll("path")
      .data(topojson.object(vars.map.coords, vars.map.coords.objects[Object.keys(vars.map.coords.objects)[0]]).geometries)
    
    land.enter().append("path")
      .attr("d",path)
      .attr(vars.map.style.land)
        
  }

  vars.parent_enter.append('g')
    .attr('class','tiles');
    
  if (vars.tiles) update_tiles(0);
  else d3.selectAll("g.tiles *").remove()
    
  // Create viz group on vars.svg_enter
  var viz_enter = vars.parent_enter.append('g')
    .call(vars.zoom_behavior)
    .on(vizwhiz.evt.down,function(d){dragging = true})
    .on(vizwhiz.evt.up,function(d){dragging = false})
    .append('g')
      .attr('class','viz');
    
  viz_enter.append("rect")
    .attr("class","overlay")
    .attr("width",vars.width)
    .attr("height",vars.height)
    .attr("fill","transparent");
    
  d3.select("rect.overlay")
    .on(vizwhiz.evt.click, function(d) {
      if (vars.highlight) {
        var temp = vars.highlight;
        vars.highlight = null;
        d3.select("#path"+temp).call(color_paths);
        vars.clicked = false;
        zoom(vars.boundries);
        info();
      }
    })
    
  viz_enter.append('g')
    .attr('class','paths');
    
  // add scale
  
  if (!vars.small) {
    var gradient = defs
      .append("svg:linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")
      .attr("spreadMethod", "pad");
       
    data_range.forEach(function(v,i){
      gradient.append("stop")
        .attr("offset",Math.round((i/(data_range.length-1))*100)+"%")
        .attr("stop-color", value_color(v))
        .attr("stop-opacity", 1)
    })
    
    var scale = vars.parent_enter.append('g')
      .attr('class','scale')
      .style("opacity",0)
      .attr("transform","translate("+(vars.width-info_width-5)+","+5+")");
    
    scale.append("rect")
      .attr("width", info_width+"px")
      .attr("height", (scale_height*5)+"px")
      .attr("fill","#ffffff")
      .attr("rx",3)
      .attr("ry",3)
      .attr("stroke","#cccccc")
      .attr("stroke-width",2)
        
    scale.append("text")
      .attr("id","scale_title")
      .attr("x",(info_width/2)+"px")
      .attr("y","0px")
      .attr("dy","1.25em")
      .attr("text-anchor","middle")
      .attr("fill","#333")
      .style("font-weight","bold")
      .attr("font-size","12px")
      .attr("font-family","Helvetica")
       
    data_range.forEach(function(v,i){
      if (i == data_range.length-1) {
        var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))-2
      } else if (i != 0) {
        var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))-1
      } else {
        var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))
      }
      scale.append("rect")
        .attr("x", x+"px")
        .attr("y", (scale_height*2)+"px")
        .attr("width", 2)
        .attr("height", (scale_height*1.5)+"px")
        .style("fill", "#333")
    
    scale.append("rect")
      .attr("x",scale_padding+"px")
      .attr("y",(scale_height*2)+"px")
      .attr("width", (info_width-(scale_padding*2))+"px")
      .attr("height", scale_height+"px")
      .style("fill", "url(#gradient)")
        
      scale.append("text")
        .attr("id","scale_"+i)
        .attr("x",x+"px")
        .attr("y", ((scale_height*3)+5)+"px")
        .attr("dy","1em")
        .attr("text-anchor","middle")
        .attr("fill","#333")
        .style("font-weight","bold")
        .attr("font-size","10px")
        .attr("font-family","Helvetica")
    })
    
    if (!data_extent[0]) {
      d3.select("g.scale").style("opacity",0)
    }
    else {

      data_range.forEach(function(v,i){
        scale.select("text#scale_"+i).text(vizwhiz.utils.format_num(v,false,2,true))
      })
      scale.select("text#scale_title").text(vars.value_var)
      d3.select("g.scale").style("opacity",1)
    }
    
    // Create Zoom Controls div on vars.svg_enter
    vars.parent.select("div#zoom_controls").remove()
    var zoom_div = vars.parent.append("div")
      .attr("id","zoom_controls")
      .style("top",function(){
        return this.offsetTop+vars.margin.top+"px";
      })
    
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
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New nodes and links enter, initialize them here
  //-------------------------------------------------------------------

  var coord = d3.select("g.paths").selectAll("path")
    .data(vars.coords)
    
  coord.enter().append("path")
    .attr("id",function(d) { return "path"+d.id } )
    .attr("d",path)
    .attr("vector-effect","non-scaling-stroke")
    .attr("opacity",0);
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for things that are already in existance
  //-------------------------------------------------------------------
  
  coord
    .on(vizwhiz.evt.over, function(d){
      if (!vars.clicked) {
        vars.highlight = d[vars.id_var];
        d3.select(this).attr("opacity",select_opacity);
        info();
      }
      if (vars.highlight != d[vars.id_var]) d3.select(this).attr("opacity",select_opacity);
    })
    .on(vizwhiz.evt.out, function(d){
      if (!vars.clicked) {
        vars.highlight = null;
        d3.select(this).attr("opacity",default_opacity);
        info();
      }
      if (vars.highlight != d[vars.id_var]) d3.select(this).attr("opacity",default_opacity);
    })
    .on(vizwhiz.evt.click, function(d) {
      if (vars.clicked && vars.highlight == d[vars.id_var]) {
        var temp = vars.highlight;
        vars.highlight = null;
        d3.select("#path"+temp).call(color_paths);
        vars.clicked = false;
        zoom(vars.boundries);
        info();
      } else {
        if (vars.highlight && vars.clicked) {
          var temp = vars.highlight;
          vars.highlight = null;
          d3.select("#path"+temp).call(color_paths);
        }
        else {
          vars.clicked = true;
        }
        vars.highlight = d[vars.id_var];
        d3.select(this).call(color_paths);
        zoom(d3.select("path#path"+vars.highlight).datum());
        info();
      }
    })
  
  coord.transition().duration(vizwhiz.timing)
    .attr("opacity",default_opacity)
    .call(color_paths);
  
  info();
    
  d3.select("g.scale").transition().duration(vizwhiz.timing)
    .attr("transform","translate("+(vars.width-info_width-5)+","+5+")");
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit, for nodes and links that are being removed
  //-------------------------------------------------------------------

  // node.exit().remove()

  //===================================================================
  
  if (vars.init) {
    zoom(vars.boundries,0);
    vars.init = false;
  }
  if (vars.clicked) {
    zoom(d3.select("path#path"+vars.highlight).datum());
  }
  
  function color_paths(p) {
    defs.selectAll("#stroke_clip").remove();
    p
      .attr("fill",function(d){ 
        if (d[vars.id_var] == vars.highlight && vars.clicked) return "none";
        else if (!data) return "#888888";
        else return data[d[vars.id_var]][vars.value_var] ? value_color(data[d[vars.id_var]][vars.value_var]) : "#888888"
      })
      .attr("stroke-width",function(d) {
        if (d[vars.id_var] == vars.highlight && vars.clicked) return 10;
        else return stroke_width;
      })
      .attr("stroke",function(d) {
        if (d[vars.id_var] == vars.highlight && vars.clicked) {
          return data[d[vars.id_var]][vars.value_var] ? value_color(data[d[vars.id_var]][vars.value_var]) : "#888888";
        }
        else return "white";
      })
      .attr("opacity",function(d){
        if (d[vars.id_var] == vars.highlight) return select_opacity;
        else return default_opacity;
      })
      .attr("clip-path",function(d){ 
        if (d[vars.id_var] == vars.highlight && vars.clicked) return "url(#stroke_clip)";
        else return "none"
      })
      .each(function(d){
        if (d[vars.id_var] == vars.highlight && vars.clicked) {
          d3.select("defs").append("clipPath")
            .attr("id","stroke_clip")
            .append("use")
              .attr("xlink:href",function(dd) { return "#path"+vars.highlight } )
        }
      });
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Zoom Function
  //-------------------------------------------------------------------
  
  function zoom(param,custom_timing) {
    
    var translate = vars.zoom_behavior.translate(),
        zoom_extent = vars.zoom_behavior.scaleExtent()
        
    var scale = vars.zoom_behavior.scale()
    
    if (param == "in") var scale = scale*2
    else if (param == "out") var scale = scale*0.5
    
    var svg_scale = scale/vars.width,
        svg_translate = [translate[0]-(scale/2),translate[1]-(((scale/vars.width)*vars.height)/2)]
        
    old_scale = vars.projection.scale()*2*Math.PI
    old_translate = vars.projection.translate()
        
    if (param.coordinates) {
      
      if (vars.clicked && vars.highlight) { 
        var left = 20, w_avail = vars.width-info_width-left
      } else {
        var left = 0, w_avail = vars.width
      }
      
      var b = path.bounds(param),
          w = (b[1][0] - b[0][0])*1.1,
          h = (b[1][1] - b[0][1])*1.1,
          s_width = (w_avail*(scale/vars.width))/w,
          s_height = (vars.height*(scale/vars.width))/h
          
      if (s_width < s_height) {
        var s = s_width*vars.width,
            offset_left = ((w_avail-(((w/1.1)/svg_scale)*s/vars.width))/2)+left,
            offset_top = (vars.height-((h/svg_scale)*s/vars.width))/2
      } else {
        var s = s_height*vars.width,
            offset_left = ((w_avail-((w/svg_scale)*s/vars.width))/2)+left,
            offset_top = (vars.height-(((h/1.1)/svg_scale)*s/vars.width))/2
      }
      
      var t_x = ((-(b[0][0]-svg_translate[0])/svg_scale)*s/vars.width)+offset_left,
          t_y = ((-(b[0][1]-svg_translate[1])/svg_scale)*s/vars.width)+offset_top
          
      var t = [t_x+(s/2),t_y+(((s/vars.width)*vars.height)/2)]
      
      translate = t
      scale = s
      
    } else if (param == "in" || param == "out") {
      
      var b = vars.projection.translate()
      
      if (param == "in") translate = [b[0]+(b[0]-(vars.width/2)),b[1]+(b[1]-(vars.height/2))]
      else if (param == "out") translate = [b[0]+(((vars.width/2)-b[0])/2),b[1]+(((vars.height/2)-b[1])/2)]
    }
    
    // Scale Boundries
    if (scale < zoom_extent[0]) scale = zoom_extent[0]
    else if (scale > zoom_extent[1]) scale = zoom_extent[1]
    // X Boundries
    if (translate[0] > scale/2) translate[0] = scale/2
    else if (translate[0] < vars.width-scale/2) translate[0] = vars.width-scale/2
    // Y Boundries
    if (translate[1] > scale/2) translate[1] = scale/2
    else if (translate[1] < vars.height-scale/2) translate[1] = vars.height-scale/2

    vars.projection.scale(scale/(2*Math.PI)).translate(translate);
    vars.zoom_behavior.scale(scale).translate(translate);
    svg_scale = scale/vars.width;
    svg_translate = [translate[0]-(scale/2),translate[1]-(((scale/vars.width)*vars.height)/2)];
    
    if (typeof custom_timing != "number") {
      if (d3.event) {
        if (d3.event.scale) {
          if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
            var zoom_timing = 0
          } else {
            var zoom_timing = vizwhiz.timing
          }
        } else {
          var zoom_timing = vizwhiz.timing
        }
      } else {
        var zoom_timing = vizwhiz.timing*4
      }
    } else var zoom_timing = custom_timing

    if (vars.tiles) update_tiles(zoom_timing);
    
    if (zoom_timing > 0) var viz_transition = d3.selectAll(".viz").transition().duration(zoom_timing)
    else var viz_transition = d3.selectAll(".viz")
    
    viz_transition.attr("transform","translate(" + svg_translate + ")" + "scale(" + svg_scale + ")")
        
  }

  //===================================================================

  function info() {
    
    vizwhiz.tooltip.remove();
    
    if (vars.highlight && !vars.small) {
      
      var tooltip_data = {}, sub_title = null
      
      if (!data[vars.highlight][vars.value_var]) sub_title = "No Data Available"
      else {
        if (!vars.clicked) sub_title = "Click for More Info"
        else {
          vars.tooltip_info.forEach(function(t){
            if (data[vars.highlight][t]) tooltip_data[t] = data[vars.highlight][t]
          })
        }
      }
      
      vizwhiz.tooltip.create({
        "parent": vars.svg,
        "data": tooltip_data,
        "title": data[vars.highlight][vars.text_var],
        "description": sub_title,
        "x": vars.width,
        "y": 0+vars.margin.top,
        "offset": (scale_height*5)+10,
        "width": info_width,
        "arrow": false
      })
      
    }
    
  }

  function tileUrl(d) {
    // Standard OSM
    // return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
    // Custom CloudMade
    return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.cloudmade.com/c3cf91e1455249adaef26d096785dc90/88261/256/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
  }
  
  function update_tiles(image_timing) {

    var t = vars.projection.translate(),
        s = vars.projection.scale()*2*Math.PI;
        
    var tiles = tile.scale(s).translate(t)(),
        old_tiles = tile.scale(old_scale).translate(old_translate)()
    
    var image = d3.select("g.tiles").selectAll("image.tile")
      .data(tiles, function(d) { return d; });
      
    image.enter().append('image')
      .attr('class', 'tile')
      .attr('xlink:href', tileUrl)
      .attr("opacity",0)
      .attr("width", Math.ceil(tiles.scale/(s/old_scale)))
      .attr("height", Math.ceil(tiles.scale/(s/old_scale)))
      .attr("x", function(d) { 
        var test = -(t[0]-(s/(old_scale/old_translate[0])));
        return Math.ceil(((d[0] + tiles.translate[0]) * tiles.scale)+test)/(s/old_scale); 
      })
      .attr("y", function(d) { 
        var test = -(t[1]-(s/(old_scale/old_translate[1])));
        return Math.ceil(((d[1] + tiles.translate[1]) * tiles.scale)+test)/(s/old_scale); 
      });

    if (image_timing > 0) var image_transition = image.transition().duration(image_timing)
    else var image_transition = image

    image_transition
      .attr("opacity",1)
      .attr("width", Math.ceil(tiles.scale))
      .attr("height", Math.ceil(tiles.scale))
      .attr("x", function(d) { return Math.ceil((d[0] + tiles.translate[0]) * tiles.scale); })
      .attr("y", function(d) { return Math.ceil((d[1] + tiles.translate[1]) * tiles.scale); });
    image.exit().remove();
      
      
  }
};

vizwhiz.pie_scatter = function(data,vars) {

  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X & Y Axis formatting help
  //-------------------------------------------------------------------
  
  var x_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(25)
    .orient('bottom')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      // background line
      
      var bgtick = d3.select(this.parentNode).selectAll(".bgtick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","bgtick")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0-1)
        .attr("y2", -graph.height+1)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1)
      
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("y2", -graph.height+1)
        
      // tick
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 1)
        .attr("y2", 20)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      return vizwhiz.utils.format_num(d, false, 3, true);
    });
  
  var y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(25)
    .orient('left')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      // background line
      
      var bgtick = d3.select(this.parentNode).selectAll(".bgtick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","bgtick")
        .attr("x1", 0+1)
        .attr("x2", 0+graph.width-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1)
        
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("x2", 0+graph.width-1)
        
      // tick
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", -20)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#4c4c4c")
        .attr("stroke-width",1)
      // return parseFloat(d.toFixed(3))
      return vizwhiz.utils.format_num(d, false, 3, true);
    });

  //===================================================================
      
  if (vars.small) {
    var graph_margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
  }
  else {
    var graph_margin = {"top": 10, "right": 40, "bottom": 80, "left": 90}
  }

  graph = {
        "width": vars.width-graph_margin.left-graph_margin.right,
        "height": vars.height-graph_margin.top-graph_margin.bottom,
        "x": graph_margin.left,
        "y": graph_margin.top
      }
  
  // container for the visualization
  var viz_enter = vars.parent_enter.append("g").attr("class", "viz")
    .attr("transform", "translate(" + graph.x + "," + graph.y + ")")

  // add grey background for viz
  viz_enter.append("rect")
    .style('stroke','#000')
    .style('stroke-width',1)
    .style('fill','#efefef')
    .attr("class","background")
    .attr('x',0)
    .attr('y',0)
    .attr('width', graph.width)
    .attr('height', graph.height)
    
  // update (in case width and height are changed)
  d3.select(".viz").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(" + graph.x + "," + graph.y + ")")
    .select("rect")
      .attr('width', graph.width)
      .attr('height', graph.height)
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------
    
  var data_range = d3.extent(data, function(d){ return d[vars.value_var]; })
  
  if (!data_range[1]) data_range = [0,0]
  
  var size_scale = d3.scale.linear()
    .domain(data_range)
    .range([d3.max([d3.min([vars.width,vars.height])/75,5]), d3.max([d3.min([vars.width,vars.height])/10,10])])
    .nice()
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X AXIS
  //-------------------------------------------------------------------
  
  // create scale for buffer of largest item
  if (vars.xaxis_domain.length < 2) var x_domain = d3.extent(data, function(d){ return d[vars.xaxis_var]; })
  else var x_domain = vars.xaxis_domain
  
  var x_scale = d3.scale.linear()
    .domain(x_domain)
    .range([0, graph.width])
    .nice()
    
  // get buffer room (take into account largest size var)
  var inverse_x_scale = d3.scale.linear().domain(x_scale.range()).range(x_scale.domain())
  var largest_size = size_scale.range()[1]
  // convert largest size to x scale domain
  largest_size = inverse_x_scale(largest_size)
  // get radius of largest in pixels by subtracting this value from the x scale minimum
  var x_buffer = largest_size - x_scale.domain()[0];
  // update x scale with new buffer offsets
  x_scale.domain([x_scale.domain()[0]-x_buffer, x_scale.domain()[1]+x_buffer])
  // enter
  var xaxis_enter = viz_enter.append("g")
    .attr("transform", "translate(0," + graph.height + ")")
    .attr("class", "xaxis")
    .call(x_axis.scale(x_scale))
  
  // update
  d3.select(".xaxis").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(0," + graph.height + ")")
    .call(x_axis.scale(x_scale))
  
  // also update background tick lines
  d3.selectAll(".x_bg_line")
    .attr("y2", -graph.height-1)
  
  // label
  xaxis_enter.append('text')
    .attr('y', 60)
    .attr('class', 'axis_title_x')
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Helvetica")
    .attr("fill", "#4c4c4c")
    .attr('width', graph.width)
    .attr('x', graph.width/2)
    .text(vars.xaxis_var)
  
  // update label
  d3.select(".axis_title_x").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr('x', graph.width/2)
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Y AXIS
  //-------------------------------------------------------------------
  // 
  if (vars.yaxis_domain.length < 2) var y_domain = d3.extent(data, function(d){ return d[vars.yaxis_var]; }).reverse();
  else var y_domain = vars.yaxis_domain;
  
  var y_scale = d3.scale.linear()
    .domain(y_domain)
    .range([0, graph.height])
    .nice()

  // get buffer room (take into account largest size var)
  var inverse_y_scale = d3.scale.linear().domain(y_scale.range()).range(y_scale.domain())
  largest_size = size_scale.range()[1]
  // convert largest size to x scale domain
  largest_size = inverse_y_scale(largest_size)
  // get radius of largest in pixels by subtracting this value from the x scale minimum
  var y_buffer = largest_size - y_scale.domain()[0];
  // update x scale with new buffer offsets
  y_scale.domain([y_scale.domain()[0]-y_buffer, y_scale.domain()[1]+y_buffer])

  // enter
  var yaxis_enter = viz_enter.append("g")
    .attr("class", "yaxis")
    .call(y_axis.scale(y_scale))
  
  // update
  d3.select(".yaxis").transition().duration(vizwhiz.timing)
    .call(y_axis.scale(y_scale))
  
  // also update background tick lines
  d3.selectAll(".y_bg_line")
    .attr("x2", 0+graph.width-1)
  
  // label
  yaxis_enter.append('text')
    .attr('class', 'axis_title_y')
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Helvetica")
    .attr("fill", "#4c4c4c")
    .attr('width', graph.width)
    .attr("transform", "translate(" + (graph.x-150) + "," + (graph.y+graph.height/2) + ") rotate(-90)")
    .text(vars.yaxis_var)
    
  // update label
  d3.select(".axis_title_y").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr("transform", "translate(" + (graph.x-150) + "," + (graph.y+graph.height/2) + ") rotate(-90)")
  
  //===================================================================
  
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // NODES
  //-------------------------------------------------------------------
  
  var arc = d3.svg.arc()
    .innerRadius(0)
    .startAngle(0)
    .outerRadius(function(d) { return d.arc_radius })
    .endAngle(function(d) { return d.arc_angle })
  
  // sort nodes so that smallest are always on top
  data.sort(function(node_a, node_b){
    return node_b[vars.value_var] - node_a[vars.value_var];
  })
  
  var nodes = d3.select("g.viz")
    .selectAll("g.circle")
    .data(data, function(d){ return d.name; })
  
  nodes.enter().append("g")
    .attr("opacity", 0)
    .attr("class", "circle")
    .attr("transform", function(d) { return "translate("+x_scale(d[vars.xaxis_var])+","+y_scale(d[vars.yaxis_var])+")" } )
    .each(function(d){
      
      d3.select(this)
        .append("circle")
        .style("stroke", function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) return "#333";
          else return d.color;
        })
        .style('stroke-width', 2)
        .style('fill', function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) return d.color;
          else {
            var c = d3.hsl(d.color);
            c.l = 0.95;
            return c.toString();
          }
        })
        .attr("r", 0 )
        
      vars.arc_angles[d.id] = 0
      vars.arc_sizes[d.id] = 0
        
      d3.select(this)
        .append("path")
        .style('fill', d.color )
        .style("fill-opacity", 1)
        
      d3.select(this).select("path").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween)
        
    })
  
  // update
  
  nodes
    .on(vizwhiz.evt.over, hover(x_scale, y_scale, size_scale, graph))
    .on(vizwhiz.evt.out, function(){
      vizwhiz.tooltip.remove();
      d3.selectAll(".axis_hover").remove();
    })
    
  nodes.transition().duration(vizwhiz.timing)
    .attr("transform", function(d) { return "translate("+x_scale(d[vars.xaxis_var])+","+y_scale(d[vars.yaxis_var])+")" } )
    .attr("opacity", 1)
    .each(function(d){
      
      var val = d[vars.value_var] ? d[vars.value_var] : size_scale.domain()[0]
      d.arc_radius = size_scale(val);
      
      d3.select(this).select("circle").transition().duration(vizwhiz.timing)
        .style("stroke", function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) return "#333";
          else return d.color;
        })
        .style('fill', function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) return d.color;
          else {
            var c = d3.hsl(d.color);
            c.l = 0.95;
            return c.toString();
          }
        })
        .attr("r", d.arc_radius )

      
      if (d.num_children) {
        d.arc_angle = (((d.num_children_active / d.num_children)*360) * (Math.PI/180));
        d3.select(this).select("path").transition().duration(vizwhiz.timing)
          .attrTween("d",arcTween)
          .each("end", function(dd) {
            vars.arc_angles[d.id] = d.arc_angle
            vars.arc_sizes[d.id] = d.arc_radius
          })
      }
      
    })
  
  // exit
  nodes.exit()
    .transition().duration(vizwhiz.timing)
    .attr("opacity", 0)
    .remove()
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // TICKS
  //-------------------------------------------------------------------
  
  var ticks = d3.select("g.viz")
    .selectAll("g.ticks")
    .data(data, function(d){ return d.name; })
  
  var ticks_enter = ticks.enter().append("g")
    .attr("class", "ticks")
  
  // y ticks
  // ENTER
  ticks_enter.append("line")
    .attr("class", "yticks")
    .attr("x1", -10)
    .attr("x2", 0)
    .attr("y1", function(d){ return y_scale(d[vars.yaxis_var]) })
    .attr("y2", function(d){ return y_scale(d[vars.yaxis_var]) })
    .attr("stroke", function(d){ return d.color; })
    .attr("stroke-width", 1)
  
  // UPDATE      
  ticks.selectAll(".yticks").transition().duration(vizwhiz.timing)
    .attr("x1", -10)
    .attr("x2", 0)
    .attr("y1", function(d){ return y_scale(d[vars.yaxis_var]) })
    .attr("y2", function(d){ return y_scale(d[vars.yaxis_var]) })
  
  // x ticks
  // ENTER
  ticks_enter.append("line")
    .attr("class", "xticks")
    .attr("y1", graph.height)
    .attr("y2", graph.height + 10)      
    .attr("x1", function(d){ return x_scale(d[vars.xaxis_var]) })
    .attr("x2", function(d){ return x_scale(d[vars.xaxis_var]) })
    .attr("stroke", function(d){ return d.color; })
    .attr("stroke-width", 1)
  
  // UPDATE
  ticks.selectAll(".xticks").transition().duration(vizwhiz.timing)
    .attr("y1", graph.height)
    .attr("y2", graph.height + 10)      
    .attr("x1", function(d){ return x_scale(d[vars.xaxis_var]) })
    .attr("x2", function(d){ return x_scale(d[vars.xaxis_var]) })
  
  // EXIT (needed for when things are filtered/soloed)
  ticks.exit().remove()
  
  //===================================================================
  
  
  // Draw foreground bounding box
  viz_enter.append('rect')
    .style('stroke','#000')
    .style('stroke-width',1*2)
    .style('fill','none')
    .attr('class', "border")
    .attr('width', graph.width)
    .attr('height', graph.height)
    .attr('x',0)
    .attr('y',0)
  
  // update (in case width and height are changed)
  d3.select(".border").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr('height', graph.height)
  
  // Always bring to front
  d3.select("rect.border").node().parentNode.appendChild(d3.select("rect.border").node())
  
  function arcTween(b) {
    var i = d3.interpolate({arc_angle: vars.arc_angles[b.id], arc_radius: vars.arc_sizes[b.id]}, b);
    return function(t) {
      return arc(i(t));
    };
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hover over nodes
  //-------------------------------------------------------------------
  
  function hover(x_scale, y_scale, size_scale, xsize){

      return function(d){
        
        var val = d[vars.value_var] ? d[vars.value_var] : size_scale.domain()[0]
        var radius = size_scale(val),
            x = x_scale(d[vars.xaxis_var]),
            y = y_scale(d[vars.yaxis_var]),
            color = d.active || d.num_children_active/d.num_children == 1 ? "#333" : d.color,
            viz = d3.select("g.viz"),
            tooltip_data = {};
            
        // vertical line to x-axis
        viz.append("line")
          .attr("class", "axis_hover")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", y+radius+1) // offset so hover doens't flicker
          .attr("y2", graph.height)
          .attr("stroke", color)
          .attr("stroke-width", 2)
      
        // horizontal line to y-axis
        viz.append("line")
          .attr("class", "axis_hover")
          .attr("x1", 0)
          .attr("x2", x-radius) // offset so hover doens't flicker
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", color)
          .attr("stroke-width", 2)
      
        // x-axis value box
        viz.append("rect")
          .attr("class", "axis_hover")
          .attr("x", x-25)
          .attr("y", graph.height)
          .attr("width", 50)
          .attr("height", 20)
          .attr("fill", "white")
          .attr("stroke", color)
          .attr("stroke-width", 2)
      
        // xvalue text element
        viz.append("text")
          .attr("class", "axis_hover")
          .attr("x", x)
          .attr("y", graph.height)
          .attr("dy", 14)
          .attr("text-anchor","middle")
          .style("font-weight","bold")
          .attr("font-size","12px")
          .attr("font-family","Helvetica")
          .attr("fill","#4c4c4c")
          .text(vizwhiz.utils.format_num(d[vars.xaxis_var], false, 3, true))
      
        // y-axis value box
        viz.append("rect")
          .attr("class", "axis_hover")
          .attr("x", -50)
          .attr("y", y-10)
          .attr("width", 50)
          .attr("height", 20)
          .attr("fill", "white")
          .attr("stroke", color)
          .attr("stroke-width", 2)
      
        // xvalue text element
        viz.append("text")
          .attr("class", "axis_hover")
          .attr("x", -25)
          .attr("y", y-10)
          .attr("dy", 14)
          .attr("text-anchor","middle")
          .style("font-weight","bold")
          .attr("font-size","12px")
          .attr("font-family","Helvetica")
          .attr("fill","#4c4c4c")
          .text(vizwhiz.utils.format_num(d[vars.yaxis_var], false, 3, true))
      
        vars.tooltip_info.forEach(function(t){
          if (d[t]) tooltip_data[t] = d[t]
        })
      
        vizwhiz.tooltip.create({
          "parent": viz,
          "id": d.id,
          "data": tooltip_data,
          "title": d[vars.text_var],
          "x": x,
          "y": y,
          "offset": radius,
          "arrow": true
        })
      }
  }
  
  //===================================================================
  
};
vizwhiz.bubbles = function(data,vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------
  
  var groups = {},
      donut_size = 0.35,
      title_height = vars.small ? 0 : 30,
      arc_offset = vars.donut ? donut_size : 0,
      sort_order = vars.sort == "value" ? vars.value_var : vars.sort;
      
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
  
  var arc_bg = d3.svg.arc()
    .startAngle(0)
    .innerRadius(function(d) { return d.arc_inner_bg })
    .outerRadius(function(d) { return d.arc_radius_bg })
    .endAngle(360);
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate positioning for each bubble
  //-------------------------------------------------------------------
  
  var data_nested = {}
  data_nested.key = "root";
  data_nested.values = d3.nest()
    .key(function(d){ return d[vars.grouping] })
    .entries(data)

  var pack = d3.layout.pack()
    .size([vars.width,vars.height])
    .children(function(d) { return d.values; })
    .padding(5)
    .value(function(d) { return d[vars.value_var]; })
    .sort(function(a,b) { 
      if (a.values && b.values) return a.values.length - b.values.length;
      else return a[vars.value_var] - b[vars.value_var];
    })
  
  var data_packed = pack.nodes(data_nested)
    .filter(function(d){
      if (d.depth == 1) {
        if (d.children.length == 1 ) {
          d[vars.text_var] = d.children[0][vars.text_var];
          d.category = d.children[0].category;
        }
        else {
          d[vars.text_var] = d.key;
          d.category = d.key;
        }
        d[vars.value_var] = d.value;
      }
      return d.depth == 1;
    })
    .sort(function(a,b){
      if (typeof a[sort_order] == "number") {
        if(a[sort_order] < b[sort_order]) return 1;
        if(a[sort_order] > b[sort_order]) return -1;
      }
      else {
        if(a[sort_order] < b[sort_order]) return -1;
        if(a[sort_order] > b[sort_order]) return 1;
      }
      return 0;
    })
  
  if(data_packed.length == 1) {
    var columns = 1,
        rows = 1;
  }
  else if (data_packed.length < 4) {
    var columns = data_packed.length,
        rows = 1;
  } 
  else {
    var rows = Math.ceil(Math.sqrt(data_packed.length/(vars.width/vars.height))),
        columns = Math.ceil(Math.sqrt(data_packed.length*(vars.width/vars.height)));
  }
  
  while ((rows-1)*columns >= data_packed.length) rows--
  

  
  var max_size = d3.max(data_packed,function(d){return d.r;})*2,
      downscale = (d3.min([vars.width/columns,(vars.height/rows)-title_height])*0.9)/max_size;
  
  var r = 0, c = 0;
  data_packed.forEach(function(d){
    
    if (d.depth == 1) {
      
      if (vars.grouping != "active") {
        var color = d.children[0].color;
      }
      else {
        var color = "#cccccc";
      }
      
      color = d3.rgb(color).hsl()
      if (color.s > 0.9) color.s = 0.75
      while (color.l > 0.75) color = color.darker()
      color = color.rgb()
      
      groups[d.key] = {};
      groups[d.key].color = color;
      groups[d.key].children = d.children.length;
      groups[d.key].key = d.key;
      groups[d.key][vars.text_var] = d[vars.text_var];
      groups[d.key].x = ((vars.width/columns)*c)+((vars.width/columns)/2);
      groups[d.key].y = ((vars.height/rows)*r)+((vars.height/rows)/2)+(title_height/2);
      groups[d.key].width = (vars.width/columns);
      groups[d.key].height = (vars.height/rows);
      groups[d.key].r = d.r*downscale;

      if (c < columns-1) c++
      else {
        c = 0
        r++
      }
      
    }
    
  })
  
  data.forEach(function(d){
    var parent = data_packed.filter(function(p){ 
      if (d[vars.grouping] === false) var key = "false";
      else if (d[vars.grouping] === true) var key = "true";
      else var key = d[vars.grouping]
      return key == p.key 
    })[0]
    d.x = (downscale*(d.x-parent.x))+groups[parent.key].x;
    d.y = (downscale*(d.y-parent.y))+groups[parent.key].y;
    d.r = d.r*downscale;
  })
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Set up initial SVG groups
  //-------------------------------------------------------------------
    
  vars.parent_enter.append('g')
    .attr('class','groups');
    
  vars.parent_enter.append('g')
    .attr('class','bubbles');
    
  vars.parent_enter.append('g')
    .attr('class','labels');
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New labels enter, initialize them here
  //-------------------------------------------------------------------

  if (vars.small) groups = {};

  var group = d3.select("g.groups").selectAll("g.group")
    .data(d3.values(groups),function(d){ return d.key })
    
  group.enter().append("g")
    .attr("class", "group")
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      if (vars.grouping == "active") {
        var t = d[vars.text_var] == "true" ? "Fully "+vars.active_var : "Not Fully "+vars.active_var
      } else {
        var t = d[vars.text_var]
      }
        
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
            "text": t,
            "parent": this,
            "width": d.width,
            "height": 30
          })
        })
      
    });
    
  group.transition().duration(vizwhiz.timing)
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      if (vars.group_bgs && d.children > 1) {
        
        var bg = d3.select(this).selectAll("circle")
          .data([d]);
        
        bg.enter().append("circle")
          .attr("fill", d.color )
          .attr("stroke",d.color)
          .attr("stroke-width",1)
          .style('fill-opacity', 0.1 )
          .attr("opacity",0)
          .attr("r",d.r)
        
        bg.transition().duration(vizwhiz.timing)
          .attr("opacity",1)
          .attr("r",d.r);
          
      } else {
        d3.select(this).select("circle").transition().duration(vizwhiz.timing)
          .attr("opacity",0)
          .remove();
      }
      
      d3.select(this).select("text").transition().duration(vizwhiz.timing)
        .attr("opacity",1)
        .attr('y',function(dd) {
          return -(d.height/2)-title_height/4;
        })
      
    });
    
  group.exit().transition().duration(vizwhiz.timing)
    .each(function(d){
      
      if (vars.group_bgs) {
        d3.select(this).select("circle").transition().duration(vizwhiz.timing)
          .attr("r",0)
          .attr("opacity",0);
      }
      
      d3.select(this).selectAll("text").transition().duration(vizwhiz.timing)
        .attr("opacity",0);
        
    }).remove();
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New bubbles enter, initialize them here
  //-------------------------------------------------------------------

  var bubble = d3.select("g.bubbles").selectAll("g.bubble")
    .data(data,function(d){ return d[vars.id_var] })
    
  bubble.enter().append("g")
    .attr("class", "bubble")
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      vars.arc_sizes[d[vars.id_var]+"_bg"] = 0
      vars.arc_inners[d[vars.id_var]+"_bg"] = 0
      
      var bg_color = d3.hsl(d.color)
      bg_color.l = 0.95
      bg_color = bg_color.toString()
      
      d3.select(this).append("path")
        .attr("class","bg")
        .attr("fill", bg_color )
        .attr("stroke", d.color )
        .attr("stroke-width",1)
      
      d3.select(this).select("path.bg").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween_bg)
    
      if (d.elsewhere) {
    
        vars.arc_angles[d[vars.id_var]+"_else"] = 0
        vars.arc_sizes[d[vars.id_var]+"_else"] = 0
        vars.arc_inners[d[vars.id_var]+"_else"] = 0
      
        d3.select(this).append("path")
          .attr("class","elsewhere")
          .style('fill', d.color )
          .style('fill-opacity', 0.5 )
      
        d3.select(this).select("path.elsewhere").transition().duration(vizwhiz.timing)
          .attrTween("d",arcTween_else)
      }
      
      vars.arc_angles[d[vars.id_var]] = 0
      vars.arc_sizes[d[vars.id_var]] = 0
      vars.arc_inners[d[vars.id_var]] = 0
      
      d3.select(this).append("path")
        .each(function(dd) { dd.arc_id = dd[vars.id_var]; })
        .attr("class","available")
        .style('fill', d.color )
      
      d3.select(this).select("path.available").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween)
        
    })
    .transition().duration(vizwhiz.timing)
    .each(function(d){
    
      if (vars.donut) d.arc_inner_bg = d.r*arc_offset;
      else d.arc_inner_bg = 0;
      d.arc_radius_bg = d.r;
      
      d3.select(this).select("path.bg").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween_bg)
        .each("end", function() {
          vars.arc_sizes[d[vars.id_var]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id_var]+"_bg"] = d.arc_inner_bg
        })
        
        
      var arc_start = d.r*arc_offset;
      
      d.arc_inner = arc_start;
      d.arc_radius = arc_start+(d.r-arc_start);

      d3.select(this).select("path.available").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_sizes[d[vars.id_var]] = d.arc_radius
          vars.arc_inners[d[vars.id_var]] = d.arc_inner
          
          if (d.total) d.arc_angle = (((d[vars.active_var] / d.total)*360) * (Math.PI/180));
          else if (d.active) d.arc_angle = Math.PI; 
          
          d.arc_angle = d.arc_angle < Math.PI*2 ? d.arc_angle : Math.PI*2
          
          d3.select(this).transition().duration(vizwhiz.timing*(d.arc_angle/2))
            .attrTween("d",arcTween)
            .each("end", function() {
              vars.arc_angles[d[vars.id_var]] = d.arc_angle
            })
        })
    
      if (d.elsewhere) {
      
        d.arc_inner_else = arc_start;
        d.arc_radius_else = d.r;
      
        d3.select(this).select("path.elsewhere").transition().duration(vizwhiz.timing)
          .attrTween("d",arcTween_else)
          .each("end", function() {
            vars.arc_sizes[d[vars.id_var]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id_var]+"_else"] = d.arc_inner_else
      
            d.arc_angle_else = d.arc_angle + (((d.elsewhere / d.total)*360) * (Math.PI/180));

            d.arc_angle_else = d.arc_angle_else < Math.PI*2 ? d.arc_angle_else : Math.PI*2
            
            d3.select(this).transition().duration(vizwhiz.timing*(d.arc_angle_else/2))
              .attrTween("d",arcTween_else)
              .each("end", function() {
                vars.arc_angles[d[vars.id_var]+"_else"] = d.arc_angle_else
              })
          })
      }
      
    });
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for things that are already in existance
  //-------------------------------------------------------------------
    
  bubble
    .on(vizwhiz.evt.over, function(d){
      
      var tooltip_data = {}
      vars.tooltip_info.forEach(function(t){
        if (d[t]) tooltip_data[t] = d[t]
      })
      
      vizwhiz.tooltip.create({
        "parent": vars.svg,
        "id": d[vars.id_var],
        "data": tooltip_data,
        "title": d[vars.text_var],
        "x": d.x,
        "y": d.y,
        "offset": d.r,
        "arrow": true
      })
      
    })
    .on(vizwhiz.evt.out, function(d){
      vizwhiz.tooltip.remove(d[vars.id_var])
    })
  
  bubble.transition().duration(vizwhiz.timing)
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each("end",function(d){
      if (vars.donut) d.arc_inner_bg = d.r*arc_offset;
      else d.arc_inner_bg = 0;
      d.arc_radius_bg = d.r;
    
      d3.select(this).select("path.bg").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween_bg)
        .each("end", function() {
          vars.arc_sizes[d[vars.id_var]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id_var]+"_bg"] = d.arc_inner_bg
        })
      
      
      var arc_start = d.r*arc_offset;
    
      d.arc_inner = arc_start;
      d.arc_radius = arc_start+(d.r-arc_start);
        
      if (d.total) d.arc_angle = (((d[vars.active_var] / d.total)*360) * (Math.PI/180));
      else if (d.active) d.arc_angle = Math.PI; 
    
      d.arc_angle = d.arc_angle < Math.PI*2 ? d.arc_angle : Math.PI*2

      d3.select(this).select("path.available").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_sizes[d[vars.id_var]] = d.arc_radius
          vars.arc_inners[d[vars.id_var]] = d.arc_inner
          vars.arc_angles[d[vars.id_var]] = d.arc_angle
        })
  
      if (d.elsewhere) {
    
        d.arc_inner_else = arc_start;
        d.arc_radius_else = d.r;
      
        d.arc_angle_else = d.arc_angle + (((d.elsewhere / d.total)*360) * (Math.PI/180));
        d.arc_angle_else = d.arc_angle_else < Math.PI*2 ? d.arc_angle_else : Math.PI*2
    
        d3.select(this).select("path.elsewhere").transition().duration(vizwhiz.timing)
          .attrTween("d",arcTween_else)
          .each("end", function() {
            vars.arc_sizes[d[vars.id_var]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id_var]+"_else"] = d.arc_inner_else
            vars.arc_angles[d[vars.id_var]+"_else"] = d.arc_angle_else
          })
      }
    })
      
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
          vars.arc_sizes[d[vars.id_var]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id_var]+"_bg"] = d.arc_inner_bg
        })
    
      d.arc_radius = 0;
      d.arc_angle = 0; 
      d.arc_inner = 0;

      d3.select(this).select("path.available").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_angles[d[vars.id_var]] = d.arc_angle
          vars.arc_sizes[d[vars.id_var]] = d.arc_radius
          vars.arc_inners[d[vars.id_var]] = d.arc_inner
        })
    
      if (d.elsewhere) {
      
        d.arc_angle_else = 0;
        d.arc_radius_else = 0;
        d.arc_inner_else = 0;
      
        d3.select(this).select("path.elsewhere").transition().duration(vizwhiz.timing)
          .attrTween("d",arcTween_else)
          .each("end", function(dd) {
            vars.arc_angles[d[vars.id_var]+"_else"] = d.arc_angle_else
            vars.arc_sizes[d[vars.id_var]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id_var]+"_else"] = d.arc_inner_else
          })
      }

      d3.select(this).select("circle.hole").transition().duration(vizwhiz.timing)
        .attr("r", 0)
      
    })
    .remove();

  //===================================================================
  
  function arcTween(b) {
    var i = d3.interpolate({arc_angle: vars.arc_angles[b[vars.id_var]], arc_radius: vars.arc_sizes[b[vars.id_var]], arc_inner: vars.arc_inners[b[vars.id_var]]}, b);
    return function(t) {
      return arc(i(t));
    };
  }
  
  function arcTween_else(b) {
    var i = d3.interpolate({arc_angle_else: vars.arc_angles[b[vars.id_var]+"_else"], arc_radius_else: vars.arc_sizes[b[vars.id_var]+"_else"], arc_inner_else: vars.arc_inners[b[vars.id_var]+"_else"]}, b);
    return function(t) {
      return arc_else(i(t));
    };
  }
  
  function arcTween_bg(b) {
    var i = d3.interpolate({arc_radius_bg: vars.arc_sizes[b[vars.id_var]+"_bg"], arc_inner_bg: vars.arc_inners[b[vars.id_var]+"_bg"]}, b);
    return function(t) {
      return arc_bg(i(t));
    };
  }

  //===================================================================
};

vizwhiz.rings = function(data,vars) {
      
  var tree_radius = vars.height > vars.width ? vars.width/2 : vars.height/2,
      node_size = d3.scale.linear().domain([1,2]).range([8,4]),
      ring_width = vars.small ? tree_radius/2.25 : tree_radius/3,
      total_children,
      hover = null;
      
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
      if (d.source[vars.id_var] == vars.highlight) {
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
        hover = d;
        update();
      }
    })
    .on(vizwhiz.evt.out,function(d){
      if (d.depth != 0) {
        hover = null;
        update();
      }
    })
    .on(vizwhiz.evt.click,function(d){
      if (d.depth != 0) vars.parent.call(chart.highlight(d[vars.id_var]));
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
  
  hover = null;
  update();
  
  function update() {
    if (!vars.small) {
      link.call(line_styles);
      d3.selectAll(".node circle").call(circle_styles);
      d3.selectAll(".node text").call(text_styles);
    
      if (vars.highlight) {
        
        var prod = data.filter(function(d){return d[vars.id_var] == vars.highlight })[0]
      
        var tooltip_data = {}
        vars.tooltip_info.forEach(function(t){
          if (prod[t]) tooltip_data[t] = prod[t]
        })

        vizwhiz.tooltip.remove();
        vizwhiz.tooltip.create({
          "parent": vars.svg,
          "data": tooltip_data,
          "title": prod[vars.text_var],
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
        if (hover) {
          if (d.source == hover || d.target == hover || 
          (hover.depth == 2 && (hover.parents.indexOf(d.target) >= 0))) {
            this.parentNode.appendChild(this);
            return "#cc0000";
          } else if (hover.depth == 1 && hover.children_total.indexOf(d.target) >= 0) {
            return "#ffbbbb";
          } else return "#ddd";
        } else return "#ddd";
      })
      .attr("stroke-width", "1.5")
      .attr("opacity",function(d) {
        if (hover && d3.select(this).attr("stroke") == "#ddd") {
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
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "lightgrey"
      
      })
      .attr("stroke", function(d){
        if(d[vars.active_var]){
          var color = d3.rgb(d.color).darker().darker().toString();
        } else {
          var color = d3.rgb(d.color).darker().toString()
        }
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
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
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "lightgrey"
      })
  }
  
  function get_root(){
    
    var prod = data.filter(function(d){return d[vars.id_var] == vars.highlight })[0]
    
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
    var prim_links = vars.connections[prod[vars.id_var]]
    if (prim_links) {
      prim_links.forEach(function(child){
      
        var prod = data.filter(function(d){return d[vars.id_var] == child[vars.id_var] })[0]
  
        // give first level child the properties
        child.ring_x = 0;
        child.ring_y = ring_width;
        child.depth = 1;
        child[vars.text_var] = prod[vars.text_var]
        child.children = []
        child.children_total = []
        child.color = prod.color
        child[vars.active_var] = prod[vars.active_var]
  
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

        var sec_links = vars.connections[nodes[len][vars.id_var]]
        if (sec_links) {
          sec_links.forEach(function(grandchild){
    
            // if grandchild isn't already a first level child or the center node
            if (prim_links.indexOf(grandchild) < 0 && grandchild[vars.id_var] != prod[vars.id_var]) {
      
              var grand_prod = data.filter(function(d){return d[vars.id_var] == grandchild[vars.id_var] })[0]
          
              grandchild.ring_x = 0;
              grandchild.ring_y = ring_width*2;
              grandchild.depth = 2;
              grandchild[vars.text_var] = grand_prod[vars.text_var]
              grandchild.color = grand_prod.color
              grandchild[vars.active_var] = grand_prod[vars.active_var]
              grandchild.parents = []

              var s = 10000, node_id = 0;
              prim_links.forEach(function(node){
                var temp_links = vars.connections[node[vars.id_var]]
                temp_links.forEach(function(node2){
                  if (node2[vars.id_var] == grandchild[vars.id_var]) {
                    grandchild.parents.push(node);
                    if (temp_links.length < s) {
                      s = temp_links.length
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
  
      }
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

})();
