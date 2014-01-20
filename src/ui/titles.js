//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats Raw Data
//-------------------------------------------------------------------

d3plus.ui.titles = function(vars) {
  
  // Calculate total_bar value
  if (!vars.app_data || !vars.title.total.default || vars.type.default == "stacked") {
    vars.data.total = null
  }
  else {
    if (vars.dev.default) d3plus.console.group("Calculating Total Value")
    
    if (vars.dev.default) d3plus.console.time(vars.size.key)
    
    if (vars.app_data instanceof Array) {
      vars.data.total = d3.sum(vars.app_data,function(d){
        return d3plus.variable.value(vars,d,vars.size.key)
      })
    }
    else if (vars.type.default == "rings") {
      if (vars.app_data[vars.focus.default])
        vars.data.total = vars.app_data[vars.focus.default][vars.size.key]
      else {
        vars.data.total = null
      }
    }
    else {
      vars.data.total = d3.sum(d3.values(vars.app_data),function(d){
        return d[vars.size.key]
      })
    }
    
    if (vars.dev.default) d3plus.console.timeEnd(vars.size.key)
    if (vars.dev.default) d3plus.console.groupEnd()
    
  }
  
  vars.margin.top = 0
  var title_offset = 0
  if (vars.width.default <= 400 || vars.height.default <= 300) {
    vars.small = true;
    vars.graph.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
    vars.graph.width = vars.app_width
    make_title(null,"title");
    make_title(null,"sub_title");
    make_title(null,"total_bar");
    update_footer(null)
  }
  else {
    if (vars.dev.default) d3plus.console.log("Updating Titles")
    vars.small = false;
    vars.graph.margin = {"top": 10, "right": 10, "bottom": 40, "left": 40}
    vars.graph.width = vars.app_width-vars.graph.margin.left-vars.graph.margin.right
    make_title(vars.title.default,"title");
    make_title(vars.title.sub.default,"sub_title");
    if (vars.app_data && !vars.error.default && (vars.type.default != "rings" || (vars.type.default == "rings" && vars.connections[vars.focus.default]))) {
      make_title(vars.data.total,"total_bar");
    }
    else {
      make_title(null,"total_bar");
    }
    if (vars.margin.top > 0) {
      vars.margin.top += 3
      if (vars.style.title.height && vars.margin.top < vars.style.title.height) {
        title_offset = (vars.style.title.height-vars.margin.top)/2
        vars.margin.top = vars.style.title.height
      }
    }
    update_footer(vars.footer)
  }
  
  vars.g.titles.transition().duration(vars.style.timing.transitions)
    .attr("transform","translate(0,"+title_offset+")")
    
  function make_title(t,type){

    // Set the total value as data for element.
    var font_size = type == "title" ? 18 : 13,
        title_position = {
          "x": vars.width.default/2,
          "y": vars.margin.top
        }
  
    if (type == "total_bar" && t) {
      title = vars.format(t,vars.size.key)
      vars.title.total.default.prefix ? title = vars.title.total.default.prefix + title : null;
      vars.title.total.default.suffix ? title = title + vars.title.total.default.suffix : null;
    
      if (vars.mute.length || vars.solo.length && vars.type.default != "rings") {
        var overall_total = d3.sum(vars.data.default, function(d){ 
          if (vars.type.default == "stacked") return d[vars.size.key]
          else if (vars.time.solo == d[vars.time.key]) return d[vars.size.key]
        })
        var pct = (t/overall_total)*100
        ot = vars.format(overall_total,vars.size.key)
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
  
    var total = vars.g.titles.selectAll("g."+type).data(title_data)
  
    // Enter
    total.enter().append("g")
      .attr("class",type)
      .style("opacity",0)
      .append("text")
        .attr("x",function(d) { return d.x; })
        .attr("y",function(d) { return d.y; })
        .attr("font-size",font_size)
        .attr("fill","#333")
        .attr("text-anchor", vars.style.title.align)
        .attr("font-family", vars.style.font.family)
        .style("font-weight", vars.style.font.weight)
        .each(function(d){
          var width = vars.style.title.width || vars.width.default
          d3plus.utils.wordwrap({
            "text": d.title,
            "parent": this,
            "width": width,
            "height": vars.height.default/8,
            "resize": false
          })
        })
  
    // Update
    total.transition().duration(vars.style.timing.transitions)
      .style("opacity",1)
    
    d3plus.ui.title_update(vars)
  
    // Exit
    total.exit().transition().duration(vars.style.timing.transitions)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }

  function update_footer(footer_text) {
    
    if (footer_text && footer_text.default) {
      if (footer_text.default.indexOf("<a href=") == 0) {
        var div = document.createElement("div")
        div.innerHTML = footer_text.default
        var t = footer_text.default.split("href=")[1]
        var link = t.split(t.charAt(0))[1]
        if (link.charAt(0) != "h" && link.charAt(0) != "/") {
          link = "http://"+link
        }
        var d = [div.getElementsByTagName("a")[0].innerHTML]
      }
      else {
        var d = [footer_text.default]
      }
    }
    else var d = []
  
    var source = vars.g.footer.selectAll("text.source").data(d)
    var padding = 3
  
    source.enter().append("text")
      .attr("class","source")
      .attr("opacity",0)
      .attr("x",vars.width.default/2+"px")
      .attr("y",padding-1+"px")
      .attr("font-size","10px")
      .attr("fill","#333")
      .attr("text-anchor", "middle")
      .attr("font-family", vars.style.font.family)
      .style("font-weight", vars.style.font.weight)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.width.default-20,
          "height": vars.height.default/8,
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
      .attr("x",(vars.width.default/2)+"px")
      .attr("font-family", vars.style.font.family)
      .style("font-weight", vars.style.font.weight)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.width.default-20,
          "height": vars.height.default/8,
          "resize": false
        })
      })
    
    source.exit().transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()
    
    if (d.length) {
      var height = source.node().getBBox().height
      vars.margin.bottom = height+padding*2
    }
    else {
      vars.margin.bottom = 0
    }
  
    vars.g.footer.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+(vars.height.default-vars.margin.bottom)+")")
  
  }
}

d3plus.ui.title_update = function(vars) {
  
  vars.g.titles.selectAll("g").select("text")
    .transition().duration(vars.style.timing.transitions)
      .attr("x",function(d) { return d.x; })
      .attr("y",function(d) { return d.y; })
      .each(function(d){
        var width = vars.style.title.width || vars.width.default
        d3plus.utils.wordwrap({
          "text": d.title,
          "parent": this,
          "width": width,
          "height": vars.height.default/8,
          "resize": false
        })
      })
      .selectAll("tspan")
        .attr("x",function(d) { return d.x; })
    
}
