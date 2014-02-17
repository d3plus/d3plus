//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// function that will wrap and resize SVG text
//-------------------------------------------------------------------

d3plus.utils.wordwrap = function(params) {
  
  var parent = params.parent,
      width = params.width ? params.width : 20000,
      height = params.height ? params.height : 20000,
      resize = params.resize,
      font_max = params.font_max ? params.font_max : 40,
      font_min = params.font_min ? params.font_min : 9,
      text_array = params.text.slice(0),
      split = ["-","/",";",":","%","&"],
      regex = new RegExp("[^\\s\\"+split.join("\\")+"]+\\"+split.join("?\\")+"?","g")
      
  if (text_array instanceof Array) wrap(String(text_array.shift()).match(regex))
  else wrap(String(text_array).match(regex))
  
  function wrap(words) {
    
    if (resize) {
      
      // Start by trying the largest font size
      var size = font_max
      size = Math.floor(size)
      d3.select(parent).attr("font-size",size)
    
      // Add each word to it's own line (to test for longest word)
      d3.select(parent).selectAll("tspan").remove()
      for(var i=0; i<words.length; i++) {
        if (words.length == 1) var t = words[i]
        else var t = words[i]+"..."
        d3.select(parent).append("tspan").attr("x",0).text(t)
      }
    
      // If the longest word is too wide, make the text proportionately smaller
      if (parent.getBBox().width > width) size = size*(width/parent.getBBox().width)
      
      // If the new size is too small, return NOTHING
      if (size < font_min) {
        d3.select(parent).selectAll("tspan").remove();
        if (typeof text_array == "string" || text_array.length == 0) return;
        else wrap(String(text_array.shift()).match(regex))
        return;
      }

      // Use new text size
      size = Math.floor(size)
      d3.select(parent).attr("font-size",size);
    
      // Flow text into box
      flow();
      
      // If text doesn't fit height-wise, shrink it!
      if (parent.childNodes.length*parent.getBBox().height > height) {
        var temp_size = size*(height/(parent.childNodes.length*parent.getBBox().height))
        if (temp_size < font_min) size = font_min
        else size = temp_size
        size = Math.floor(size)
        d3.select(parent).attr("font-size",size)
      } else finish();
    
    }
  
    flow();
    truncate();
    finish();
  
    function flow() {
    
      d3.select(parent).selectAll("tspan").remove()
      
      var x_pos = parent.getAttribute("x")
      
      var tspan = d3.select(parent).append("tspan")
        .attr("x",x_pos)
        .text(words[0])

      for (var i=1; i < words.length; i++) {
        
        var current = tspan.text(),
            last_char = current.slice(-1),
            joiner = split.indexOf(last_char) >= 0 ? "" : " "
        
        tspan.text(current+joiner+words[i])
      
        if (tspan.node().getComputedTextLength() > width) {
            
          tspan.text(current)
    
          tspan = d3.select(parent).append("tspan")
            .attr("x",x_pos)
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
        words = d3.select(tspan).text().match(/[^\s-]+-?/g)
      
        var last_char = words[words.length-1].charAt(words[words.length-1].length-1)
        if (last_char == "," || last_char == ";" || last_char == ":") words[words.length-1] = words[words.length-1].substr(0,words[words.length-1].length-1)
      
        d3.select(tspan).text(words.join(" ")+"...")
      
        if (tspan.getComputedTextLength() > width) {
          if (words.length > 1) words.pop(words.length-1)
          last_char = words[words.length-1].charAt(words[words.length-1].length-1)
          if (last_char == "," || last_char == ";" || last_char == ":") words[words.length-1].substr(0,words[words.length-1].length-2)
          d3.select(tspan).text(words.join(" ")+"...")
        }
      }
    }
  }
  
  function finish() {
    d3.select(parent).selectAll("tspan").attr("dy", d3.select(parent).style("font-size"));
    return;
  }
  
}
