//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//-------------------------------------------------------------------

d3plus.info.timeline = function(vars) {
  
  var years = vars.data.time
  
  if (years && years.length > 1 && vars.timeline.value) {
    
    if ((vars.time.key == vars.x.key && vars.x.scale.value == "continuous") || (vars.time.key == vars.y.key && vars.y.scale.value == "continuous")) {
      var min_required = 2
    }
    else {
      var min_required = 1
    }
    
    if (vars.time.solo.value.length) {
      var init = d3.extent(vars.time.solo.value)
    }
    else {
      var init = d3.extent(years)
    }
    
    var min = years[0],
        max = years[years.length-1],
        start = init[0],
        end = init[1],
        year_ticks = [],
        steps = []
        
    years.forEach(function(y,i){
      if (i != 0) steps.push(y-years[i-1])
    })
    var step = d3.min(steps),
        total = step*years.length
    years = []
    for (var i = min; i <= max; i += step) {
      years.push(i)
      year_ticks.push(d3.time.year(new Date(parseInt(i), 0, 1)))
    }
    year_ticks.push(d3.time.year(new Date(parseInt(max+step), 0, 1)))
    
    var brushend = function() {
      
      if (d3.event.sourceEvent !== null) {
        
        var extent0 = brush.extent(),
            min_val = d3plus.utils.closest(year_ticks,d3.time.year.round(extent0[0])),
            max_val = d3plus.utils.closest(year_ticks,d3.time.year.round(extent0[1]))
            
        if (min_val == max_val) {
          min_val = d3plus.utils.closest(year_ticks,d3.time.year.floor(extent0[0]))
        }
            
        var min_index = year_ticks.indexOf(min_val),
            max_index = year_ticks.indexOf(max_val)
            
        if (max_index-min_index >= min_required) {
          var extent = [min_val,max_val]
        }
        else if (min_index+min_required <= years.length) {
          var extent = [min_val,year_ticks[min_index+min_required]]
        }
        else {
          
          var extent = [min_val]
          for (var i = 1; i <= min_required; i++) {
            if (min_index+i <= years.length) {
              extent.push(year_ticks[min_index+i])
            }
            else {
              extent.unshift(year_ticks[min_index-((min_index+i)-(years.length))])
            }
          }
          extent = [extent[0],extent[extent.length-1]]
        }
        
        d3.select(this).transition()
          .call(brush.extent(extent))
          // .call(brush.event)
          .each("end",function(d){

            var new_years = d3.range(extent[0].getFullYear(),extent[1].getFullYear())
            
            new_years = new_years.filter(function(d){
              return years.indexOf(d) >= 0
            })
            
            vars.viz.time({"solo": new_years})
              
            if (!vars.autodraw) {
              vars.viz.draw()
            }
            
          })
      
      }
      else {
        return;
      }
        
    }
      
    var labels = vars.g.timeline.selectAll("g#labels")
      .data(["labels"])
      
    labels.enter().append("g")
      .attr("id","labels")
    
    var text = labels.selectAll("text")
      .data(years,function(d,i){
        return i
      })
      
    text.enter().append("text")
      .attr("y",0)
      .attr("dy",0)
      .attr("x",function(d){
        if (vars.style.timeline.align == "middle") {
          return vars.width.value/2
        }
        else if (vars.style.timeline.align == "end") {
          return vars.width.value
        }
        else {
          return 0
        }
      })
      .attr("y",function(d){
        var diff = diff = parseFloat(d3.select(this).style("font-size"),10)/5
        var y = vars.style.timeline.padding+vars.style.timeline.height/2+this.getBBox().height/2 - diff
        return y
      })
    
    var year_width = 0,
        year_height = 0,
        height = vars.style.timeline.height+vars.style.timeline.padding
    
    text
      .order()
      .style("font-weight",vars.style.timeline.tick.weight)
      .attr("font-family",vars.style.timeline.tick.family)
      .attr("font-size",vars.style.timeline.tick.size)
      .attr("text-anchor",vars.style.timeline.tick.align)
      .attr("fill",vars.style.timeline.tick.color)
      .text(function(d){
        return d
      })
      .each(function(d){
        var w = this.getBBox().width,
            h = this.getBBox().height
        if (w > year_width) year_width = w
        if (h > year_height) year_height = h
      })
      
    var label_width = year_width+vars.style.timeline.padding*2,
        timeline_width = label_width*years.length,
        available_width = vars.width.value-vars.style.timeline.padding*2,
        step = 1
        
    if (timeline_width > available_width) {
      timeline_width = available_width
      step = Math.ceil(label_width/(timeline_width/years.length))
      label_width = timeline_width/years.length
      for (step; step < years.length-1; step++) {
        if ((years.length-1)%step == 0) {
          break;
        }
      }
      height += year_height
    }
    
    if (vars.style.timeline.align == "start") {
      var start_x = vars.style.timeline.padding
    }
    else if (vars.style.timeline.align == "end") {
      var start_x = vars.width.value - vars.style.timeline.padding - timeline_width
    }
    else {
      var start_x = vars.width.value/2 - timeline_width/2
    }
  
    text.transition().duration(vars.style.timing.transitions)
      .attr("x",function(d,i){
        return start_x + (label_width*i) + label_width/2
      })
      .text(function(d,i){
        return i%step == 0 ? d : ""
      })
      .attr("y",function(d){
        var diff = diff = parseFloat(d3.select(this).style("font-size"),10)/5
        var y = vars.style.timeline.padding+vars.style.timeline.height/2+this.getBBox().height/2 - diff
        if (step > 1) {
          y += year_height+vars.style.timeline.padding
        }
        return y
      })
    
    text.exit().transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()
    
    var x = d3.time.scale()
      .domain(d3.extent(year_ticks))
      .range([0,timeline_width])
      
    var brush = d3.svg.brush()
      .x(x)
      .extent([year_ticks[years.indexOf(start)], year_ticks[years.indexOf(end)+1]])
      .on("brushend", brushend)
      
    var ticks = vars.g.timeline.selectAll("g#ticks")
      .data(["ticks"])
      
    ticks.enter().append("g")
      .attr("id","ticks")
      .attr("transform","translate("+start_x+","+vars.style.timeline.padding+")")
      
    ticks.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate("+start_x+","+vars.style.timeline.padding+")")
      .call(d3.svg.axis()
        .scale(x)
        .orient("top")
        .ticks(function(){
          return year_ticks
        })
        .tickFormat("")
        .tickSize(-vars.style.timeline.height)
        .tickPadding(0))
        .selectAll("path").attr("fill","none")
        
    ticks.selectAll("line").transition().duration(vars.style.timing.transitions)
      .attr("stroke",vars.style.timeline.tick.color)
      .attr("shape-rendering",vars.style.rendering)
    
    var brush_group = vars.g.timeline.selectAll("g#brush")
      .data(["brush"])
      
    brush_group.enter().append("g")
      .attr("id","brush")
      .attr("transform","translate("+start_x+","+vars.style.timeline.padding+")")
      .attr("opacity",0)
      
    brush_group
      .attr("transform","translate("+start_x+","+vars.style.timeline.padding+")")
      .attr("opacity",1)
      .call(brush)
      // .call(brush.event)
      
    brush_group.selectAll("rect")
      .transition().duration(vars.style.timing.transitions)
      .attr("height",vars.style.timeline.height)
      
    brush_group.selectAll("rect.background")
      .transition().duration(vars.style.timing.transitions)
      .attr("stroke",vars.style.timeline.tick.color)
      .attr("stroke-width",1)
      .style("visibility","visible")
      .attr("fill","none")
      .attr("shape-rendering",vars.style.rendering)
      
    brush_group.selectAll("rect.extent")
      .transition().duration(vars.style.timing.transitions)
      .attr("fill",vars.style.timeline.tick.color)
      .attr("fill-opacity",0.15)
      
    if (vars.margin.bottom == 0) {
      vars.margin.bottom += vars.style.timeline.padding
    }
    vars.margin.bottom += height
    
    vars.g.timeline.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")
    
  }
  else {
    
    vars.g.timeline.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+vars.height.value+")")
    
  }
 
}
