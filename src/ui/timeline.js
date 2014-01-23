//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//-------------------------------------------------------------------

d3plus.ui.timeline = function(vars) {
  
  var years = vars.data.time
 
  if (years && years.length > 1 && vars.timeline.value) {
    
    if ((vars.time.key == vars.x.key && vars.x.scale.value == "continuous") || (vars.time.key == vars.y.key && vars.y.scale.value == "continuous")) {
      var min_required = 2
    }
    else {
      var min_required = 1
    }
    
    var init = d3.extent(vars.time.solo)
    
    var min = years[0],
        max = years[years.length-1],
        start = init[0],
        end = init[1]

    var brushend = function() {
      if (!d3.event.sourceEvent) return;
      var extent0 = brush.extent(),
          extent1 = extent0.map(d3.time.year.round);
    
      var min_req_sec = 31536000000 * min_required;
      var time_diff = extent1[1] - extent1[0];
      
      if (time_diff < min_req_sec) {
      
        if(min_required > 1){
          extent1[0] = d3.time.year.round(d3.time.year.offset(extent0[0], -min_required/2));
          extent1[1] = d3.time.year.round(d3.time.year.offset(extent0[1], min_required/2));
        }
        else {
          extent1[0] = d3.time.year.floor(extent0[0]);
          extent1[1] = d3.time.year.ceil(extent0[1]);
        }
      
      }
      
      d3.select(this).transition()
          .call(brush.extent(extent1))
          .call(brush.event)
          .each("end",function(d){

            var new_years = d3.range(extent1[0].getFullYear(),extent1[1].getFullYear())
      
            vars.chart
              .time({"solo": new_years})
              .draw()
              
          })
        
    }
    
    var text = vars.g.timeline.selectAll("text")
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
        var y = vars.style.key.padding+vars.style.timeline.height/2+this.getBBox().height/2 - diff
        return y
      })
    
    var year_width = 0,
        year_height = 0,
        height = vars.style.timeline.height+vars.style.key.padding*2
    
    text
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
      
    var label_width = year_width+vars.style.key.padding*2,
        timeline_width = label_width*years.length,
        available_width = vars.width.value-vars.style.key.padding*2,
        step = 1
    
    if (timeline_width > available_width) {
      timeline_width = available_width
      label_width = timeline_width/years.length
      step = Math.ceil(year_width/label_width)
      for (step; step < years.length-1; step++) {
        if ((years.length-1)%step == 0) {
          break;
        }
      }
      height += vars.style.timeline.padding+year_height
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
        var y = vars.style.key.padding+vars.style.timeline.height/2+this.getBBox().height/2 - diff
        if (step > 1) {
          y += year_height+vars.style.key.padding
        }
        return y
      })
    
    text.exit().transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()
    
    var x = d3.time.scale()
      .domain([new Date(parseInt(min), 0, 1), new Date(parseInt(max+1), 0, 1)])
      .range([0,timeline_width])
      
    var brush = d3.svg.brush()
      .x(x)
      .extent([new Date(start, 0, 1), new Date(end+1, 0, 1)])
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
        .ticks(function(start, end){
          var interval = (start - end) > 20 ? 2 : 1;
          return d3.time.years(start, end, interval)
        })
        .tickFormat("")
        .tickSize(-vars.style.timeline.height)
        .tickPadding(0))
        .selectAll("path").attr("fill","none")
        
    ticks.selectAll("line").transition().duration(vars.style.timing.transitions)
      .attr("stroke",vars.style.timeline.tick.color)
      .attr("shape-rendering","crispEdges")
    
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
      .call(brush.event)
      
    brush_group.selectAll("rect")
      .transition().duration(vars.style.timing.transitions)
      .attr("height",vars.style.timeline.height)
      
    brush_group.selectAll("rect.background")
      .transition().duration(vars.style.timing.transitions)
      .attr("stroke",vars.style.timeline.tick.color)
      .attr("stroke-width",1)
      .style("visibility","visible")
      .attr("fill","none")
      .attr("shape-rendering","crispEdges")
      
    brush_group.selectAll("rect.extent")
      .transition().duration(vars.style.timing.transitions)
      .attr("fill",vars.style.timeline.tick.color)
      .attr("fill-opacity",0.15)
    
    vars.margin.bottom += height
    
    vars.g.timeline.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")
    
  }
  else {
    
    vars.g.timeline.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+vars.height.value+")")
    
  }
 
}
