//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Number formatter
//-------------------------------------------------------------------

vizwhiz.utils.format_num = function(val, percent, sig_figs, abbrv) {
  
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
// Random color generator (if no color is given)
//-------------------------------------------------------------------

vizwhiz.utils.merge = function(obj1,obj2) {
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