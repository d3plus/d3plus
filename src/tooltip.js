//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.create = function(params) {
  
  params.width = params.width ? params.width : 200
  params.id = params.id ? params.id : "default"
  params.html = params.html ? params.html : null
  params.size = params.fullscreen ? "large" : "small"
  params.offset = params.offset ? params.offset : 0
  params.arrow_offset = params.arrow ? 10 : 0
  params.mouseevents = params.mouseevents === undefined ? true : params.mouseevents
  params.x = params.x ? params.x : 0
  params.y = params.y ? params.y : 0
  
  params.anchor = {}
  if (params.fullscreen) {
    params.anchor.x = "center"
    params.anchor.y = "center"
    params.x = window.innerWidth/2
    params.y = window.innerHeight/2
  }
  else if (params.align) {
    var a = params.align.split(" ")
    params.anchor.y = a[0]
    if (a[1]) params.anchor.x = a[1]
    else params.anchor.x = "center"
  }
  else {
    params.anchor.x = "center"
    params.anchor.y = "bottom"
  }
  
  var title_width = params.fullscreen && params.html ? window.innerWidth*0.75 - 18 : params.width - 18
  
  if (params.fullscreen) {
    var curtain = d3.select("body").append("div")
      .attr("class","vizwhiz_tooltip_curtain")
      .on(vizwhiz.evt.click,function(){
        vizwhiz.tooltip.remove(params.id)
      })
  }
  
  var tooltip = d3.select("body").append("div")
    .datum(params)
    .attr("id","vizwhiz_tooltip_id_"+params.id)
    .attr("class","vizwhiz_tooltip vizwhiz_tooltip_"+params.size)
    
  if (params.title || params.description || params.icon) {
    var header = tooltip.append("div")
      .attr("class","vizwhiz_tooltip_header")
      .style("color",vizwhiz.utils.text_color(params.color))
      
    if (params.color) {
      header
        .style("background-color",params.color)
    }
    if (!params.data && !params.footer) {
      header
        .style("-webkit-border-radius","2px")
        .style("-moz-border-radius","2px")
        .style("border-radius","2px")
    }
    if (params.id != "default" && params.size == "small") {
      var title_id = header.append("div")
        .attr("class","vizwhiz_tooltip_id")
        .text(params.id)
      title_width -= title_id.node().offsetWidth+6
    }
    else if (params.fullscreen) {
      var close = header.append("div")
        .attr("class","vizwhiz_tooltip_close")
        .text("x")
        .on(vizwhiz.evt.click,function(){
          vizwhiz.tooltip.remove(params.id)
        })
    }
  }
  
  if (params.fullscreen && params.html) {
    
    tooltip
      .style("height",(window.innerHeight*0.75)+"px")
      .style("width",(window.innerWidth*0.75)+"px")
      
    var body = tooltip.append("div")
      .attr("class","vizwhiz_tooltip_body")
      .style("width",params.width+"px")
      
  }
  else {

    if (params.width == "auto") var w = "auto"
    else var w = params.width+"px"

    var body = tooltip
      .style("width",w)
      
  }
  
  if (!params.mouseevents) {
    tooltip
      .style("pointer-events","none")
  }
    
  if (params.arrow) {
    var arrow = body.append("div")
      .attr("class","vizwhiz_tooltip_arrow")
  }
  
  if (params.icon) {
    var title_icon = header.append("div")
      .attr("class","vizwhiz_tooltip_icon")
      .style("background-image","url("+params.icon+")")
    title_width -= title_icon.node().offsetWidth
  }
  
  if (params.title) {
    var title = header.append("div")
      .attr("class","vizwhiz_tooltip_title")
      .style("width",title_width+"px")
      .text(params.title)
  }
  
  if (params.description) {
    var description = header.append("div")
      .attr("class","vizwhiz_tooltip_description")
      .style("width",title_width+"px")
      .text(params.description)
    if (params.icon) {
      description
        .style("margin-left",(title_icon.node().offsetWidth+3)+"px")
    }
  }
  
  if (params.data) {
    var data_container = body.append("div")
      .attr("class","vizwhiz_tooltip_data_container")
      
    params.data.forEach(function(d){
      var block = data_container.append("div")
        .attr("class","vizwhiz_tooltip_data_block")
        .text(d.name)
      if (d.highlight) {
        block
          .attr("class","vizwhiz_tooltip_data_block vizwhiz_tooltip_data_block_highlight")
      }
      var format = d.format ? d.format : ",f"
      if (typeof format == "string" && typeof d.value == "number") {
        var value = d3.format(format)(d.value)
      }
      else if (typeof format == "function" && typeof d.value == "number") {
        var value = format(d)
      }
      else {
        var value = d.value
      }
      block.append("div")
          .attr("class","vizwhiz_tooltip_data_value")
          .text(value)
    })
    d3.select(".vizwhiz_tooltip_data_block").style("margin-top","0px")
    
    if (params.html && !params.fullscreen) {
      data_container.html(data_container.html()+params.html)
    }
    
  }
  
  if (params.footer) {
    var footer = body.append("div")
      .attr("class","vizwhiz_tooltip_footer")
      .html(params.footer)
  }
  
  params.height = tooltip.node().offsetHeight
  
  if (params.html) {
    if (params.fullscreen) {
      var h = params.height-header.node().offsetHeight-14
      tooltip.append("div")
        .attr("class","vizwhiz_tooltip_html")
        .style("width",(tooltip.node().offsetWidth-params.width-14)+"px")
        .style("height",h+"px")
        .html(params.html)
    }
  }
  
  params.width = tooltip.node().offsetWidth
  
  if (params.anchor.y != "center") params.height += params.arrow_offset
  else params.width += params.arrow_offset
      
  if (params.data) {
    var h = params.height-8
    if (header) h -= header.node().offsetHeight
    if (footer) h -= footer.node().offsetHeight
    data_container
      .style("max-height",h+"px")
  }
  
  vizwhiz.tooltip.move(params.x,params.y,params.id);
    
}

vizwhiz.tooltip.arrow = function(arrow) {
  arrow
    .style("background-color", function(d){
      if (((d.flip || (!d.data && !d.footer)) && d.anchor.y != "center")
      || (d.anchor.y == "center" && !d.data && !d.footer) && d.color) {
        return d.color
      }
      else {
        return "#ddd"
      }
    })
    .style("bottom", function(d){
      if (d.anchor.y != "center" && !d.flip) return "-9px"
      else return "auto"
    })
    .style("top", function(d){
      if (d.anchor.y != "center" && d.flip) return "-9px"
      else if (d.anchor.y == "center") return "50%"
      else return "auto"
    })
    .style("left", function(d){
      if (d.anchor.y == "center" && d.flip) return "-9px"
      else if (d.anchor.y != "center") return "50%"
      else return "auto"
    })
    .style("right", function(d){
      if (d.anchor.y == "center" && !d.flip) return "-9px"
      else return "auto"
    })
    .style("border-color", function(d){
      if (d.anchor.y == "center") {
        if (d.flip) return "border-color","transparent transparent #888 #888"
        else return "#888 #888 transparent transparent"
      }
      else {
        if (d.flip) return "border-color","#888 transparent transparent #888"
        else return "transparent #888 #888 transparent"
      }
    })
    .style("margin-left", function(d){
      if (d.anchor.y == "center") {
        return "auto"
      }
      else {
        if (d.anchor.x == "left") {
          var arrow_x = -d.width/2+d.arrow_offset/2 - 1
        }
        else if (d.anchor.x == "right") {
          var arrow_x = d.width/2-d.arrow_offset*2 - 2
        }
        else {
          var arrow_x = -9
        }
        if (d.cx-d.width/2-d.arrow_offset < arrow_x) {
          arrow_x = d.cx-d.width/2-d.arrow_offset
          if (arrow_x < 4-d.width/2) arrow_x = 4-d.width/2
        }
        else if (-(window.innerWidth-d.cx-d.width/2+d.arrow_offset) > arrow_x) {
          var arrow_x = -(window.innerWidth-d.cx-d.width/2+d.arrow_offset)
          if (arrow_x > d.width/2-22) arrow_x = d.width/2-22
        }
        return arrow_x+"px"
      }
    })
    .style("margin-top", function(d){
      if (d.anchor.y != "center") {
        return "auto"
      }
      else {
        if (d.anchor.y == "top") {
          var arrow_y = -d.height/2+d.arrow_offset/2 - 1
        }
        else if (d.anchor.y == "bottom") {
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

        if (d.anchor.x == "left") {
          d.x = d.cx - d.arrow_offset - 4
        }
        else if (d.anchor.x == "center") {
          d.x = d.cx - d.width/2
        }
        else if (d.anchor.x == "right") {
          d.x = d.cx - d.width + d.arrow_offset + 2
        }

        // Determine whether or not to flip the tooltip
        if (d.anchor.y == "top") {
          d.flip = d.cy + d.height + d.offset <= window.innerHeight
        }
        else if (d.anchor.y == "bottom") {
          d.flip = d.cy - d.height - d.offset < 0
        }

        if (d.anchor.y == "center") {
          d.flip = false
          d.y = d.cy - d.height/2
        }
        else if (d.flip) {
          d.y = d.cy + d.offset + d.arrow_offset
        }
        else {
          d.y = d.cy - d.height - d.offset
        }
    
      }
      else {

        if (d.anchor.y == "top") {
          d.y = d.cy - d.arrow_offset - 4
        }
        else if (d.anchor.y == "center") {
          d.y = d.cy - d.height/2
        }
        else if (d.anchor.y == "right") {
          d.y = d.cy - d.height + d.arrow_offset + 2
        }

        // Determine whether or not to flip the tooltip
        if (d.anchor.x == "left") {
          d.flip = d.cx + d.width + d.offset <= window.innerWidth
        }
        else if (d.anchor.x == "right") {
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
    else {
      var th = window.innerHeight-5-d.y
      tooltip
        .style("max-height",th+"px")
      if (d.data || d.html) {
        if (tooltip.select(".vizwhiz_tooltip_header").node()) {
          th -= tooltip.select(".vizwhiz_tooltip_header").node().offsetHeight
        }
        tooltip.select(".vizwhiz_tooltip_data_container")
          .style("max-height",(th-6)+"px")
      }
    }
    
    tooltip
      .style("top",d.y+"px")
      .style("left",d.x+"px")
  
    if (d.arrow) {
      tooltip.select(".vizwhiz_tooltip_arrow")
        .call(vizwhiz.tooltip.arrow)
    }
    
  }
    
}

//===================================================================
