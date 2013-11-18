//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats Raw Data
//-------------------------------------------------------------------

d3plus.utils.titles = function(vars) {
  
  // Calculate total_bar value
  if (!vars.app_data || !vars.total_bar || vars.type == "stacked") {
    vars.data.total = null
  }
  else {
    if (vars.dev) console.group("%c[d3plus]%c Calculating Total Value","font-weight:bold","font-weight: normal")
    
    if (vars.dev) console.time(vars.value)
    
    if (vars.app_data instanceof Array) {
      vars.data.total = d3.sum(vars.app_data,function(d){
        return d.value || d[vars.value]
      })
    }
    else if (vars.type == "rings") {
      if (vars.app_data[vars.highlight])
        vars.data.total = vars.app_data[vars.highlight][vars.value]
      else {
        vars.data.total = null
      }
    }
    else {
      vars.data.total = d3.sum(d3.values(vars.app_data),function(d){
        return d[vars.value]
      })
    }
    
    if (vars.dev) console.timeEnd(vars.value)
    if (vars.dev) console.groupEnd()
    
  }
  
  vars.margin.top = 0
  var title_offset = 0
  if (vars.svg_width <= 400 || vars.svg_height <= 300) {
    vars.small = true;
    vars.graph.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
    vars.graph.width = vars.width
    make_title(null,"title");
    make_title(null,"sub_title");
    make_title(null,"total_bar");
    update_footer(null)
  }
  else {
    if (vars.dev) console.log("%c[d3plus]%c Creating/Updating Titles","font-weight:bold","font-weight: normal")
    vars.small = false;
    vars.graph.margin = {"top": 5, "right": 10, "bottom": 40, "left": 40}
    vars.graph.width = vars.width-vars.graph.margin.left-vars.graph.margin.right
    make_title(vars.title,"title");
    make_title(vars.sub_title,"sub_title");
    if (vars.app_data && !vars.error && (vars.type != "rings" || (vars.type == "rings" && vars.connections[vars.highlight]))) {
      make_title(vars.data.total,"total_bar");
    }
    else {
      make_title(null,"total_bar");
    }
    if (vars.margin.top > 0) {
      vars.margin.top += 3
      if (vars.margin.top < vars.title_height) {
        title_offset = (vars.title_height-vars.margin.top)/2
        vars.margin.top = vars.title_height
      }
    }
    update_footer(vars.footer)
  }
  
  d3.select("g.titles").transition().duration(d3plus.timing)
    .attr("transform","translate(0,"+title_offset+")")
    
  function make_title(t,type){

    // Set the total value as data for element.
    var font_size = type == "title" ? 18 : 13,
        title_position = {
          "x": vars.svg_width/2,
          "y": vars.margin.top
        }
  
    if (type == "total_bar" && t) {
      title = vars.format(t,vars.value)
      vars.total_bar.prefix ? title = vars.total_bar.prefix + title : null;
      vars.total_bar.suffix ? title = title + vars.total_bar.suffix : null;
    
      if (vars.filter.length || vars.solo.length && vars.type != "rings") {
        var overall_total = d3.sum(vars.data.raw, function(d){ 
          if (vars.type == "stacked") return d[vars.value]
          else if (vars.year == d[vars.year_var]) return d[vars.value]
        })
        var pct = (t/overall_total)*100
        ot = vars.format(overall_total,vars.value)
        title += " ("+vars.format(pct,"share")+"% of "+ot+")"
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
        .attr("font-family", vars.font)
        .style("font-weight", vars.font_weight)
        .each(function(d){
          var width = vars.title_width ? vars.title_width : vars.svg_width
          width -= offset*2
          d3plus.utils.wordwrap({
            "text": d.title,
            "parent": this,
            "width": width,
            "height": vars.svg_height/8,
            "resize": false
          })
        })
  
    // Update
    total.transition().duration(d3plus.timing)
      .style("opacity",1)
    
    d3plus.utils.title_update(vars)
  
    // Exit
    total.exit().transition().duration(d3plus.timing)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }

  function update_footer(footer_text) {
  
    if (footer_text) {
      if (footer_text.indexOf("<a href=") == 0) {
        var div = document.createElement("div")
        div.innerHTML = footer_text
        var t = footer_text.split("href=")[1]
        var link = t.split(t.charAt(0))[1]
        if (link.charAt(0) != "h" && link.charAt(0) != "/") {
          link = "http://"+link
        }
        var d = [div.getElementsByTagName("a")[0].innerHTML]
      }
      else {
        var d = [footer_text]
      }
    }
    else var d = []
  
    var source = d3.select("g.footer").selectAll("text.source").data(d)
    var padding = 3
  
    source.enter().append("text")
      .attr("class","source")
      .attr("opacity",0)
      .attr("x",vars.svg_width/2+"px")
      .attr("y",padding-1+"px")
      .attr("font-size","10px")
      .attr("fill","#333")
      .attr("text-anchor", "middle")
      .attr("font-family", vars.font)
      .style("font-weight", vars.font_weight)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.svg_width-20,
          "height": vars.svg_height/8,
          "resize": false
        })
      })
      .on(d3plus.evt.over,function(){
        if (link) {
          d3.select(this)
            .style("text-decoration","underline")
            .style("cursor","pointer")
            .style("fill","#000")
        }
      })
      .on(d3plus.evt.out,function(){
        if (link) {
          d3.select(this)
            .style("text-decoration","none")
            .style("cursor","auto")
            .style("fill","#333")
        }
      })
      .on(d3plus.evt.click,function(){
        if (link) {
          if (link.charAt(0) != "/") var target = "_blank"
          else var target = "_self"
          window.open(link,target)
        }
      })
    
    source
      .attr("opacity",1)
      .attr("x",(vars.svg_width/2)+"px")
      .attr("font-family", vars.font)
      .style("font-weight", vars.font_weight)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.svg_width-20,
          "height": vars.svg_height/8,
          "resize": false
        })
      })
    
    source.exit().transition().duration(d3plus.timing)
      .attr("opacity",0)
      .remove()
    
    if (d.length) {
      var height = source.node().getBBox().height
      vars.margin.bottom = height+padding*2
    }
    else {
      vars.margin.bottom = 0
    }
  
    d3.select("g.footer").transition().duration(d3plus.timing)
      .attr("transform","translate(0,"+(vars.svg_height-vars.margin.bottom)+")")
  
  }
}

d3plus.utils.title_update = function(vars) {
  
  var offset = 0
  if (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && !vars.title_center) {
    offset = vars.graph.margin.left
  }

  d3.select("g.titles").selectAll("g").select("text")
    .transition().duration(d3plus.timing)
      .attr("x",function(d) { return d.x+offset; })
      .attr("y",function(d) { return d.y; })
      .each(function(d){
        var width = vars.title_width ? vars.title_width : vars.svg_width
        width -= offset*2
        d3plus.utils.wordwrap({
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
