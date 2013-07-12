(function(){
var vizwhiz = window.vizwhiz || {};

vizwhiz.version = '0.0.1';

window.vizwhiz = vizwhiz;

vizwhiz.timing = 600; // milliseconds for animations

vizwhiz.tooltip = {}; // For the tooltip system
vizwhiz.utils = {}; // Utility subsystem
vizwhiz.evt = {}; // stores all mouse events that could occur

vizwhiz.ie = /*@cc_on!@*/false;

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
  if (vizwhiz.ie) {
    vizwhiz.evt.over = 'mouseenter'
    vizwhiz.evt.out = 'mouseleave'
  }
  else {
    vizwhiz.evt.over = 'mouseover'
    vizwhiz.evt.out = 'mouseout'
  }
  vizwhiz.evt.move = 'mousemove'
}
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
// Darkens a color if it's too light to appear on white
//-------------------------------------------------------------------

vizwhiz.utils.darker_color = function(color) {
  var hsl = d3.hsl(color)
  if (hsl.s > .9) hsl.s = .9
  if (hsl.l > .4) hsl.l = .4
  return hsl.toString();
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
  
  params.width = params.width ? params.width : 200
  params.max_width = params.max_width ? params.max_width : 386
  params.id = params.id ? params.id : "default"
  params.html = params.html ? params.html : null
  params.size = params.fullscreen ? "large" : "small"
  params.offset = params.offset ? params.offset : 0
  params.arrow_offset = params.arrow ? 8 : 0
  params.mouseevents = params.mouseevents ? params.mouseevents : false
  params.x = params.x ? params.x : 0
  params.y = params.y ? params.y : 0
  params.color = params.color ? params.color : "#333"
  params.parent = params.parent ? params.parent : d3.select("body")
  params.background = params.background ? params.background : "#ffffff"
  
  params.anchor = {}
  if (params.fullscreen) {
    params.anchor.x = "center"
    params.anchor.y = "center"
    params.x = params.parent ? params.parent.node().offsetWidth/2 : window.innerWidth/2
    params.y = params.parent ? params.parent.node().offsetHeight/2 : window.innerHeight/2
  }
  else if (params.align) {
    var a = params.align.split(" ")
    params.anchor.y = a[0]
    if (a[1]) params.anchor.x = a[1]
    else params.anchor.x = "center"
  }
  else {
    params.anchor.x = "center"
    params.anchor.y = "top"
  }
  
  var title_width = params.width - 30
  
  if (params.fullscreen) {
    var curtain = params.parent.append("div")
      .attr("class","vizwhiz_tooltip_curtain")
      .style("background-color",params.background)
      .on(vizwhiz.evt.click,function(){
        vizwhiz.tooltip.remove(params.id)
      })
  }
  
  var tooltip = params.parent.append("div")
    .datum(params)
    .attr("id","vizwhiz_tooltip_id_"+params.id)
    .attr("class","vizwhiz_tooltip vizwhiz_tooltip_"+params.size)
  
  var container = tooltip.append("div")
    .datum(params)
    .attr("class","vizwhiz_tooltip_container")
  
  if (params.fullscreen && params.html) {
    

    w = params.parent ? params.parent.node().offsetWidth*0.75 : window.innerWidth*0.75
    h = params.parent ? params.parent.node().offsetHeight*0.75 : window.innerHeight*0.75
    
    container
      .style("width",w+"px")
      .style("height",h+"px")
      
    var body = container.append("div")
      .attr("class","vizwhiz_tooltip_body")
      .style("width",params.width+"px")
      
  }
  else {
    
    if (params.width == "auto") {
      var w = "auto"
      container.style("max-width",params.max_width+"px")
    }
    else var w = params.width-14+"px"

    var body = container
      .style("width",w)
      
  }
    
  if (params.title || params.icon) {
    var header = body.append("div")
      .attr("class","vizwhiz_tooltip_header")
      
    if (params.id != "default") {
      var title_id = header.append("div")
        .attr("class","vizwhiz_tooltip_id")
        .text(params.id)
      title_width -= title_id.node().offsetWidth+6
    }
  }
  
  if (params.fullscreen) {
    var close = tooltip.append("div")
      .attr("class","vizwhiz_tooltip_close")
      .style("background-color",vizwhiz.utils.darker_color(params.color))
      .html("\&times;")
      .on(vizwhiz.evt.click,function(){
        vizwhiz.tooltip.remove(params.id)
      })
  }
  
  if (!params.mouseevents) {
    tooltip
      .style("pointer-events","none")
  }
  else if (params.mouseevents !== true) {
    
    var oldout = d3.select(params.mouseevents).on(vizwhiz.evt.out)
    
    var newout = function() {
      var target = d3.event.toElement
      if (!target || (!ischild(tooltip.node(),target) && target.className != "vizwhiz_tooltip_curtain")) {
        oldout()
        d3.select(params.mouseevents).on(vizwhiz.evt.out,oldout)
      }
    }
    
    var ischild = function(parent, child) {
       var node = child.parentNode;
       while (node != null) {
         if (node == parent) {
           return true;
         }
         node = node.parentNode;
       }
       return false;
    }
    
    d3.select(params.mouseevents).on(vizwhiz.evt.out,newout)
    tooltip.on(vizwhiz.evt.out,newout)
    
  }
    
  if (params.arrow) {
    var arrow = tooltip.append("div")
      .attr("class","vizwhiz_tooltip_arrow")
  }
  
  if (params.icon) {
    var title_icon = header.append("div")
      .attr("class","vizwhiz_tooltip_icon")
      .style("background-image","url("+params.icon+")")
      .style("background-color",params.color)
    title_width -= title_icon.node().offsetWidth
  }
  
  if (params.title) {
    var title = header.append("div")
      .attr("class","vizwhiz_tooltip_title")
      .style("width",title_width+"px")
      .text(params.title)
  }
  
  if (params.description) {
    var description = body.append("div")
      .attr("class","vizwhiz_tooltip_description")
      .text(params.description)
  }
  
  if (params.data || params.html && !params.fullscreen) {

    var data_container = body.append("div")
      .attr("class","vizwhiz_tooltip_data_container")
  }
  
  if (params.data) {
      
    params.data.forEach(function(d,i){
      var block = data_container.append("div")
        .attr("class","vizwhiz_tooltip_data_block")
        .text(d.name)
      if (d.highlight) {
        block
          .style("font-weight","bold")
          .style("color",vizwhiz.utils.darker_color(params.color))
      }
      
      block.append("div")
          .attr("class","vizwhiz_tooltip_data_value")
          .text(d.value)
          
      if (i != params.data.length-1) {
        data_container.append("div")
          .attr("class","vizwhiz_tooltip_data_seperator")
      }
          
    })
    
  }
    
  if (params.html && !params.fullscreen) {
    data_container.append("div")
      .style("padding","3px")
      .style("margin-bottom","3px")
      .html(params.html)
  }
  
  var footer = body.append("div")
    .attr("class","vizwhiz_tooltip_footer")
  
  if (params.footer) {
    footer.html(params.footer)
  }
  
  params.height = tooltip.node().offsetHeight
  
  if (params.html && params.fullscreen) {
    var h = params.height-38
    var w = tooltip.node().offsetWidth-params.width-44
    container.append("div")
      .attr("class","vizwhiz_tooltip_html")
      .style("width",w+"px")
      .style("height",h+"px")
      .html(params.html)
  }
  
  params.width = tooltip.node().offsetWidth
  
  if (params.anchor.y != "center") params.height += params.arrow_offset
  else params.width += params.arrow_offset
  
  if (params.data || (!params.fullscreen && params.html)) {
    
    if (!params.fullscreen && params.html) {
      var limit = params.fixed ? window.innerHeight-params.y-5 : window.innerHeight-10
      var h = params.height < limit ? params.height : limit
    }
    else {
      var h = params.height
    }
    h -= parseFloat(container.style("padding-top"),10)
    h -= parseFloat(container.style("padding-bottom"),10)
    if (header) {
      h -= header.node().offsetHeight
      h -= parseFloat(header.style("padding-top"),10)
      h -= parseFloat(header.style("padding-bottom"),10)
    }
    if (footer) {
      h -= footer.node().offsetHeight
      h -= parseFloat(footer.style("padding-top"),10)
      h -= parseFloat(footer.style("padding-bottom"),10)
    }
    data_container
      .style("max-height",h+"px")
  }
  
  params.height = tooltip.node().offsetHeight
  
  vizwhiz.tooltip.move(params.x,params.y,params.id);
    
}

vizwhiz.tooltip.arrow = function(arrow) {
  arrow
    .style("bottom", function(d){
      if (d.anchor.y != "center" && !d.flip) return "-5px"
      else return "auto"
    })
    .style("top", function(d){
      if (d.anchor.y != "center" && d.flip) return "-5px"
      else if (d.anchor.y == "center") return "50%"
      else return "auto"
    })
    .style("left", function(d){
      if (d.anchor.y == "center" && d.flip) return "-5px"
      else if (d.anchor.y != "center") return "50%"
      else return "auto"
    })
    .style("right", function(d){
      if (d.anchor.y == "center" && !d.flip) return "-5px"
      else return "auto"
    })
    .style("margin-left", function(d){
      if (d.anchor.y == "center") {
        return "auto"
      }
      else {
        if (d.anchor.x == "right") {
          var arrow_x = -d.width/2+d.arrow_offset/2
        }
        else if (d.anchor.x == "left") {
          var arrow_x = d.width/2-d.arrow_offset*2 - 5
        }
        else {
          var arrow_x = -5
        }
        if (d.cx-d.width/2-5 < arrow_x) {
          arrow_x = d.cx-d.width/2-5
          if (arrow_x < 2-d.width/2) arrow_x = 2-d.width/2
        }
        else if (-(window.innerWidth-d.cx-d.width/2+5) > arrow_x) {
          var arrow_x = -(window.innerWidth-d.cx-d.width/2+5)
          if (arrow_x > d.width/2-11) arrow_x = d.width/2-11
        }
        return arrow_x+"px"
      }
    })
    .style("margin-top", function(d){
      if (d.anchor.y != "center") {
        return "auto"
      }
      else {
        if (d.anchor.y == "bottom") {
          var arrow_y = -d.height/2+d.arrow_offset/2 - 1
        }
        else if (d.anchor.y == "top") {
          var arrow_y = d.height/2-d.arrow_offset*2 - 2
        }
        else {
          var arrow_y = -9
        }
        if (d.cy-d.height/2-d.arrow_offset < arrow_y) {
          arrow_y = d.cy-d.height/2-d.arrow_offset
          if (arrow_y < 4-d.height/2) arrow_y = 4-d.height/2
        }
        else if (-(window.innerHeight-d.cy-d.height/2+d.arrow_offset) > arrow_y) {
          var arrow_y = -(window.innerHeight-d.cy-d.height/2+d.arrow_offset)
          if (arrow_y > d.height/2-22) arrow_y = d.height/2-22
        }
        return arrow_y+"px"
      }
    })
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Destroy Tooltips
//-------------------------------------------------------------------

vizwhiz.tooltip.remove = function(id) {
  
  if (id) d3.select("div#vizwhiz_tooltip_id_"+id).remove();
  else d3.selectAll("div.vizwhiz_tooltip").remove();
  
  d3.selectAll("div.vizwhiz_tooltip_curtain").remove()

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get X and Y position for Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.move = function(x,y,id) {
  
  if (!id) var tooltip = d3.select("div#vizwhiz_tooltip_id_default")
  else var tooltip = d3.select("div#vizwhiz_tooltip_id_"+id)
  
  if (tooltip.node()) {
    
    var d = tooltip.datum()
  
    d.cx = x
    d.cy = y
  
    if (!d.fixed) {

      // Set initial values, based off of anchor
      if (d.anchor.y != "center") {

        if (d.anchor.x == "right") {
          d.x = d.cx - d.arrow_offset - 4
        }
        else if (d.anchor.x == "center") {
          d.x = d.cx - d.width/2
        }
        else if (d.anchor.x == "left") {
          d.x = d.cx - d.width + d.arrow_offset + 2
        }

        // Determine whether or not to flip the tooltip
        if (d.anchor.y == "bottom") {
          d.flip = d.cy + d.height + d.offset <= window.innerHeight
        }
        else if (d.anchor.y == "top") {
          d.flip = d.cy - d.height - d.offset < 0
        }
        
        if (d.flip) {
          d.y = d.cy + d.offset + d.arrow_offset
        }
        else {
          d.y = d.cy - d.height - d.offset - d.arrow_offset
        }
    
      }
      else {

        d.y = d.cy - d.height/2
        
        // Determine whether or not to flip the tooltip
        if (d.anchor.x == "right") {
          d.flip = d.cx + d.width + d.offset <= window.innerWidth
        }
        else if (d.anchor.x == "left") {
          d.flip = d.cx - d.width - d.offset < 0
        }
    
        if (d.anchor.x == "center") {
          d.flip = false
          d.x = d.cx - d.width/2
        }
        else if (d.flip) {
          d.x = d.cx + d.offset + d.arrow_offset
        }
        else {
          d.x = d.cx - d.width - d.offset
        }
      }
  
      // Limit X to the bounds of the screen
      if (d.x < 0) {
        d.x = 0
      }
      else if (d.x + d.width > window.innerWidth) {
        d.x = window.innerWidth - d.width
      }
  
      // Limit Y to the bounds of the screen
      if (d.y < 0) {
        d.y = 0
      }
      else if (d.y + d.height > window.innerHeight) {
        d.y = window.innerHeight - d.height
      }
      
    }
    
    tooltip
      .style("top",d.y+"px")
      .style("left",d.x+"px")
  
    if (d.arrow) {
      tooltip.selectAll(".vizwhiz_tooltip_arrow")
        .call(vizwhiz.tooltip.arrow)
    }
    
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
    "axis_change": true,
    "attrs": null,
    "background": "#ffffff",
    "boundries": null,
    "click_function": null,
    "color_var": "color",
    "connections": null,
    "coords": null,
    "csv_columns": null,
    "data": null,
    "data_source": null,
    "depth": null,
    "dev": false,
    "donut": true,
    "filter": [],
    "filtered_data": null,
    "graph": {"timing": 0},
    "group_bgs": true,
    "grouping": "name",
    "highlight": null,
    "highlight_color": "#cc0000",
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
    "nodes": null,
    "number_format": function(value,name) { 
      if (["year",vars.id_var].indexOf(name) >= 0 || typeof value === "string") {
        return value
      }
      else if (value < 1) {
        return d3.round(value,2)
      }
      else if (value.toString().split(".")[0].length > 4) {
        var symbol = d3.formatPrefix(value).symbol
        symbol = symbol.replace("G", "B") // d3 uses G for giga
        
        // Format number to precision level using proper scale
        value = d3.formatPrefix(value).scale(value)
        value = parseFloat(d3.format(".3g")(value))
        return value + symbol;
      }
      else {
        return d3.format(",f")(value)
      }
      
    },
    "order": "asc",
    "projection": d3.geo.mercator(),
    "secondary_color": "#ffdddd",
    "size_scale": null,
    "size_scale_type": "log",
    "solo": [],
    "sort": "total",
    "source_text": null,
    "spotlight": true,
    "sub_title": null,
    "svg_height": window.innerHeight,
    "svg_width": window.innerWidth,
    "text_format": function(text,name) { 
      return text 
    },
    "text_var": "name",
    "tiles": true,
    "title": null,
    "title_center": true,
    "title_width": null,
    "tooltip_info": [],
    "total_bar": false,
    "type": "tree_map",
    "update_function": null,
    "value_var": "value",
    "xaxis_domain": null,
    "xaxis_var": null,
    "xscale": null,
    "xscale_type": "linear",
    "yaxis_domain": null,
    "yaxis_var": null,
    "yscale": null,
    "yscale_type": "linear",
    "year": null,
    "years": null,
    "year_var": "year",
    "zoom_behavior": d3.behavior.zoom(),
    "zoom_function": null
  }
  
  var data_obj = {"raw": null},
      filter_change = false,
      nodes,
      links,
      removed_ids = [],
      xaxis_domain = null,
      yaxis_domain = null;
      
  var data_type = {
    "bubbles": "array",
    "geo_map": "object",
    "network": "object",
    "pie_scatter": "pie_scatter",
    "rings": "object",
    "stacked": "stacked",
    "tree_map": "tree_map"
  }
  
  var nested_apps = ["pie_scatter","stacked","tree_map"]
  
  //===================================================================

  chart = function(selection) {
    selection.each(function(data_passed) {

      if (vars.dev) console.log("[viz-whiz] *** Start Chart ***")
      
      // Things to do ONLY when the data has changed
      if (data_passed != data_obj.raw) {
        
        if (vars.dev) console.log("[viz-whiz] New Data Detected")
        // Copy data to "raw_data" variable
        data_obj = {}
        data_obj.raw = data_passed
        vars.parent = d3.select(this)
        
        if (vars.dev) console.log("[viz-whiz] Establishing Year Range and Current Year")
        // Find available years
        vars.years = vizwhiz.utils.uniques(data_obj.raw,vars.year_var)
        vars.years.sort()
        // Set initial year if it doesn't exist
        if (!vars.year) {
          if (vars.years.length) vars.year = vars.years[vars.years.length-1]
          else vars.year = "all"
        }
        
        if (vars.dev) console.log("[viz-whiz] Cleaning Data")
        vars.keys = {}
        data_obj.clean = data_obj.raw.filter(function(d){
          for (k in d) {
            if (!vars.keys[k]) {
              vars.keys[k] = typeof d[k]
            }
          }
          return true;
        })
        
        data_obj.year = {}
        if (vars.years.length) {
          vars.years.forEach(function(y){
            data_obj.year[y] = data_obj.clean.filter(function(d){
              return d[vars.year_var] == y;
            })
          })
        }
        
      }
      
      if (vars.type == "stacked") {
        vars.yaxis_var = vars.value_var
      }
      
      if (filter_change || 
          (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && axis_change)) {
        delete data_obj[data_type[vars.type]]
      }
      
      if (!data_obj[data_type[vars.type]]) {
        
        data_obj[data_type[vars.type]] = {}
        
        if (nested_apps.indexOf(vars.type) >= 0) {
          
          if (vars.dev) console.log("[viz-whiz] Nesting Data")
          
          vars.nesting.forEach(function(depth){
            
            var level = vars.nesting.slice(0,vars.nesting.indexOf(depth)+1)
            
            if (vars.type == "stacked") {
              var temp_data = []
              for (y in data_obj.year) {
                var filtered_data = filter_check(data_obj.year[y])
                var yd = nest(filtered_data,level)
                temp_data = temp_data.concat(yd)
              }
              data_obj[data_type[vars.type]][depth] = temp_data
            }
            else if (vars.type == "pie_scatter") {

              data_obj[data_type[vars.type]][depth] = {"true": {}, "false": {}}
              for (b in data_obj[data_type[vars.type]][depth]) {
                var all_array = []
                if (b == "true") var spotlight = true
                else var spotlight = false
                for (y in data_obj.year) {
                  var filtered_data = filter_check(data_obj.year[y])
                  if (spotlight) {
                    filtered_data = filtered_data.filter(function(d){
                      return d[vars.active_var] != spotlight
                    })
                  }
                  data_obj[data_type[vars.type]][depth][b][y] = nest(filtered_data,level)
                  all_array = all_array.concat(data_obj[data_type[vars.type]][depth][b][y])
                }
                data_obj[data_type[vars.type]][depth][b].all = all_array
              }
              
            }
            else {
              data_obj[data_type[vars.type]][depth] = {}
              var all_array = []
              for (y in data_obj.year) {
                var filtered_data = filter_check(data_obj.year[y])
                data_obj[data_type[vars.type]][depth][y] = nest(filtered_data,level)
                all_array = all_array.concat(data_obj[data_type[vars.type]][depth][y])
              }
              data_obj[data_type[vars.type]][depth].all = all_array
            }
            
          })
          
        }
        else if (data_type[vars.type] == "object") {
          for (y in data_obj.year) {
            data_obj[data_type[vars.type]][y] = {}
            var filtered_data = filter_check(data_obj.year[y])
            filtered_data.forEach(function(d){
              data_obj[data_type[vars.type]][y][d[vars.id_var]] = d;
            })
          }
        }
        else {
          for (y in data_obj.year) {
            var filtered_data = filter_check(data_obj.year[y])
            data_obj[data_type[vars.type]][y] = filtered_data
          }
        }
        
      }
      
      if (nested_apps.indexOf(vars.type) >= 0) {
        
        if (!vars.depth) vars.depth = vars.nesting[vars.nesting.length-1]
        
        if (vars.type == "stacked") {
          vars.data = data_obj[data_type[vars.type]][vars.depth].filter(function(d){
            if (vars.year instanceof Array) {
              return d[vars.year_var] >= vars.year[0] && d[vars.year_var] <= vars.year[1]
            }
            else {
              return true
            }
          })
        }
        else if (vars.type == "pie_scatter") {
          vars.data = data_obj[data_type[vars.type]][vars.depth][vars.spotlight][vars.year]
        }
        else {
          vars.data = data_obj[data_type[vars.type]][vars.depth][vars.year]
        }
        
      }
      else {
        vars.data = data_obj[data_type[vars.type]][vars.year];
      }

      vizwhiz.tooltip.remove();
      
      vars.svg = vars.parent.selectAll("svg").data([vars.data]);
      
      vars.svg_enter = vars.svg.enter().append("svg")
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
        .style("z-index", 10)
        .style("position","absolute")
        
      vars.svg_enter.append("rect")
        .attr("id","svgbg")
        .attr("fill",vars.background)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
    
      vars.svg.transition().duration(vizwhiz.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
    
      vars.svg.select("rect#svgbg").transition().duration(vizwhiz.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
      
      if (["network","rings"].indexOf(vars.type) >= 0) {
        if (filter_change) {
          if (vars.dev) console.log("[viz-whiz] Filtering Nodes and Edges")
          vars.nodes = nodes.filter(function(n){
            if (removed_ids.indexOf(n[vars.id_var]) >= 0) {
              return false;
            }
            else {
              return true;
            }
          })
          vars.links = links.filter(function(l){
            if (removed_ids.indexOf(l.source[vars.id_var]) >= 0
             || removed_ids.indexOf(l.target[vars.id_var]) >= 0) {
              return false;
            }
            else {
              return true;
            }
          })
        }
        else {
          vars.nodes = nodes
          vars.links = links
        }
        vars.connections = get_connections(vars.links)
      }
      
      vars.parent
        .style("width",vars.svg_width+"px")
        .style("height",vars.svg_height+"px")
      
      vars.width = vars.svg_width;
      
      if (vars.type == "pie_scatter") {
        if (vars.dev) console.log("[viz-whiz] Setting Axes Domains")
        if (xaxis_domain) vars.xaxis_domain = xaxis_domain
        else {
          vars.xaxis_domain = d3.extent(data_obj[data_type[vars.type]][vars.depth][vars.spotlight].all,function(d){
            return d[vars.xaxis_var]
          })
        }
        if (yaxis_domain) vars.yaxis_domain = yaxis_domain
        else {
          vars.yaxis_domain = d3.extent(data_obj[data_type[vars.type]][vars.depth][vars.spotlight].all,function(d){
            return d[vars.yaxis_var]
          }).reverse()
        }
      }
      
      // Calculate total_bar value
      if (!vars.total_bar || vars.type == "stacked") {
        var total_val = null
      }
      else {
        if (vars.dev) console.log("[viz-whiz] Calculating Total Value")
        
        if (vars.type == "tree_map") {
          var total_val = check_child(vars.data)
          
          function check_child(c) {
            if (c[vars.value_var]) return c[vars.value_var]
            else if (c.children) {
              return d3.sum(c.children,function(c2){
                return check_child(c2)
              })
          }
          }
        }
        else if (vars.data instanceof Array) {
          var total_val = d3.sum(vars.data,function(d){
            return d[vars.value_var]
          })
        }
        else if (vars.type == "rings") {
          var total_val = vars.data[vars.highlight][vars.value_var]
        }
        else {
          var total_val = d3.sum(d3.values(vars.data),function(d){
            return d[vars.value_var]
          })
        }
      }
      
      vars.svg_enter.append("g")
        .attr("class","titles")

      // Create titles
      vars.margin.top = 0;
      if (vars.svg_width < 300 || vars.svg_height < 200) {
        vars.small = true;
        vars.graph.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
        vars.graph.width = vars.width
        make_title(null,"title");
        make_title(null,"sub_title");
        make_title(null,"total_bar");
      }
      else {
        if (vars.dev) console.log("[viz-whiz] Creating/Updating Titles")
        vars.small = false;
        vars.graph.margin = {"top": 5, "right": 10, "bottom": 40, "left": 40}
        vars.graph.width = vars.width-vars.graph.margin.left-vars.graph.margin.right
        make_title(vars.title,"title");
        make_title(vars.sub_title,"sub_title");
        make_title(total_val,"total_bar");
        if (vars.margin.top > 0) vars.margin.top += 3
      }
      
      vars.height = vars.svg_height - vars.margin.top;
      
      vars.graph.height = vars.height-vars.graph.margin.top-vars.graph.margin.bottom
      
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
        
      filter_change = false
      axis_change = false
      if (vars.dev) console.log("[viz-whiz] Building \"" + vars.type + "\"")
      vizwhiz[vars.type](vars);
      if (vars.dev) console.log("[viz-whiz] *** End Chart ***")
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper Functions
  //-------------------------------------------------------------------

  filter_check = function(check_data) {
    
    if (filter_change || 
        (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && axis_change)) {
      
      if (vars.dev) console.log("[viz-whiz] Removing Solo/Filters")
      removed_ids = []
      return check_data.filter(function(d){
        
        if (vars.xaxis_var) {
          if (typeof d[vars.xaxis_var] == "undefined") return false
        }
        if (vars.yaxis_var) {
          if (typeof d[vars.yaxis_var] == "undefined") return false
        }
        
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
    else {
      return check_data
    }
  }

  nest = function(flat_data,levels) {
  
    var flattened = [];
    var nested_data = d3.nest();
    
    levels.forEach(function(nest_key, i){
    
      nested_data
        .key(function(d){ return d[nest_key][vars.id_var]; })
      
      if (i == levels.length-1) {
        nested_data.rollup(function(leaves){
          
          to_return = {
            "num_children": leaves.length,
            "num_children_active": d3.sum(leaves, function(d){ return d.active; })
          }
          
          to_return[vars.id_var] = leaves[0][nest_key][vars.id_var]
          
          if (leaves[0][nest_key].display_id) to_return.display_id = leaves[0][nest_key].display_id;
          
          for (key in vars.keys) {
            if (vars.nesting_aggs[key]) {
              to_return[key] = d3[vars.nesting_aggs[key]](leaves, function(d){ return d[key]; })
            }
            else {
              if ([vars.color_var,vars.year_var,"icon"].indexOf(key) >= 0) {
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
      
    rename_key_value = function(obj) { 
      if (obj.values && obj.values.length) { 
        var return_obj = {}
        return_obj.children = obj.values.map(function(obj) { 
          return rename_key_value(obj);
        })
        return_obj[vars.id_var] = obj.key
        return return_obj
      } 
      else if(obj.values) { 
        return obj.values
      }
      else {
        return obj; 
      }
    }
    
    nested_data = nested_data
      .entries(flat_data)
      .map(rename_key_value)

    if(vars.type != "tree_map"){
      return flattened;
    }

    return {"name":"root", "children": nested_data};

  }

  make_title = function(t,type){

    // Set the total value as data for element.
    var font_size = type == "title" ? 18 : 13,
        title_position = {
          "x": vars.svg_width/2,
          "y": vars.margin.top
        }
    
    if (type == "total_bar" && t) {
      title = vars.number_format(t,vars.value_var)
      vars.total_bar.prefix ? title = vars.total_bar.prefix + title : null;
      vars.total_bar.suffix ? title = title + vars.total_bar.suffix : null;
      
      if (vars.filter.length || vars.solo.length && vars.type != "rings") {
        var overall_total = d3.sum(data_obj.clean, function(d){ 
          if (vars.type == "stacked") return d[vars.value_var]
          else if (vars.year == d[vars.year_var]) return d[vars.value_var]
        })
        var pct = (t/overall_total)*100
        ot = vars.number_format(overall_total,vars.value_var)
        title += " ("+vars.number_format(pct,"share")+"% of "+ot+")"
      }
      
    }
    else {
      title = t
    }
    
    if (title) {
      var title_data = title_position
      title_data.title = title
      title_data = [title_data]
    }
    else {
      var title_data = []
    }
    
    var total = d3.select("g.titles").selectAll("g."+type).data(title_data)
    
    var offset = 0
    if (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && !vars.title_center) {
      offset = vars.graph.margin.left
    }
    
    // Enter
    total.enter().append("g")
      .attr("class",type)
      .style("opacity",0)
      .append("text")
        .attr("x",function(d) { return d.x; })
        .attr("y",function(d) { return d.y+offset; })
        .attr("font-size",font_size)
        .attr("fill","#333")
        .attr("text-anchor", "middle")
        .attr("font-family", "Helvetica")
        .style("font-weight", "normal")
        .each(function(d){
          var width = vars.title_width ? vars.title_width : vars.svg_width
          width -= offset*2
          vizwhiz.utils.wordwrap({
            "text": d.title,
            "parent": this,
            "width": width,
            "height": vars.svg_height/8,
            "resize": false
          })
        })
    
    // Update
    total.transition().duration(vizwhiz.timing)
      .style("opacity",1)
      
    update_titles()
    
    // Exit
    total.exit().transition().duration(vizwhiz.timing)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }
  
  update_titles = function() {
    
    var offset = 0
    if (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && !vars.title_center) {
      offset = vars.graph.margin.left
    }

    d3.select("g.titles").selectAll("g").select("text")
      .transition().duration(vizwhiz.timing)
        .attr("x",function(d) { return d.x+offset; })
        .attr("y",function(d) { return d.y; })
        .each(function(d){
          var width = vars.title_width ? vars.title_width : vars.svg_width
          width -= offset*2
          vizwhiz.utils.wordwrap({
            "text": d.title,
            "parent": this,
            "width": width,
            "height": vars.svg_height/8,
            "resize": false
          })
        })
        .selectAll("tspan")
          .attr("x",function(d) { return d.x+offset; })
        
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
  
  get_tooltip_data = function(id,length) {

    if (!length) var length = "long"
    
    if (["network","rings"].indexOf(vars.type) >= 0) {
      var tooltip_highlight = vars.active_var
    }
    else {
      var tooltip_highlight = vars.value_var
    }

    if (vars.tooltip_info instanceof Array) var a = vars.tooltip_info
    else var a = vars.tooltip_info[length]
    
    if (a.indexOf(vars.value_var) < 0) a.unshift(vars.value_var)
    if (["stacked","pie_scatter"].indexOf(vars.type) >= 0
         && a.indexOf(vars.xaxis_var) < 0) a.unshift(vars.xaxis_var)
    if (["stacked"].indexOf(vars.type) >= 0
         && a.indexOf(vars.yaxis_var) < 0) a.unshift(vars.yaxis_var)
    
    var tooltip_data = []
    a.forEach(function(t){
      var value = find_variable(id,t)
      if (value) {
        var name = vars.text_format(t),
            h = t == tooltip_highlight
            
        if (typeof value == "string") {
          var val = vars.text_format(value,t)
        }
        else if (typeof value == "number") {
          var val = vars.number_format(value,t)
        }
        
        if (val) tooltip_data.push({"name": name, "value": val, "highlight": h})
      }
    })
    
    return tooltip_data
    
  }
  
  find_variable = function(id,variable) {
    
    if (typeof id == "object") {
      var dat = id
      id = dat[vars.id_var]
    }
    else {
      if (vars.data instanceof Array) {
        var dat = vars.data.filter(function(d){
          return d[vars.id_var] == id
        })[0]
      }
      else {
        var dat = vars.data[id]
      }
    }
    
    var attr = vars.attrs[id]
    
    var value = false
    
    if (dat && dat.values) {
      dat.values.forEach(function(d){
        if (d[variable] && !value) value = d[variable]
      })
    }
    
    if (!value) {
      if (dat && dat[variable]) value = dat[variable]
      else if (attr && attr[variable]) value = attr[variable]
      else if (variable == "color") value = vizwhiz.utils.rand_color()
    }
    
    if (variable == vars.text_var && value) {
      return vars.text_format(value)
    }
    else return value
    
  }
  
  footer_text = function() {

    var text = vars.click_function || vars.tooltip_info.long ? vars.text_format("Click for More Info") : null
    
    if (!text && vars.type == "geo_map") return vars.text_format("Click to Zoom")
    else return text
    
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
  
  chart.attrs = function(x) {
    if (!arguments.length) return vars.attrs;
    vars.attrs = x;
    return chart;
  };
  
  chart.background = function(x) {
    if (!arguments.length) return vars.background;
    vars.background = x;
    return chart;
  };
  
  chart.click_function = function(x) {
    if (!arguments.length) return vars.click_function;
    vars.click_function = x;
    return chart;
  };
  
  chart.csv_data = function(x) {
    if (!arguments.length) {
      var csv_to_return = []
      
      // filter out the columns (if specified)
      if(vars.csv_columns){
        vars.data.map(function(d){
          d3.keys(d).forEach(function(d_key){
            if(vars.csv_columns.indexOf(d_key) < 0){
              delete d[d_key]
            }
          })
        })
      }
      
      csv_to_return.push(vars.keys);
      vars.data.forEach(function(d){
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
  
  chart.color_var = function(x) {
    if (!arguments.length) return vars.color_var;
    vars.color_var = x;
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
  
  chart.data_source = function(x) {
    if (!arguments.length) return vars.data_source;
    vars.data_source = x;
    return chart;
  };
  
  chart.depth = function(x) {
    if (!arguments.length) return vars.depth;
    vars.depth = x;
    return chart;
  };
  
  chart.dev = function(x) {
    if (!arguments.length) return vars.dev;
    vars.dev = x;
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
    filter_change = true;
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
  
  chart.nodes = function(x) {
    if (!arguments.length) return vars.nodes;
    nodes = x;
    return chart;
  };
  
  chart.number_format = function(x) {
    if (!arguments.length) return vars.number_format;
    vars.number_format = x;
    return chart;
  };
  
  chart.order = function(x) {
    if (!arguments.length) return vars.order;
    vars.order = x;
    return chart;
  };
  
  chart.size_scale = function(x) {
    if (!arguments.length) return vars.size_scale_type;
    vars.size_scale_type = x;
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
    filter_change = true;
    return chart;
  };
  
  chart.sort = function(x) {
    if (!arguments.length) return vars.sort;
    vars.sort = x;
    return chart;
  };
  
  chart.source_text = function(x) {
    if (!arguments.length) return vars.source_text;
    vars.source_text = x;
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
  
  chart.text_format = function(x) {
    if (!arguments.length) return vars.text_format;
    vars.text_format = x;
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
  
  chart.title_center = function(x) {
    if (!arguments.length) return vars.title_center;
    vars.title_center = x;
    return chart;
  };
  
  chart.title_width = function(x) {
    if (!arguments.length) return vars.title_width;
    vars.title_width = x;
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
    xaxis_domain = x;
    return chart;
  };
  
  chart.xaxis_var = function(x) {
    if (!arguments.length) return vars.xaxis_var;
    vars.xaxis_var = x;
    axis_change = true;
    return chart;
  };
  
  chart.xaxis_scale = function(x) {
    if (!arguments.length) return vars.xscale_type;
    vars.xscale_type = x;
    return chart;
  };
  
  chart.yaxis_domain = function(x) {
    if (!arguments.length) return vars.yaxis_domain;
    yaxis_domain = x.reverse();
    return chart;
  };
  
  chart.yaxis_var = function(x) {
    if (!arguments.length) return vars.yaxis_var;
    vars.yaxis_var = x;
    axis_change = true;
    return chart;
  };
  
  chart.yaxis_scale = function(x) {
    if (!arguments.length) return vars.yscale_type;
    vars.yscale_type = x;
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
  
  zoom_controls = function() {
    d3.select("#zoom_controls").remove()
    if (!vars.small) {
      // Create Zoom Controls
      var zoom_enter = vars.parent.append("div")
        .attr("id","zoom_controls")
        .style("top",(vars.margin.top+5)+"px")
    
      zoom_enter.append("div")
        .attr("id","zoom_in")
        .attr("unselectable","on")
        .on(vizwhiz.evt.click,function(){ vars.zoom("in") })
        .text("+")
    
      zoom_enter.append("div")
        .attr("id","zoom_out")
        .attr("unselectable","on")
        .on(vizwhiz.evt.click,function(){ vars.zoom("out") })
        .text("-")
    
      zoom_enter.append("div")
        .attr("id","zoom_reset")
        .attr("unselectable","on")
        .on(vizwhiz.evt.click,function(){ 
          vars.zoom("reset") 
          vars.update()
        })
        .html("\&#8634;")
    }
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X/Y Graph System
  //-------------------------------------------------------------------
  
  var tick_style = {
    "stroke": "#ccc",
    "stroke-width": 1,
    "shape-rendering": "crispEdges"
  }
  
  var axis_style = {
    "font-family": "Helvetica",
    "font-size": "12px",
    "font-weight": "normal",
    "fill": "#888"
  }
  
  var label_style = {
    "font-family": "Helvetica",
    "font-size": "14px",
    "font-weight": "normal",
    "fill": "#333",
    "text-anchor": "middle"
  }
  
  vars.x_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(20)
    .orient('bottom')
    .tickFormat(function(d, i) {
      
      if ((vars.xscale_type == "log" && d.toString().charAt(0) == "1")
          || (vars.xaxis_var == vars.year_var && d % 1 == 0)
          || (vars.xscale_type != "log" && vars.xaxis_var != vars.year_var)) {
      
        if (vars.xaxis_var == vars.year_var) var text = d;
        else {
          var text = vars.number_format(d,vars.xaxis_var);
        }
      
        d3.select(this)
          .style(axis_style)
          .attr("transform","translate(-22,3)rotate(-65)")
          .text(text)
        
        var height = (Math.cos(25)*this.getBBox().width)
        if (height > vars.graph.yoffset && !vars.small) vars.graph.yoffset = height
        
        var tick_offset = 10
        var tick_opacity = 1
      }
      else {
        var text = null
        var tick_offset = 5
        var tick_opacity = 0.25
      }
      
      if (!(tick_offset == 5 && vars.xaxis_var == vars.year_var)) {
      
        var bgtick = d3.select(this.parentNode).selectAll("line.tick")
          .data([i])
          
        bgtick.enter().append("line")
          .attr("class","tick")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", tick_offset)
          .attr("y2", -vars.graph.height)
          .attr(tick_style)
          .attr("opacity",tick_opacity)
        
        bgtick.transition().duration(vizwhiz.timing) 
          .attr("y2", -vars.graph.height)
        
      }
      
      return text;
      
    });
  
  vars.y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('left')
    .tickFormat(function(d, i) {
      
      if ((vars.yscale_type == "log" && d.toString().charAt(0) == "1")
          || (vars.yaxis_var == vars.year_var && d % 1 == 0)
          || (vars.yscale_type != "log" && vars.yaxis_var != vars.year_var)) {
            
        if (vars.yaxis_var == vars.year_var) var text = d;
        else if (vars.layout == "share" && vars.type == "stacked") {
          var text = d*100+"%"
        }
        else {
          var text = vars.number_format(d,vars.yaxis_var);
        }
      
        d3.select(this)
          .style(axis_style)
          .text(text)
        
        var width = this.getBBox().width
        if (width > vars.graph.offset && !vars.small) vars.graph.offset = width
        
        var tick_offset = -10
        var tick_opacity = 1
      }
      else {
        var text = null
        var tick_offset = -5
        var tick_opacity = 0.25
      }
      
      if (!(tick_offset == -5 && vars.yaxis_var == vars.year_var)) {
      
        var bgtick = d3.select(this.parentNode).selectAll("line.tick")
          .data([i])
        
        bgtick.enter().append("line")
          .attr("class","tick")
          .attr("x1", tick_offset)
          .attr("x2", vars.graph.width)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr(tick_style)
          .attr("opacity",tick_opacity)
        
        bgtick.transition().duration(vizwhiz.timing) 
          .attr("x2", vars.graph.width)
        
      }
      
      return text;
      
    });
    
  graph_update = function() {

    // create label group
    var axes = vars.parent_enter.append("g")
      .attr("class","axes_labels")
    
    // Enter Graph
    vars.chart_enter = vars.parent_enter.append("g")
      .attr("class", "chart")
      .attr("transform", "translate(" + vars.graph.margin.left + "," + vars.graph.margin.top + ")")

    vars.chart_enter.append("rect")
      .style('fill','#fafafa')
      .attr("id","background")
      .attr('x',0)
      .attr('y',0)
      .attr('width', vars.graph.width)
      .attr('height', vars.graph.height)
      
    vars.parent_enter.append("rect")
      .attr("id", "border")
      .attr("fill","none")
      .attr('x', vars.graph.margin.left)
      .attr('y', vars.graph.margin.top)
      .attr('width', vars.graph.width)
      .attr('height', vars.graph.height)
      .attr("stroke-width",1)
      .attr("stroke","#ccc")
      .attr("shape-rendering","crispEdges")

    // Create X axis
    vars.chart_enter.append("g")
      .attr("transform", "translate(0," + vars.graph.height + ")")
      .attr("class", "xaxis")
      .call(vars.x_axis.scale(vars.x_scale))

    // Create Y axis
    vars.chart_enter.append("g")
      .attr("class", "yaxis")
      .call(vars.y_axis.scale(vars.y_scale))
      
    var labelx = vars.width/2
    if (!vars.title_center) labelx += vars.graph.margin.left
      
    // Create X axis label
    axes.append('text')
      .attr('class', 'x_axis_label')
      .attr('x', labelx)
      .attr('y', vars.height-10)
      .text(vars.text_format(vars.xaxis_var))
      .attr(label_style)
      
    // Create Y axis label
    axes.append('text')
      .attr('class', 'y_axis_label')
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .text(vars.text_format(vars.yaxis_var))
      .attr("transform","rotate(-90)")
      .attr(label_style)

    // Set Y axis
    vars.graph.offset = 0
    d3.select("g.yaxis")
      .call(vars.y_axis.scale(vars.y_scale))
      
    vars.graph.margin.left += vars.graph.offset
    vars.graph.width -= vars.graph.offset
    vars.x_scale.range([0,vars.graph.width])
    
    // Set X axis
    vars.graph.yoffset = 0
    d3.select("g.xaxis")
      .call(vars.x_axis.scale(vars.x_scale))
      
    vars.graph.height -= vars.graph.yoffset
    
    // Update Graph
    d3.select(".chart").transition().duration(vars.graph.timing)
      .attr("transform", "translate(" + vars.graph.margin.left + "," + vars.graph.margin.top + ")")
      .select("rect#background")
        .attr('width', vars.graph.width)
        .attr('height', vars.graph.height)
      
    d3.select("rect#border").transition().duration(vars.graph.timing)
      .attr('x', vars.graph.margin.left)
      .attr('y', vars.graph.margin.top)
      .attr('width', vars.graph.width)
      .attr('height', vars.graph.height)

    // Update X axis
    if (vars.type == "stacked") {
      vars.y_scale.range([vars.graph.height,0]);
    }
    else {
      vars.y_scale.range([0, vars.graph.height]);
    }
    
    d3.select("g.yaxis")
      .call(vars.y_axis.scale(vars.y_scale))
    
    d3.select("g.xaxis")
      .attr("transform", "translate(0," + vars.graph.height + ")")
      .call(vars.x_axis.scale(vars.x_scale))
    
    d3.select("g.xaxis").selectAll("g.tick").select("text")
      .style("text-anchor","end")

    // Update X axis label
    d3.select(".x_axis_label")
      .attr('x', labelx)
      .attr('y', vars.height-10)
      .text(vars.text_format(vars.xaxis_var))

    // Update Y axis label
    d3.select(".y_axis_label")
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .text(vars.text_format(vars.yaxis_var))
      
    // Move titles
    update_titles()
    
    vars.graph.timing = vizwhiz.timing
      
  }

  //===================================================================

  return chart;
};
vizwhiz.network = function(vars) {
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function that handles the zooming and panning of the visualization
  //-------------------------------------------------------------------
  
  vars.zoom = function(direction) {
    
    var zoom_extent = zoom_behavior.scaleExtent()
    // If d3 zoom event is detected, use it!
    if(!direction) {
      evt_scale = d3.event.scale
      translate = d3.event.translate
    } 
    else {
      if (direction == "in") {
        if (zoom_behavior.scale() > zoom_extent[1]/2) multiplier = zoom_extent[1]/zoom_behavior.scale()
        else multiplier = 2
      } 
      else if (direction == "out") {
        if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
        else multiplier = 0.5
      } 
      else if (direction == vars.highlight) {
        var x_bounds = [scale.x(highlight_extent.x[0]),scale.x(highlight_extent.x[1])],
            y_bounds = [scale.y(highlight_extent.y[0]),scale.y(highlight_extent.y[1])]
            
        if (x_bounds[1] > (vars.width-info_width-5)) var offset_left = info_width+32
        else var offset_left = 0
            
        var w_zoom = (vars.width-info_width-10)/(x_bounds[1]-x_bounds[0]),
            h_zoom = vars.height/(y_bounds[1]-y_bounds[0])
        
        if (w_zoom < h_zoom) {
          x_bounds = [x_bounds[0]-(max_size*4),x_bounds[1]+(max_size*4)]
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
      } 
      else if (direction == "reset") {
        vars.highlight = null
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
  
  vars.update = function() {
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
        vars.zoom("reset");
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
      
      var node_data = vars.nodes.filter(function(x){return x[vars.id_var] == c})
      
      if (group == "highlight" || !vars.highlight) {

        var prim_nodes = [],
            prim_links = [];
            
        if (vars.connections[c]) {
          vars.connections[c].forEach(function(n){
            prim_nodes.push(vars.nodes.filter(function(x){return x[vars.id_var] == n[vars.id_var]})[0])
          })
          prim_nodes.forEach(function(n){
            prim_links.push({"source": node_data[0], "target": n})
          })
        }
        
        var node_data = prim_nodes.concat(node_data)
        highlight_extent.x = d3.extent(d3.values(node_data),function(v){return v.x;}),
        highlight_extent.y = d3.extent(d3.values(node_data),function(v){return v.y;})

        if (group == "highlight") {
          vars.zoom(c);
          
          // Draw Info Panel
          if (scale.x(highlight_extent.x[1]) > (vars.width-info_width-10)) {
            var x_pos = 30
          }
          else {
            var x_pos = vars.width-info_width-5
          }
         
          var prod = vars.nodes.filter(function(n){return n[vars.id_var] == vars.highlight})[0]
          
          var tooltip_data = get_tooltip_data(vars.highlight)
          
          var tooltip_appends = "<div class='vizwhiz_network_title'>Primary Connections</div>"
      
          prim_nodes.forEach(function(n){
            
            var parent = "d3.select(&quot;#"+vars.parent.node().id+"&quot;)"
            
            tooltip_appends += "<div class='vizwhiz_network_connection' onclick='"+parent+".call(chart.highlight(&quot;"+n[vars.id_var]+"&quot;))'>"
            tooltip_appends += "<div class='vizwhiz_network_connection_node'"
            tooltip_appends += " style='"
            tooltip_appends += "background-color:"+fill_color(n)+";"
            tooltip_appends += "border-color:"+stroke_color(n)+";"
            tooltip_appends += "'"
            tooltip_appends += "></div>"
            tooltip_appends += "<div class='vizwhiz_network_connection_name'>"
            tooltip_appends += find_variable(n[vars.id_var],vars.text_var)
            tooltip_appends += "</div>"
            tooltip_appends += "</div>"
          })
          
    
          var html = vars.click_function ? "<br>"+vars.click_function(vars.data[vars.highlight]) : ""
          
          vizwhiz.tooltip.create({
            "data": tooltip_data,
            "title": find_variable(vars.highlight,vars.text_var),
            "color": find_variable(vars.highlight,vars.color_var),
            "icon": find_variable(vars.highlight,"icon"),
            "x": x_pos,
            "y": vars.margin.top+5,
            "width": info_width,
            "html": tooltip_appends+html,
            "fixed": true,
            "mouseevents": true,
            "parent": vars.parent,
            "background": vars.background
          })
          
        }
        
        d3.select("g."+group).selectAll("line")
          .data(prim_links).enter().append("line")
            .attr("pointer-events","none")
            .attr("stroke",vars.highlight_color)
            .attr("stroke-width",2)
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
          .attr("stroke",vars.highlight_color);
        
      node_groups
        .append("circle")
          .call(node_size)
          .call(node_position)
          .call(node_stroke)
          .call(node_color)
          .call(create_label);
    }
    
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------
  
  var dragging = false,
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
    

  var x_range = d3.extent(d3.values(vars.nodes), function(d){return d.x})
  var y_range = d3.extent(d3.values(vars.nodes), function(d){return d.y})
  var aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0])
    
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
    
  var val_range = d3.extent(d3.values(vars.data), function(d){
    return d[vars.value_var] ? d[vars.value_var] : null
  });
  
  if (typeof val_range[0] == "undefined") val_range = [1,1]
  
  var distances = []
  vars.nodes.forEach(function(n1){
    vars.nodes.forEach(function(n2){
      if (n1 != n2) {
        var xx = Math.abs(scale.x(n1.x)-scale.x(n2.x));
        var yy = Math.abs(scale.y(n1.y)-scale.y(n2.y));
        distances.push(Math.sqrt((xx*xx)+(yy*yy)))
      }
    })
  })
  
  var max_size = d3.min(distances)
  var min_size = 2;
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
    .call(zoom_behavior.on("zoom",function(){ vars.zoom(); }))
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
        vars.update();
      }
    })
    .on(vizwhiz.evt.click,function(d){
      vars.highlight = null;
      vars.zoom("reset");
      vars.update();
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
    
  zoom_controls();
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New nodes and links enter, initialize them here
  //-------------------------------------------------------------------
  
  var node = d3.select("g.nodes").selectAll("circle.node")
    .data(vars.nodes, function(d) { return d[vars.id_var]; })
  
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
      if (!dragging) {
        hover = d[vars.id_var];
        vars.update();
      }
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
    vars.nodes.forEach(function(d){
      if (d[vars.id_var] == vars.highlight) present = true;
    })
    if (!present) {
      vars.highlight = null;
    }
  }
  vars.update();
      
  function link_position(l) {
    l
      .attr("x1", function(d) { return scale.x(d.source.x); })
      .attr("y1", function(d) { return scale.y(d.source.y); })
      .attr("x2", function(d) { return scale.x(d.target.x); })
      .attr("y2", function(d) { return scale.y(d.target.y); })
      .attr("vector-effect","non-scaling-stroke")
  }
  
  function link_events(l) {
    l
      .on(vizwhiz.evt.click,function(d){
        vars.highlight = null;
        vars.zoom("reset");
        vars.update();
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
        var value = find_variable(d[vars.id_var],vars.value_var)
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
          if (vars.highlight == d[vars.id_var]) return 6;
          else return 4;
        }
        else if (highlighted) return 0;
        else return 1;
      })
      .attr("vector-effect","non-scaling-stroke")
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
        var active = find_variable(d[vars.id_var],vars.active_var)
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
        var active = find_variable(d[vars.id_var],vars.active_var)
        var hidden = vars.spotlight && !active
        
        if (highlighted) return fill_color(d);
        else if (background_node || hidden) return "#dedede";
        else return stroke_color(d);
        
      })
  }
  
  function fill_color(d) {
    
    // Get elements' color
    var color = find_variable(d[vars.id_var],vars.color_var)
    
    // If node is not active, lighten the color
    var active = find_variable(d[vars.id_var],vars.active_var)
    if (!active) {
      var color = d3.hsl(color);
      color.l = 0.95;
    }
    
    // Return the color
    return color;
    
  }
  
  function stroke_color(d) {
    
    // Get elements' color
    var color = find_variable(d[vars.id_var],vars.color_var)
    
    // If node is active, return a darker color, else, return the normal color
    var active = find_variable(d[vars.id_var],vars.active_var)
    return active ? "#333" : color;
    
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
          vars.update();
        }
        
      })
      .on(vizwhiz.evt.out, function(d){
        
        // Returns false if the mouse has moved into a child element.
        // This is used to catch when the mouse moves onto label text.
        var target = d3.event.toElement
        if (target) {
          var id_check = target.__data__[vars.id_var] == d[vars.id_var]
          if (d3.event.toElement.parentNode != this && !id_check) {
            hover = null;
            vars.update();
          }
        }
        else {
          hover = null;
          vars.update();
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
        
        vars.update();
        
      })
  }
  
  function create_label(n) {
    if (vars.labels) {
      n.each(function(d){

        var font_size = Math.ceil(10/zoom_behavior.scale()),
            padding = font_size/4,
            corner = Math.ceil(3/zoom_behavior.scale())
            value = find_variable(d[vars.id_var],vars.value_var),
            size = value > 0 ? scale.size(value) : scale.size(val_range[0])
        if (font_size < size || d[vars.id_var] == hover || d[vars.id_var] == vars.highlight) {
          d3.select(this.parentNode).append("text")
            .attr("pointer-events","none")
            .attr("x",scale.x(d.x))
            .attr("fill",vizwhiz.utils.text_color(fill_color(d)))
            .attr("font-size",font_size+"px")
            .attr("text-anchor","middle")
            .attr("font-family","Helvetica")
            .attr("font-weight","bold")
            .each(function(e){
              var th = size < font_size+padding*2 ? font_size+padding*2 : size,
                  tw = ((font_size*5)/th)*(font_size*5)
              var text = find_variable(d[vars.id_var],vars.text_var)
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
        
          text.attr("y",scale.y(d.y)-(h/2)-(padding/3))
          
          w = w+(padding*6)
          h = h+(padding*2)
          
          if (w > size*2) {
            d3.select(text.node().parentNode)
              .insert("rect","circle")
                .attr("class","bg")
                .attr("rx",corner)
                .attr("ry",corner)
                .attr("width",w)
                .attr("height",h)
                .attr("y",scale.y(d.y)-(h/2))
                .attr("x",scale.x(d.x)-(w/2))
                .call(node_stroke)
                .attr("stroke",vars.highlight_color);
            d3.select(text.node().parentNode)
              .insert("rect","text")
                .attr("rx",corner)
                .attr("ry",corner)
                .attr("stroke-width", 0)
                .attr("fill",fill_color(d))
                .attr("width",w)
                .attr("height",h)
                .attr("y",scale.y(d.y)-(h/2))
                .attr("x",scale.x(d.x)-(w/2));
          }
        }
        
      })
      
    }
  }
      
};

vizwhiz.stacked = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper function used to create stack polygon
  //-------------------------------------------------------------------
  
  var stack = d3.layout.stack()
    .values(function(d) { return d.values; })
    .x(function(d) { return d[vars.year_var]; })
    .y(function(d) { return d[vars.yaxis_var]; });
  
  //===================================================================
      
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------
  
  // get max total for sums of each xaxis
  var xaxis_sums = d3.nest()
    .key(function(d){return d[vars.xaxis_var] })
    .rollup(function(leaves){
      return d3.sum(leaves, function(d){return d[vars.yaxis_var];})
    })
    .entries(vars.data)
  
  var data_max = vars.layout == "share" ? 1 : d3.max(xaxis_sums, function(d){ return d.values; });
  
  // nest data properly according to nesting array
  nested_data = nest_data();
  
  // scales for both X and Y values
  var year_extent = vars.year instanceof Array ? vars.year : d3.extent(vars.years)
  
  vars.x_scale = d3.scale[vars.xscale_type]()
    .domain(year_extent)
    .range([0, vars.graph.width]);
  // **WARNING reverse scale from 0 - max converts from height to 0 (inverse)
  vars.y_scale = d3.scale[vars.yscale_type]()
    .domain([0, data_max])
    .range([vars.graph.height, 0]);
    
  graph_update()
  
  // Helper function unsed to convert stack values to X, Y coords 
  var area = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return vars.x_scale(d[vars.year_var]); })
    .y0(function(d) { return vars.y_scale(d.y0); })
    .y1(function(d) { return vars.y_scale(d.y0 + d.y)+1; });
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // LAYERS
  //-------------------------------------------------------------------
  
  vars.chart_enter.append("clipPath")
    .attr("id","path_clipping")
    .append("rect")
      .attr("width",vars.graph.width)
      .attr("height",vars.graph.height)
  
  d3.select("#path_clipping rect").transition().duration(vizwhiz.timing)
    .attr("width",vars.graph.width)
    .attr("height",vars.graph.height)
  
  // Get layers from d3.stack function (gives x, y, y0 values)
  var offset = vars.layout == "value" ? "zero" : "expand";
  var layers = stack.offset(offset)(nested_data)
  
  // container for layers
  vars.chart_enter.append("g").attr("class", "layers")
    .attr("clip-path","url(#path_clipping)")
  
  // give data with key function to variables to draw
  var paths = d3.select("g.layers").selectAll(".layer")
    .data(layers, function(d){ return d.key; })
  
  // ENTER
  // enter new paths, could be next level deep or up a level
  paths.enter().append("path")
    .attr("opacity", 0)
    .attr("id", function(d){
      return "path_"+d[vars.id_var]
    })
    .attr("class", "layer")
    .attr("stroke",vars.highlight_color)
    .attr("stroke-width",0)
    .attr("fill", function(d){
      return find_variable(d.key,vars.color_var)
    })
    .attr("d", function(d) {
      return area(d.values);
    })
  
  // UPDATE
  paths
    .on(vizwhiz.evt.over, function(d){
      
      var id = find_variable(d,vars.id_var),
          self = d3.select("#path_"+id).node()
      
      d3.select(self).attr("stroke-width",3)

      d3.selectAll("line.rule").remove();
      
      var mouse_x = d3.event.layerX-vars.graph.margin.left;
      var rev_x_scale = d3.scale.linear()
        .domain(vars.x_scale.range()).range(vars.x_scale.domain());
      var this_x = Math.round(rev_x_scale(mouse_x));
      var this_x_index = vars.years.indexOf(this_x)
      var this_value = d.values[this_x_index]
      
      // add dashed line at closest X position to mouse location
      d3.select("g.chart").append("line")
        .datum(d)
        .attr("class", "rule")
        .attr({"x1": vars.x_scale(this_x), "x2": vars.x_scale(this_x)})
        .attr({"y1": vars.y_scale(this_value.y0), "y2": vars.y_scale(this_value.y + this_value.y0)})
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5)
        .attr("stroke-dasharray", "5,3")
        .attr("pointer-events","none")
      
      // tooltip
      var tooltip_data = get_tooltip_data(this_value,"short")
    
      var path_height = vars.y_scale(this_value.y + this_value.y0)-vars.y_scale(this_value.y0),
          tooltip_x = vars.x_scale(this_x)+vars.graph.margin.left+vars.margin.left+vars.parent.node().offsetLeft,
          tooltip_y = vars.y_scale(this_value.y0 + this_value.y)+(path_height)/2+vars.graph.margin.top+vars.margin.top+vars.parent.node().offsetTop

      vizwhiz.tooltip.create({
        "data": tooltip_data,
        "title": find_variable(d[vars.id_var],vars.text_var),
        "id": id,
        "icon": find_variable(d[vars.id_var],"icon"),
        "color": find_variable(d[vars.id_var],vars.color_var),
        "x": tooltip_x,
        "y": tooltip_y,
        "offset": (path_height/2),
        "arrow": true,
        "footer": footer_text(),
        "mouseevents": false
      })
      
    })
    .on(vizwhiz.evt.move, function(d){
      
      var id = find_variable(d,vars.id_var),
          self = d3.select("#path_"+id).node()
          
      var mouse_x = d3.event.layerX-vars.graph.margin.left;
      var rev_x_scale = d3.scale.linear()
        .domain(vars.x_scale.range()).range(vars.x_scale.domain());
      var this_x = Math.round(rev_x_scale(mouse_x));
      var this_x_index = vars.years.indexOf(this_x)
      var this_value = d.values[this_x_index]
          
      d3.selectAll("line.rule")
        .attr({"x1": vars.x_scale(this_x), "x2": vars.x_scale(this_x)})
        .attr({"y1": vars.y_scale(this_value.y0), "y2": vars.y_scale(this_value.y + this_value.y0)})
        
      var tooltip_data = get_tooltip_data(this_value,"short")
    
      var path_height = vars.y_scale(this_value.y0)-vars.y_scale(this_value.y + this_value.y0),
          tooltip_x = vars.x_scale(this_x)+vars.graph.margin.left+vars.margin.left+vars.parent.node().offsetLeft,
          tooltip_y = vars.y_scale(this_value.y + this_value.y0)+(path_height/2)+vars.graph.margin.top+vars.margin.top+vars.parent.node().offsetTop

      vizwhiz.tooltip.remove(id)
      vizwhiz.tooltip.create({
        "data": tooltip_data,
        "title": find_variable(d[vars.id_var],vars.text_var),
        "id": id,
        "icon": find_variable(d[vars.id_var],"icon"),
        "color": find_variable(d[vars.id_var],vars.color_var),
        "x": tooltip_x,
        "y": tooltip_y,
        "offset": (path_height/2),
        "arrow": true,
        "footer": footer_text(),
        "mouseevents": false
      })
      
    })
    .on(vizwhiz.evt.out, function(d){
      
      var id = find_variable(d,vars.id_var),
          self = d3.select("#path_"+id).node()
      
      d3.selectAll("line.rule").remove()
      vizwhiz.tooltip.remove(id)
      d3.select(self).attr("stroke-width",0)
      
    })
    .on(vizwhiz.evt.click, function(d){
      
      var html = null
      if (vars.click_function) html = vars.click_function(d)
      if (html || vars.tooltip_info.long) {
        
        var id = find_variable(d,vars.id_var)
      
        d3.selectAll("line.rule").remove()
        vizwhiz.tooltip.remove(id)
        d3.select(this).attr("stroke-width",0)
        
        var tooltip_data = get_tooltip_data(d,"long")
        
        vizwhiz.tooltip.create({
          "title": find_variable(d[vars.id_var],vars.text_var),
          "color": find_variable(d[vars.id_var],vars.color_var),
          "icon": find_variable(d[vars.id_var],"icon"),
          "id": id,
          "fullscreen": true,
          "html": html,
          "footer": vars.data_source,
          "data": tooltip_data,
          "mouseevents": this,
          "parent": vars.parent,
          "background": vars.background
        })
        
      }
      
    })
  
  paths.transition().duration(vizwhiz.timing)
    .attr("opacity", 1)
    .attr("fill", function(d){
      return find_variable(d.key,vars.color_var)
    })
    .attr("d", function(d) {
      return area(d.values);
    })

  // EXIT
  paths.exit()
    .transition().duration(vizwhiz.timing)
    .attr("opacity", 0)
    .remove()
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // TEXT LAYERS
  //-------------------------------------------------------------------

  var defs = vars.chart_enter.append('svg:defs')
  vizwhiz.utils.drop_shadow(defs)

  // filter layers to only the ones with a height larger than 6% of viz
  var text_layers = [];
  var text_height_scale = d3.scale.linear().range([0, 1]).domain([0, data_max]);

  layers.forEach(function(layer){
    // find out which is the largest
    var available_areas = layer.values.filter(function(d,i,a){
      
      var min_height = 30;
      if (i == 0) {
        return (vars.graph.height-vars.y_scale(d.y)) >= min_height 
            && (vars.graph.height-vars.y_scale(a[i+1].y)) >= min_height
            && (vars.graph.height-vars.y_scale(a[i+2].y)) >= min_height
            && vars.y_scale(d.y)-(vars.graph.height-vars.y_scale(d.y0)) < vars.y_scale(a[i+1].y0)
            && vars.y_scale(a[i+1].y)-(vars.graph.height-vars.y_scale(a[i+1].y0)) < vars.y_scale(a[i+2].y0)
            && vars.y_scale(d.y0) > vars.y_scale(a[i+1].y)-(vars.graph.height-vars.y_scale(a[i+1].y0))
            && vars.y_scale(a[i+1].y0) > vars.y_scale(a[i+2].y)-(vars.graph.height-vars.y_scale(a[i+2].y0));
      }
      else if (i == a.length-1) {
        return (vars.graph.height-vars.y_scale(d.y)) >= min_height 
            && (vars.graph.height-vars.y_scale(a[i-1].y)) >= min_height
            && (vars.graph.height-vars.y_scale(a[i-2].y)) >= min_height
            && vars.y_scale(d.y)-(vars.graph.height-vars.y_scale(d.y0)) < vars.y_scale(a[i-1].y0)
            && vars.y_scale(a[i-1].y)-(vars.graph.height-vars.y_scale(a[i-1].y0)) < vars.y_scale(a[i-2].y0)
            && vars.y_scale(d.y0) > vars.y_scale(a[i-1].y)-(vars.graph.height-vars.y_scale(a[i-1].y0))
            && vars.y_scale(a[i-1].y0) > vars.y_scale(a[i-2].y)-(vars.graph.height-vars.y_scale(a[i-2].y0));
      }
      else {
        return (vars.graph.height-vars.y_scale(d.y)) >= min_height 
            && (vars.graph.height-vars.y_scale(a[i-1].y)) >= min_height
            && (vars.graph.height-vars.y_scale(a[i+1].y)) >= min_height
            && vars.y_scale(d.y)-(vars.graph.height-vars.y_scale(d.y0)) < vars.y_scale(a[i+1].y0)
            && vars.y_scale(d.y)-(vars.graph.height-vars.y_scale(d.y0)) < vars.y_scale(a[i-1].y0)
            && vars.y_scale(d.y0) > vars.y_scale(a[i+1].y)-(vars.graph.height-vars.y_scale(a[i+1].y0))
            && vars.y_scale(d.y0) > vars.y_scale(a[i-1].y)-(vars.graph.height-vars.y_scale(a[i-1].y0));
      }
    });
    var best_area = d3.max(layer.values,function(d,i){
      if (available_areas.indexOf(d) >= 0) {
        if (i == 0) {
          return (vars.graph.height-vars.y_scale(d.y))
               + (vars.graph.height-vars.y_scale(layer.values[i+1].y))
               + (vars.graph.height-vars.y_scale(layer.values[i+2].y));
        }
        else if (i == layer.values.length-1) {
          return (vars.graph.height-vars.y_scale(d.y))
               + (vars.graph.height-vars.y_scale(layer.values[i-1].y))
               + (vars.graph.height-vars.y_scale(layer.values[i-2].y));
        }
        else {
          return (vars.graph.height-vars.y_scale(d.y))
               + (vars.graph.height-vars.y_scale(layer.values[i-1].y))
               + (vars.graph.height-vars.y_scale(layer.values[i+1].y));
        }
      } else return null;
    });
    var best_area = layer.values.filter(function(d,i,a){
      if (i == 0) {
        return (vars.graph.height-vars.y_scale(d.y))
             + (vars.graph.height-vars.y_scale(layer.values[i+1].y))
             + (vars.graph.height-vars.y_scale(layer.values[i+2].y)) == best_area;
      }
      else if (i == layer.values.length-1) {
        return (vars.graph.height-vars.y_scale(d.y))
             + (vars.graph.height-vars.y_scale(layer.values[i-1].y))
             + (vars.graph.height-vars.y_scale(layer.values[i-2].y)) == best_area;
      }
      else {
        return (vars.graph.height-vars.y_scale(d.y))
             + (vars.graph.height-vars.y_scale(layer.values[i-1].y))
             + (vars.graph.height-vars.y_scale(layer.values[i+1].y)) == best_area;
      }
    })[0]
    if (best_area) {
      layer.tallest = best_area
      text_layers.push(layer)
    }
  
  })
  // container for text layers
  vars.chart_enter.append("g").attr("class", "text_layers")

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
    // .attr('filter', 'url(#dropShadow)')
    .attr("class", "label")
    .style("font-weight","bold")
    .attr("font-size","14px")
    .attr("font-family","Helvetica")
    .attr("dy", 6)
    .attr("opacity",0)
    .attr("pointer-events","none")
    .attr("text-anchor", function(d){
      // if first, left-align text
      if(d.tallest[vars.year_var] == vars.x_scale.domain()[0]) return "start";
      // if last, right-align text
      if(d.tallest[vars.year_var] == vars.x_scale.domain()[1]) return "end";
      // otherwise go with middle
      return "middle"
    })
    .attr("fill", function(d){
      return vizwhiz.utils.text_color(find_variable(d[vars.id_var],vars.color_var))
    })
    .attr("x", function(d){
      var pad = 0;
      // if first, push it off 10 pixels from left side
      if(d.tallest[vars.year_var] == vars.x_scale.domain()[0]) pad += 10;
      // if last, push it off 10 pixels from right side
      if(d.tallest[vars.year_var] == vars.x_scale.domain()[1]) pad -= 10;
      return vars.x_scale(d.tallest[vars.year_var]) + pad;
    })
    .attr("y", function(d){
      var height = vars.graph.height - vars.y_scale(d.tallest.y);
      return vars.y_scale(d.tallest.y0 + d.tallest.y) + (height/2);
    })
    .text(function(d) {
      return find_variable(d[vars.id_var],vars.text_var)
    })
    .each(function(d){
      // set usable width to 2x the width of each x-axis tick
      var tick_width = (vars.graph.width / vars.years.length) * 2;
      // if the text box's width is larger than the tick width wrap text
      if(this.getBBox().width > tick_width){
        // first remove the current text
        d3.select(this).text("")
        // figure out the usable height for this location along x-axis
        var height = vars.graph.height-vars.y_scale(d.tallest.y)
        // wrap text WITHOUT resizing
        // vizwhiz.utils.wordwrap(d[nesting[nesting.length-1]], this, tick_width, height, false)
      
        vizwhiz.utils.wordwrap({
          "text": find_variable(d[vars.id_var],vars.text_var),
          "parent": this,
          "width": tick_width,
          "height": height,
          "resize": false
        })
      
        // reset Y to compensate for new multi-line height
        var offset = (height - this.getBBox().height) / 2;
        // top of the element's y attr
        var y_top = vars.y_scale(d.tallest.y0 + d.tallest.y);
        d3.select(this).attr("y", y_top + offset)
      }
    })
    
  // UPDATE
  texts.transition().duration(vizwhiz.timing)
    .attr("opacity",function(){
      if (vars.small || !vars.labels) return 0
      else return 1
    })
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Nest data function (needed for getting flat data ready for stacks)
  //-------------------------------------------------------------------
  
  function nest_data(){
    
    var nested = d3.nest()
      .key(function(d){ return d[vars.id_var]; })
      .rollup(function(leaves){
          
        // Make sure all xaxis_vars at least have 0 values
        var years_available = leaves
          .reduce(function(a, b){ return a.concat(b[vars.xaxis_var])}, [])
          .filter(function(y, i, arr) { return arr.indexOf(y) == i })
          
        vars.years.forEach(function(y){
          if(years_available.indexOf(y) < 0){
            var obj = {}
            obj[vars.xaxis_var] = y
            obj[vars.yaxis_var] = 0
            if (leaves[0][vars.id_var]) obj[vars.id_var] = leaves[0][vars.id_var]
            if (leaves[0][vars.text_var]) obj[vars.text_var] = leaves[0][vars.text_var]
            if (leaves[0][vars.color_var]) obj[vars.color_var] = leaves[0][vars.color_var]
            leaves.push(obj)
          }
        })
        
        return leaves.sort(function(a,b){
          return a[vars.xaxis_var]-b[vars.xaxis_var];
        });
        
      })
      .entries(vars.data)
    
    nested.forEach(function(d, i){
      d.total = d3.sum(d.values, function(dd){ return dd[vars.yaxis_var]; })
      d[vars.text_var] = d.values[0][vars.text_var]
      d[vars.id_var] = d.values[0][vars.id_var]
    })
    // return nested
    
    return nested.sort(function(a,b){
          
      var s = vars.sort == "value" ? "total" : vars.sort
      
      a_value = find_variable(a,s)
      b_value = find_variable(b,s)
      
      if (s == vars.color_var) {
      
        a_value = d3.rgb(a_value).hsl()
        b_value = d3.rgb(b_value).hsl()
        
        if (a_value.s == 0) a_value = 361
        else a_value = a_value.h
        if (b_value.s == 0) b_value = 361
        else b_value = b_value.h
        
      }
      
      if(a_value<b_value) return vars.order == "desc" ? -1 : 1;
      if(a_value>b_value) return vars.order == "desc" ? 1 : -1;
      return 0;
      
    });
    
  }

  //===================================================================
    
};
vizwhiz.tree_map = function(vars) {
  
  // Ok, to get started, lets run our heirarchically nested
  // data object through the d3 treemap function to get a
  // flat array of data with X, Y, width and height vars
  var tmap_data = d3.layout.treemap()
    .round(false)
    .size([vars.width, vars.height])
    .children(function(d) { return d.children; })
    .sort(function(a, b) { return a.value - b.value; })
    .value(function(d) { return d[vars.value_var]; })
    .nodes(vars.data)
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
    .attr("id",function(d){
      return "cell_"+d[vars.id_var]
    })
    .attr("opacity", 0)
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; 
    })
    
  // rectangle
  cell_enter.append("rect")
    .attr("stroke",vars.background)
    .attr("stroke-width",1)
    .attr('width', function(d) {
      return d.dx+'px'
    })
    .attr('height', function(d) { 
      return d.dy+'px'
    })
    .attr("fill", function(d){
      return find_variable(d,vars.color_var);
    })
    .attr("shape-rendering","crispEdges")
    
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
    .attr("fill", function(d){ 
      var color = find_variable(d,vars.color_var)
      return vizwhiz.utils.text_color(color); 
    })
    .style("pointer-events","none")
    
  // text (share)
  cell_enter.append("text")
    .attr('class','share')
    .attr("text-anchor","middle")
    .style("font-weight","bold")
    .attr("font-family","Helvetica")
    .attr("fill", function(d){
      var color = find_variable(d,vars.color_var)
      return vizwhiz.utils.text_color(color); 
    })
    .attr("fill-opacity",0.5)
    .style("pointer-events","none")
    .text(function(d) {
      var root = d;
      while(root.parent){ root = root.parent; } // find top most parent node
      d.share = vars.number_format((d.value/root.value)*100,"share")+"%";
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
  
  cell
    .on(vizwhiz.evt.over,function(d){
      
      var id = find_variable(d,vars.id_var),
          self = d3.select("#cell_"+id).node()
      
      self.parentNode.appendChild(self)
      
      d3.select("#cell_"+id).select("rect")
        .style("cursor","pointer")
        .attr("stroke",vars.highlight_color)
        .attr("stroke-width",2)

      var tooltip_data = get_tooltip_data(d,"short")
      tooltip_data.push({"name": vars.text_format("share"), "value": d.share});
      
      vizwhiz.tooltip.create({
        "title": find_variable(d,vars.text_var),
        "color": find_variable(d,vars.color_var),
        "icon": find_variable(d,"icon"),
        "id": id,
        "x": d3.event.pageX,
        "y": d3.event.pageY,
        "offset": 3,
        "arrow": true,
        "mouseevents": false,
        "footer": footer_text(),
        "data": tooltip_data
      })
      
    })
    .on(vizwhiz.evt.out,function(d){
      
      var id = find_variable(d,vars.id_var)
      
      d3.select("#cell_"+id).select("rect")
        .attr("stroke",vars.background)
        .attr("stroke-width",1)
      
      vizwhiz.tooltip.remove(id)
      
    })
    .on(vizwhiz.evt.click,function(d){
      
      var html = null
      if (vars.click_function) html = vars.click_function(d)
      if (html || vars.tooltip_info.long) {
        
        var id = find_variable(d,vars.id_var)
      
        d3.select("#cell_"+id).select("rect")
          .attr("stroke",vars.background)
          .attr("stroke-width",1)
        
        vizwhiz.tooltip.remove(id)
        
        var tooltip_data = get_tooltip_data(d,"long")
        tooltip_data.push({"name": vars.text_format("share"), "value": d.share});
        
        vizwhiz.tooltip.create({
          "title": find_variable(d,vars.text_var),
          "color": find_variable(d,vars.color_var),
          "icon": find_variable(d,"icon"),
          "id": id,
          "fullscreen": true,
          "html": html,
          "footer": vars.data_source,
          "data": tooltip_data,
          "mouseevents": this,
          "parent": vars.parent,
          "background": vars.background
        })
        
      }
      
    })
    .on(vizwhiz.evt.move,function(d){
      var id = find_variable(d,vars.id_var)
      vizwhiz.tooltip.move(d3.event.pageX,d3.event.pageY,id)
    })
  
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
      var name = find_variable(d,vars.text_var)
      if(name && d.dx > 30 && d.dy > 30){
        var text = []
        var arr = vars.name_array ? vars.name_array : [vars.text_var,vars.id_var]
        arr.forEach(function(n){
          var name = find_variable(d,n)
          if (name) text.push(vars.text_format(name))
        })
        
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
          while(root.parent){ root = root.parent; } // find top most parent node
          d.share = vars.number_format((d.value/root.value)*100,"share")+"%";
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
vizwhiz.geo_map = function(vars) { 
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Zoom Function
  //-------------------------------------------------------------------
  
  vars.zoom = function(param,custom_timing) {
    
    var translate = vars.zoom_behavior.translate(),
        zoom_extent = vars.zoom_behavior.scaleExtent()
        
    var scale = vars.zoom_behavior.scale()
    
    if (param == "in") var scale = scale*2
    else if (param == "out") var scale = scale*0.5
    else if (param == "reset") {
      var param = vars.boundries
      if (vars.highlight) {
        var temp = vars.highlight;
        vars.highlight = null;
        d3.select("#path"+temp).call(color_paths);
        vars.update();
      }
    }
    
    var svg_scale = scale/vars.width,
        svg_translate = [translate[0]-(scale/2),translate[1]-(((scale/vars.width)*vars.height)/2)]
        
    old_scale = vars.projection.scale()*2*Math.PI
    old_translate = vars.projection.translate()
        
    if (param.coordinates) {
      
      if (vars.highlight) { 
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

  vars.update = function() {
    
    vizwhiz.tooltip.remove();
    
    if (!vars.small && (hover || vars.highlight)) {
      
      var id = vars.highlight ? vars.highlight : hover
      
      var data = vars.data[id]
      
      if (data && data[vars.value_var]) {
        var color = value_color(data[vars.value_var])
      }
      else {
        var color = "#888"
      }
      
      if (!data || !data[vars.value_var]) {
        var footer = vars.text_format("No Data Available")
      }
      else if (!vars.highlight) {
        var tooltip_data = get_tooltip_data(id,"short"),
            footer = footer_text(),
            html = null
      }
      else {
        var tooltip_data = get_tooltip_data(id,"long"),
            footer = vars.data_source,
            html = vars.click_function ? vars.click_function(id) : null
      }
      
      vizwhiz.tooltip.create({
        "data": tooltip_data,
        "title": find_variable(id,vars.text_var),
        "id": find_variable(id,vars.id_var),
        "icon": find_variable(id,"icon"),
        "color": color,
        "footer": footer,
        "x": vars.width-info_width-5+vars.margin.left,
        "y": vars.margin.top+5,
        "fixed": true,
        "width": info_width,
        "html": html,
        "parent": vars.parent,
        "background": vars.background
      })
      
    }
    
  }

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
      .on("zoom",function(d){ vars.zoom(d); })
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
      scale_width = 250,
      path = d3.geo.path().projection(vars.projection),
      tile = d3.geo.tile().size([vars.width, vars.height]),
      old_scale = vars.projection.scale()*2*Math.PI,
      old_translate = vars.projection.translate(),
      hover = null;

  //===================================================================
  
  if (vars.data) {
    data_extent = d3.extent(d3.values(vars.data),function(d){
      return d[vars.value_var] && d[vars.value_var] != 0 ? d[vars.value_var] : null
    })
    var data_range = [],
        step = 0.0
    while(step <= 1) {
      data_range.push((data_extent[0]*Math.pow((data_extent[1]/data_extent[0]),step)))
      step += 0.25
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
      .attr("id","water")
      .attr("width",vars.width)
      .attr("height",vars.height)
      .attr(vars.map.style.water);
      
    d3.select("#water").transition().duration(vizwhiz.timing)
      .attr("width",vars.width)
      .attr("height",vars.height)
      
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
    .on(vizwhiz.evt.down,function(d){
      dragging = true
    })
    .on(vizwhiz.evt.up,function(d){
      dragging = false
    })
    .append('g')
      .attr('class','viz');
    
  viz_enter.append("rect")
    .attr("class","overlay")
    .attr("width",vars.width)
    .attr("height",vars.height)
    .attr("fill","transparent");
    
  d3.select("rect.overlay")
    .on(vizwhiz.evt.move, function(d) {
      if (vars.highlight) {
        d3.select(this).style("cursor","-moz-zoom-out")
        d3.select(this).style("cursor","-webkit-zoom-out")
      }
      else {
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
    })
    .on(vizwhiz.evt.click, function(d) {
      if (vars.highlight) {
        vars.zoom("reset");
      }
    })
    
  viz_enter.append('g')
    .attr('class','paths');
  
  // add scale
  var gradient = defs
    .append("linearGradient")
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
    .attr("transform","translate(30,5)");
    
  var shadow = defs.append("filter")
    .attr("id", "shadow")
    .attr("x", "-50%")
    .attr("y", "0")
    .attr("width", "200%")
    .attr("height", "200%");
    
  shadow.append("feGaussianBlur")
    .attr("in","SourceAlpha")
    .attr("result","blurOut")
    .attr("stdDeviation","3")
    
  shadow.append("feOffset")
    .attr("in","blurOut")
    .attr("result","the-shadow")
    .attr("dx","0")
    .attr("dy","1")
    
  shadow.append("feColorMatrix")
    .attr("in","the-shadow")
    .attr("result","colorOut")
    .attr("type","matrix")
    .attr("values","0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0")
    
  shadow.append("feBlend")
    .attr("in","SourceGraphic")
    .attr("in2","colorOut")
    .attr("mode","normal")
  
  scale.append("rect")
    .attr("id","scalebg")
    .attr("width", scale_width+"px")
    .attr("height", "45px")
    .attr("fill","#ffffff")
    .attr("opacity",0.75)
    .attr("filter","url(#shadow)")
    .attr("shape-rendering","crispEdges")
      
  scale.append("text")
    .attr("id","scale_title")
    .attr("x",(scale_width/2)+"px")
    .attr("y","0px")
    .attr("dy","1.25em")
    .attr("text-anchor","middle")
    .attr("fill","#333")
    .attr("font-size","10px")
    .attr("font-family","Helvetica")
  
  scale.append("rect")
    .attr("id","scalecolor")
    .attr("x",scale_padding+"px")
    .attr("y",(scale_height*1.75)+"px")
    .attr("width", (scale_width-(scale_padding*2))+"px")
    .attr("height", scale_height*0.75+"px")
    .style("fill", "url(#gradient)")
     
  data_range.forEach(function(v,i){
    if (i == data_range.length-1) {
      var x = scale_padding+Math.round((i/(data_range.length-1))*(scale_width-(scale_padding*2)))-1
    } else if (i != 0) {
      var x = scale_padding+Math.round((i/(data_range.length-1))*(scale_width-(scale_padding*2)))-1
    } else {
      var x = scale_padding+Math.round((i/(data_range.length-1))*(scale_width-(scale_padding*2)))
    }
    scale.append("rect")
      .attr("id","scaletick_"+i)
      .attr("x", x+"px")
      .attr("y", (scale_height*1.75)+"px")
      .attr("width", 1)
      .attr("height", ((scale_height*0.75)+3)+"px")
      .style("fill", "#333")
      .attr("opacity",0.25)
      
    scale.append("text")
      .attr("id","scale_"+i)
      .attr("x",x+"px")
      .attr("y", (scale_height*2.75)+"px")
      .attr("dy","1em")
      .attr("text-anchor","middle")
      .attr("fill","#333")
      .style("font-weight","normal")
      .attr("font-size","10px")
      .attr("font-family","Helvetica")
  })

  if (!data_extent[0] || Object.keys(vars.data).length < 2 || vars.small) {
    d3.select("g.scale").transition().duration(vizwhiz.timing)
      .style("opacity",0)
  }
  else {
    var max = 0
    data_range.forEach(function(v,i){
      var elem = d3.select("g.scale").select("text#scale_"+i)
      elem.text(vars.number_format(v,vars.value_var))
      var w = elem.node().offsetWidth
      if (w > max) max = w
    })
    
    max += 10
      
    d3.select("g.scale").transition().duration(vizwhiz.timing)
      .style("opacity",1)
      
    d3.select("g.scale").select("rect#scalebg").transition().duration(vizwhiz.timing)
      .attr("width",max*data_range.length+"px")
      
    d3.select("g.scale").select("rect#scalecolor").transition().duration(vizwhiz.timing)
      .attr("x",max/2+"px")
      .attr("width",max*(data_range.length-1)+"px")
      
    d3.select("g.scale").select("text#scale_title").transition().duration(vizwhiz.timing)
      .attr("x",(max*data_range.length)/2+"px")
      .text(vars.text_format(vars.value_var))
      
    data_range.forEach(function(v,i){
      
      if (i == data_range.length-1) {
        var x = (max/2)+Math.round((i/(data_range.length-1))*(max*data_range.length-(max)))-1
      } 
      else if (i != 0) {
        var x = (max/2)+Math.round((i/(data_range.length-1))*(max*data_range.length-(max)))-1
      } 
      else {
        var x = (max/2)+Math.round((i/(data_range.length-1))*(max*data_range.length-(max)))
      }
      
      d3.select("g.scale").select("rect#scaletick_"+i).transition().duration(vizwhiz.timing)
        .attr("x",x+"px")
      
      d3.select("g.scale").select("text#scale_"+i).transition().duration(vizwhiz.timing)
        .attr("x",x+"px")
    })
    
  }
  
  zoom_controls();
  
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
      if (!dragging) {
        hover = d[vars.id_var]
        if (vars.highlight != d[vars.id_var]) {
          d3.select(this).style("cursor","pointer")
          d3.select(this).style("cursor","-moz-zoom-in")
          d3.select(this).style("cursor","-webkit-zoom-in")
          d3.select(this).attr("opacity",select_opacity);
        }
        if (!vars.highlight) {
          vars.update();
        }
      }
    })
    .on(vizwhiz.evt.out, function(d){
      hover = null
      if (vars.highlight != d[vars.id_var]) {
        d3.select(this).attr("opacity",default_opacity);
      }
      if (!vars.highlight) {
        vars.update();
      }
    })
    .on(vizwhiz.evt.click, function(d) {
      if (vars.highlight == d[vars.id_var]) {
        vars.zoom("reset");
      } 
      else {
        if (vars.highlight) {
          var temp = vars.highlight
          vars.highlight = null
          d3.select("path#path"+temp).call(color_paths);
        }
        vars.highlight = d[vars.id_var];
        d3.select(this).call(color_paths);
        vars.zoom(d3.select(this).datum());
      }
      vars.update();
    })
  
  coord.transition().duration(vizwhiz.timing)
    .attr("opacity",default_opacity)
    .call(color_paths);
  
  vars.update();

  //===================================================================
  
  if (vars.init) {
    vars.zoom(vars.boundries,0);
    vars.init = false;
  }
  if (vars.highlight) {
    vars.zoom(d3.select("path#path"+vars.highlight).datum());
  }
  
  function color_paths(p) {
    defs.selectAll("#stroke_clip").remove();
    p
      .attr("fill",function(d){ 
        if (d[vars.id_var] == vars.highlight) return "none";
        else if (!vars.data[d[vars.id_var]]) return "#888888";
        else return vars.data[d[vars.id_var]][vars.value_var] ? value_color(vars.data[d[vars.id_var]][vars.value_var]) : "#888888"
      })
      .attr("stroke-width",function(d) {
        if (d[vars.id_var] == vars.highlight) return 10;
        else return stroke_width;
      })
      .attr("stroke",function(d) {
        if (d[vars.id_var] == vars.highlight) {
          if (!vars.data[d[vars.id_var]]) return "#888"
          return vars.data[d[vars.id_var]][vars.value_var] ? value_color(vars.data[d[vars.id_var]][vars.value_var]) : "#888888";
        }
        else return "white";
      })
      .attr("opacity",function(d){
        if (d[vars.id_var] == vars.highlight) return select_opacity;
        else return default_opacity;
      })
      .attr("clip-path",function(d){ 
        if (d[vars.id_var] == vars.highlight) return "url(#stroke_clip)";
        else return "none"
      })
      .each(function(d){
        if (d[vars.id_var] == vars.highlight) {
          d3.select("defs").append("clipPath")
            .attr("id","stroke_clip")
            .append("use")
              .attr("xlink:href",function(dd) { return "#path"+vars.highlight } )
        }
      });
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

vizwhiz.pie_scatter = function(vars) {
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define size scaling
  //-------------------------------------------------------------------
    
  var size_domain = d3.extent(vars.data, function(d){ 
    return d[vars.value_var] == 0 ? null : d[vars.value_var] 
  })
  
  if (!size_domain[1]) size_domain = [0,0]
  
  var max_size = d3.max([d3.min([vars.graph.width,vars.graph.height])/25,10]),
      min_size = 3
      
  if (size_domain[0] == size_domain[1]) var min_size = max_size
  
  var size_range = [min_size,max_size]
  
  vars.size_scale = d3.scale[vars.size_scale_type]()
    .domain(size_domain)
    .range(size_range)
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Graph setup
  //-------------------------------------------------------------------
    
  // Create Axes
  vars.x_scale = d3.scale[vars.xscale_type]()
    .domain(vars.xaxis_domain)
    .range([0, vars.graph.width])
    .nice()

  vars.y_scale = d3.scale[vars.yscale_type]()
    .domain(vars.yaxis_domain)
    .range([0, vars.graph.height])
    .nice()

  if (vars.xscale_type != "log") set_buffer("x")
  if (vars.yscale_type != "log") set_buffer("y")
  
  // set buffer room (take into account largest size var)
  function set_buffer(axis) {
    
    var scale = vars[axis+"_scale"]
    var inverse_scale = d3.scale[vars[axis+"scale_type"]]()
      .domain(scale.range())
      .range(scale.domain())
      
    var largest_size = vars.size_scale.range()[1]

    // convert largest size to x scale domain
    largest_size = inverse_scale(largest_size)
    
    // get radius of largest in pixels by subtracting this value from the x scale minimum
    var buffer = largest_size - scale.domain()[0];

    // update x scale with new buffer offsets
    vars[axis+"_scale"]
      .domain([scale.domain()[0]-buffer,scale.domain()[1]+buffer])
  }
  
  graph_update();
  
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
  vars.data.sort(function(node_a, node_b){
    return node_b[vars.value_var] - node_a[vars.value_var];
  })
  
  vars.chart_enter.append("g").attr("class","circles")
  
  var nodes = d3.select("g.circles").selectAll("g.circle")
    .data(vars.data,function(d){ return d[vars.id_var] })
  
  nodes.enter().append("g")
    .attr("opacity", 0)
    .attr("class", "circle")
    .attr("transform", function(d) { return "translate("+vars.x_scale(d[vars.xaxis_var])+","+vars.y_scale(d[vars.yaxis_var])+")" } )
    .each(function(d){
      
      d3.select(this)
        .append("circle")
        .style("stroke", function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) {
            return "#333";
          }
          else {
            return find_variable(d[vars.id_var],vars.color_var);
          }
        })
        .style('stroke-width', 1)
        .style('fill', function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) {
            return find_variable(d[vars.id_var],vars.color_var);
          }
          else {
            var c = d3.hsl(find_variable(d[vars.id_var],vars.color_var));
            c.l = 0.95;
            return c.toString();
          }
        })
        .attr("r", 0 )
        
      vars.arc_angles[d.id] = 0
      vars.arc_sizes[d.id] = 0
        
      d3.select(this)
        .append("path")
        .style('fill', find_variable(d[vars.id_var],vars.color_var) )
        .style("fill-opacity", 1)
        
      d3.select(this).select("path").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween)
        
    })
  
  // update
  
  nodes
    .on(vizwhiz.evt.over, hover())
    .on(vizwhiz.evt.out, function(d){
      var id = find_variable(d,vars.id_var)
      vizwhiz.tooltip.remove(id)
      d3.selectAll(".axis_hover").remove()
    })
    .on(vizwhiz.evt.click, function(d){
      
      var html = vars.click_function ? vars.click_function(d) : null
      if (html || vars.tooltip_info.long) {

        var id = find_variable(d,vars.id_var)
        vizwhiz.tooltip.remove(id)
        d3.selectAll(".axis_hover").remove()
        
        var tooltip_data = get_tooltip_data(d,"long")
        if (d.num_children > 1 && !vars.spotlight) {
          var a = d.num_children_active+"/"+d.num_children
          tooltip_data.push({
            "name": vars.text_format(vars.active_var), 
            "value": a
          });
        }
        
        vizwhiz.tooltip.create({
          "title": find_variable(d,vars.text_var),
          "color": find_variable(d,vars.color_var),
          "icon": find_variable(d,"icon"),
          "id": id,
          "fullscreen": true,
          "html": html,
          "footer": vars.data_source,
          "data": tooltip_data,
          "mouseevents": this,
          "parent": vars.parent,
          "background": vars.background
        })
        
      }
      
    })
    
  nodes.transition().duration(vizwhiz.timing)
    .attr("transform", function(d) { return "translate("+vars.x_scale(d[vars.xaxis_var])+","+vars.y_scale(d[vars.yaxis_var])+")" } )
    .attr("opacity", 1)
    .each(function(d){

      var val = d[vars.value_var]
      val = val && val > 0 ? val : vars.size_scale.domain()[0]
      d.arc_radius = vars.size_scale(val);
      
      d3.select(this).select("circle").transition().duration(vizwhiz.timing)
        .style("stroke", function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) return "#333";
          else return find_variable(d[vars.id_var],vars.color_var);
        })
        .style('fill', function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) return find_variable(d[vars.id_var],vars.color_var);
          else {
            var c = d3.hsl(find_variable(d[vars.id_var],vars.color_var));
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
  // Data Ticks
  //-------------------------------------------------------------------
  
  var tick_group = vars.chart_enter.append("g")
    .attr("id","data_ticks")
  
  var ticks = d3.select("g#data_ticks")
    .selectAll("g.data_tick")
    .data(vars.data, function(d){ return d[vars.id_var]; })
  
  var ticks_enter = ticks.enter().append("g")
    .attr("class", "data_tick")
  
  // y ticks
  // ENTER
  ticks_enter.append("line")
    .attr("class", "ytick")
    .attr("x1", -10)
    .attr("x2", 0)
    .attr("y1", function(d){ return vars.y_scale(d[vars.yaxis_var]) })
    .attr("y2", function(d){ return vars.y_scale(d[vars.yaxis_var]) })
    .attr("stroke", function(d){ return find_variable(d[vars.id_var],vars.color_var); })
    .attr("stroke-width", 1)
    .attr("shape-rendering","crispEdges")
  
  // UPDATE      
  ticks.select(".ytick").transition().duration(vizwhiz.timing)
    .attr("x1", -10)
    .attr("x2", 0)
    .attr("y1", function(d){ return vars.y_scale(d[vars.yaxis_var]) })
    .attr("y2", function(d){ return vars.y_scale(d[vars.yaxis_var]) })
  
  // x ticks
  // ENTER
  ticks_enter.append("line")
    .attr("class", "xtick")
    .attr("y1", vars.graph.height)
    .attr("y2", vars.graph.height + 10)      
    .attr("x1", function(d){ return vars.x_scale(d[vars.xaxis_var]) })
    .attr("x2", function(d){ return vars.x_scale(d[vars.xaxis_var]) })
    .attr("stroke", function(d){ return find_variable(d[vars.id_var],vars.color_var); })
    .attr("stroke-width", 1)
    .attr("shape-rendering","crispEdges")
  
  // UPDATE
  ticks.select(".xtick").transition().duration(vizwhiz.timing)
    .attr("y1", vars.graph.height)
    .attr("y2", vars.graph.height + 10)      
    .attr("x1", function(d){ return vars.x_scale(d[vars.xaxis_var]) })
    .attr("x2", function(d){ return vars.x_scale(d[vars.xaxis_var]) })
  
  // EXIT (needed for when things are filtered/soloed)
  ticks.exit().remove()
  
  //===================================================================
  
  function arcTween(b) {
    var i = d3.interpolate({arc_angle: vars.arc_angles[b.id], arc_radius: vars.arc_sizes[b.id]}, b);
    return function(t) {
      return arc(i(t));
    };
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hover over nodes
  //-------------------------------------------------------------------
  
  function hover(){

      return function(d){
        
        var val = d[vars.value_var] ? d[vars.value_var] : vars.size_scale.domain()[0]
        var radius = vars.size_scale(val),
            x = vars.x_scale(d[vars.xaxis_var]),
            y = vars.y_scale(d[vars.yaxis_var]),
            color = d.active || d.num_children_active/d.num_children == 1 ? "#333" : find_variable(d[vars.id_var],vars.color_var),
            viz = d3.select("g.chart");
            
        // vertical line to x-axis
        viz.append("line")
          .attr("class", "axis_hover")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", y+radius+1) // offset so hover doens't flicker
          .attr("y2", vars.graph.height)
          .attr("stroke", color)
          .attr("stroke-width", 1)
          .attr("shape-rendering","crispEdges")
      
        // horizontal line to y-axis
        viz.append("line")
          .attr("class", "axis_hover")
          .attr("x1", 0)
          .attr("x2", x-radius) // offset so hover doens't flicker
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", color)
          .attr("stroke-width", 1)
          .attr("shape-rendering","crispEdges")
      
        // x-axis value box
        viz.append("rect")
          .attr("class", "axis_hover")
          .attr("x", x-25)
          .attr("y", vars.graph.height)
          .attr("width", 50)
          .attr("height", 20)
          .attr("fill", "white")
          .attr("stroke", color)
          .attr("stroke-width", 1)
          .attr("shape-rendering","crispEdges")
      
        var xtext = vars.number_format(d[vars.xaxis_var],vars.xaxis_var)
        
        // xvalue text element
        viz.append("text")
          .attr("class", "axis_hover")
          .attr("x", x)
          .attr("y", vars.graph.height)
          .attr("dy", 14)
          .attr("text-anchor","middle")
          .style("font-weight","bold")
          .attr("font-size","12px")
          .attr("font-family","Helvetica")
          .attr("fill","#4c4c4c")
          .text(xtext)
      
        // y-axis value box
        viz.append("rect")
          .attr("class", "axis_hover")
          .attr("x", -50)
          .attr("y", y-10)
          .attr("width", 50)
          .attr("height", 20)
          .attr("fill", "white")
          .attr("stroke", color)
          .attr("stroke-width", 1)
          .attr("shape-rendering","crispEdges")
        
        var ytext = vars.number_format(d[vars.yaxis_var],vars.yaxis_var)
        
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
          .text(ytext)
          
        var tooltip_data = get_tooltip_data(d,"short")
        if (d.num_children > 1 && !vars.spotlight) {
          var a = d.num_children_active+"/"+d.num_children
          tooltip_data.push({
            "name": vars.text_format(vars.active_var), 
            "value": a
          });
        }
      
        vizwhiz.tooltip.create({
          "id": d[vars.id_var],
          "color": find_variable(d[vars.id_var],vars.color_var),
          "icon": find_variable(d[vars.id_var],"icon"),
          "data": tooltip_data,
          "title": find_variable(d[vars.id_var],vars.text_var),
          "x": x+vars.graph.margin.left+vars.margin.left+vars.parent.node().offsetLeft,
          "y": y+vars.graph.margin.top+vars.margin.top+vars.parent.node().offsetTop,
          "offset": radius,
          "arrow": true,
          "footer": footer_text(),
          "mouseevents": false
        })
      }
  }
  
  //===================================================================
  
};
vizwhiz.bubbles = function(vars) {

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
    .key(function(d){ return find_variable(d[vars.id_var],vars.grouping) })
    .entries(vars.data)

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
          d[vars.text_var] = find_variable(d.children[0][vars.id_var],vars.text_var);
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
      var s = sort_order == vars.color_var ? "category" : sort_order
      var a_val = find_variable(a,s)
      var b_val = find_variable(b,s)
      if (typeof a_val == "number") {
        if(a[sort_order] < b[sort_order]) return 1;
        if(a[sort_order] > b[sort_order]) return -1;
      }
      else {
        if(a_val < b_val) return -1;
        if(a_val > b_val) return 1;
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
        var color = find_variable(d.children[0][vars.id_var],vars.color_var);
      }
      else {
        var color = "#cccccc";
      }
      
      color = d3.rgb(color).hsl()
      if (color.s > 0.9) color.s = 0.75
      while (color.l > 0.75) color = color.darker()
      color = color.rgb()
      
      groups[d.key] = {};
      groups[d.key][vars.color_var] = color;
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
  
  vars.data.forEach(function(d){
    var parent = data_packed.filter(function(p){ 
      if (find_variable(d[vars.id_var],vars.grouping) === false) var key = "false";
      else if (find_variable(d[vars.id_var],vars.grouping) === true) var key = "true";
      else var key = find_variable(d[vars.id_var],vars.grouping)
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
        .attr("fill",d[vars.color_var])
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
          .attr("fill", d[vars.color_var])
          .attr("stroke", d[vars.color_var])
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
    .data(vars.data,function(d){ return d[vars.id_var] })
    
  bubble.enter().append("g")
    .attr("class", "bubble")
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      d3.select(this).append("rect")
        .attr("fill","transparent")
        .attr("x",-d.r)
        .attr("y",-d.r)
        .attr("width",d.r*2)
        .attr("height",d.r*2)
      
      vars.arc_sizes[d[vars.id_var]+"_bg"] = 0
      vars.arc_inners[d[vars.id_var]+"_bg"] = 0
      
      var color = find_variable(d[vars.id_var],vars.color_var)
      
      var bg_color = d3.hsl(color)
      bg_color.l = 0.95
      bg_color = bg_color.toString()
      
      d3.select(this).append("path")
        .attr("class","bg")
        .attr("fill", bg_color )
        .attr("stroke", color)
        .attr("stroke-width",1)
      
      d3.select(this).select("path.bg").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween_bg)
    
      if (d.elsewhere) {
    
        vars.arc_angles[d[vars.id_var]+"_else"] = 0
        vars.arc_sizes[d[vars.id_var]+"_else"] = 0
        vars.arc_inners[d[vars.id_var]+"_else"] = 0
      
        d3.select(this).append("path")
          .attr("class","elsewhere")
          .style('fill', color)
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
        .style('fill', color)
      
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
      
      d3.select(this).style("cursor","pointer")
      
      var tooltip_data = get_tooltip_data(d,"short")
      
      vizwhiz.tooltip.create({
        "id": d[vars.id_var],
        "color": find_variable(d[vars.id_var],vars.color_var),
        "icon": find_variable(d[vars.id_var],"icon"),
        "data": tooltip_data,
        "title": find_variable(d[vars.id_var],vars.text_var),
        "x": d.x+vars.margin.left+vars.parent.node().offsetLeft,
        "y": d.y+vars.margin.top+vars.parent.node().offsetTop,
        "offset": d.r-5,
        "arrow": true,
        "mouseevents": false,
        "footer": footer_text()
      })
      
    })
    .on(vizwhiz.evt.out, function(d){
      vizwhiz.tooltip.remove(d[vars.id_var])
    })
    .on(vizwhiz.evt.click, function(d){
      
      var html = vars.click_function ? vars.click_function(d) : null
      if (html || vars.tooltip_info.long) {

        var id = find_variable(d,vars.id_var)
        vizwhiz.tooltip.remove(id)
        d3.selectAll(".axis_hover").remove()
        
        var tooltip_data = get_tooltip_data(d,"long")
        
        vizwhiz.tooltip.create({
          "title": find_variable(d,vars.text_var),
          "color": find_variable(d,vars.color_var),
          "icon": find_variable(d,"icon"),
          "id": id,
          "fullscreen": true,
          "html": html,
          "footer": vars.data_source,
          "data": tooltip_data,
          "mouseevents": this,
          "parent": vars.parent,
          "background": vars.background
        })
        
      }
      
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

vizwhiz.rings = function(vars) {
      
  var tooltip_width = 300
      
  var width = vars.small ? vars.width : vars.width-tooltip_width
      
  var tree_radius = vars.height > width ? width/2 : vars.height/2,
      node_size = d3.scale.linear().domain([1,2]).range([8,4]),
      ring_width = vars.small ? tree_radius/2.25 : tree_radius/3,
      total_children,
      hover = null;
      
  // container for the visualization
  var viz_enter = vars.parent_enter.append("g").attr("class", "viz")
    .attr("transform", "translate(" + width / 2 + "," + vars.height / 2 + ")");
    
  viz_enter.append("g").attr("class","links")
  viz_enter.append("g").attr("class","nodes")
    
  d3.select("g.viz").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(" + width / 2 + "," + vars.height / 2 + ")");
  
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
      
  var node_enter = node.enter().append("g")
      .attr("class", "node")
      .attr("opacity",0)
      .attr("transform", function(d) {
        if (d.depth == 0) return "none"
        else return "rotate(" + (d.ring_x - 90) + ")translate(" + 0 + ")"; 
      })
      
  node_enter.append("circle")
    .attr("id",function(d) { return "node_"+d[vars.id_var]; })
    .attr("r", 0)
    .call(circle_styles)
          
  if (!vars.small) {
    node_enter.append("text")
      .attr("font-weight","bold")
      .attr("font-size", "10px")
      .attr("font-family","Helvetica")
      .call(text_styles);
  }
      
  node
    .on(vizwhiz.evt.over,function(d){
      if (d.depth != 0) {
        d3.select(this).style("cursor","pointer")
        d3.select(this).style("cursor","-moz-zoom-in")
        d3.select(this).style("cursor","-webkit-zoom-in")
        hover = d;
        if (!vars.small) {
          link.call(line_styles);
          d3.selectAll(".node circle").call(circle_styles);
          d3.selectAll(".node text").call(text_styles);
        }
      }
    })
    .on(vizwhiz.evt.out,function(d){
      if (d.depth != 0) {
        hover = null;
        if (!vars.small) {
          link.call(line_styles);
          d3.selectAll(".node circle").call(circle_styles);
          d3.selectAll(".node text").call(text_styles);
        }
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
  
  node.select("circle").transition().duration(vizwhiz.timing)
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
    .call(circle_styles)
    
  node.select("text")
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
      
  node.exit().transition().duration(vizwhiz.timing)
      .attr("opacity",0)
      .remove()
  
  //===================================================================
  
  hover = null;
  
  if (!vars.small) {

    vizwhiz.tooltip.remove();
    
    var tooltip_appends = "<div class='vizwhiz_network_title'>Primary Connections</div>"

    vars.connections[vars.highlight].forEach(function(n){
      
      var parent = "d3.select(&quot;#"+vars.parent.node().id+"&quot;)"
      
      tooltip_appends += "<div class='vizwhiz_network_connection' onclick='"+parent+".call(chart.highlight(&quot;"+n[vars.id_var]+"&quot;))'>"
      tooltip_appends += "<div class='vizwhiz_network_connection_node'"
      tooltip_appends += " style='"
      tooltip_appends += "background-color:"+fill_color(n)+";"
      tooltip_appends += "border-color:"+stroke_color(n)+";"
      tooltip_appends += "'"
      tooltip_appends += "></div>"
      tooltip_appends += "<div class='vizwhiz_network_connection_name'>"
      tooltip_appends += find_variable(n[vars.id_var],vars.text_var)
      tooltip_appends += "</div>"
      tooltip_appends += "</div>"
    })
    
    var html = vars.click_function ? "<br>"+vars.click_function(vars.data[vars.highlight],tree_nodes) : ""
    
    var tooltip_data = get_tooltip_data(vars.highlight)

    vizwhiz.tooltip.remove()
    vizwhiz.tooltip.create({
      "title": find_variable(vars.highlight,vars.text_var),
      "color": find_variable(vars.highlight,vars.color_var),
      "icon": find_variable(vars.highlight,"icon"),
      "id": vars.highlight,
      "html": tooltip_appends+html,
      "footer": vars.data_source,
      "data": tooltip_data,
      "x": vars.width-tooltip_width-5,
      "y": vars.margin.top+5,
      "fixed": true,
      "width": tooltip_width,
      "mouseevents": true,
      "parent": vars.parent,
      "background": vars.background
    })
    
  }
  
  function fill_color(d) {
    if(find_variable(d[vars.id_var],vars.active_var)){
      return d[vars.color_var];
    } 
    else {
      var lighter_col = d3.hsl(d[vars.color_var]);
      lighter_col.l = 0.95;
      return lighter_col.toString()
    }
  }
  
  function stroke_color(d) {
    if(find_variable(d[vars.id_var],vars.active_var)){
      return "#333";
    } else {
      return vizwhiz.utils.darker_color(d[vars.color_var])
    }
  }
  
  function line_styles(l) {
    l
      .attr("stroke", function(d) {
        if (hover) {
          if (d.source == hover || d.target == hover || 
          (hover.depth == 2 && (hover.parents.indexOf(d.target) >= 0))) {
            this.parentNode.appendChild(this);
            return vars.highlight_color;
          } else if (hover.depth == 1 && hover.children_total.indexOf(d.target) >= 0) {
            return vars.secondary_color;
          } else return "#ddd";
        } else return "#ddd";
      })
      .attr("stroke-width", "1.5")
      .attr("opacity",function(d) {
        if (hover && d3.select(this).attr("stroke") == "#ddd") {
           return 0.25
        } return 0.75;
      })
  }
  
  function circle_styles(c) {
    c
      .attr("fill", function(d){
        var color = fill_color(d)
        
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "lightgrey"
      
      })
      .attr("stroke", function(d){
        var color = stroke_color(d)
        
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "darkgrey"
      
      })
      .attr("stroke-width", "1")
  }
  
  function text_styles(t) {
    t
      .attr("fill",function(d){
        if (d.depth == 0) {
          var color = vizwhiz.utils.text_color(d3.select("circle#node_"+d[vars.id_var]).attr("fill"));
        } 
        else {
          var color = vizwhiz.utils.darker_color(d[vars.color_var]);
        }

        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "lightgrey"
      })
  }
  
  function get_root(){
    
    var links = [], nodes = [], root = {}
      
    root.ring_x = 0;
    root.ring_y = 0;
    root.depth = 0;
    root[vars.text_var] = find_variable(vars.highlight,vars.text_var)
    root[vars.id_var] = vars.highlight
    root.children = []
    root[vars.color_var] = find_variable(vars.highlight,vars.color_var)
    root[vars.active_var] = find_variable(vars.highlight,vars.active_var)
  
    nodes.push(root);
    
    // populate first level
    var prim_links = vars.connections[vars.highlight]
    if (prim_links) {
      prim_links.forEach(function(child){
  
        // give first level child the properties
        child.ring_x = 0;
        child.ring_y = ring_width;
        child.depth = 1;
        child[vars.text_var] = find_variable(child[vars.id_var],vars.text_var)
        child.children = []
        child.children_total = []
        child[vars.color_var] = find_variable(child[vars.id_var],vars.color_var)
        child[vars.active_var] = find_variable(child[vars.id_var],vars.active_var)
  
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
            if (prim_links.indexOf(grandchild) < 0 && grandchild[vars.id_var] != vars.highlight) {
          
              grandchild.ring_x = 0;
              grandchild.ring_y = ring_width*2;
              grandchild.depth = 2;
              grandchild[vars.text_var] = find_variable(grandchild[vars.id_var],vars.text_var)
              grandchild[vars.color_var] = find_variable(grandchild[vars.id_var],vars.color_var)
              grandchild[vars.active_var] = find_variable(grandchild[vars.id_var],vars.active_var)
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
      var a_color = d3.rgb(a[vars.color_var]).hsl().h
      var b_color = d3.rgb(b[vars.color_var]).hsl().h
      if (d3.rgb(a[vars.color_var]).hsl().s == 0) a_color = 361
      if (d3.rgb(b[vars.color_var]).hsl().s == 0) b_color = 361
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
        var a_color = d3.rgb(a[vars.color_var]).hsl().h
        var b_color = d3.rgb(b[vars.color_var]).hsl().h
        if (d3.rgb(a[vars.color_var]).hsl().s == 0) a_color = 361
        if (d3.rgb(b[vars.color_var]).hsl().s == 0) b_color = 361
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
