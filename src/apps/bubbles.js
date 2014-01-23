d3plus.apps.bubbles = {}
d3plus.apps.bubbles.data = "nested";
d3plus.apps.bubbles.fill = true;
d3plus.apps.bubbles.tooltip = "static"
d3plus.apps.bubbles.shapes = ["circle","donut"];
d3plus.apps.bubbles.scale = 1.05

d3plus.apps.bubbles.draw = function(vars) {
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Test for labels
  //-------------------------------------------------------------------
  var label_height = vars.labels.value && !vars.small ? 50 : 0
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sort Data
  //-------------------------------------------------------------------
  var order = vars.order.key || vars.size.key
  vars.data.app.sort(function(a,b){
    var a_value = d3plus.variable.value(vars,a,order)
    var b_value = d3plus.variable.value(vars,b,order)
    return vars.order.sort.value == "asc" ? a_value-b_value : b_value-a_value
  })
    
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate rows and columns
  //-------------------------------------------------------------------
  if(vars.data.app.length == 1) {
    var columns = 1,
        rows = 1;
  }
  else if (vars.data.app.length < 4) {
    var columns = vars.data.app.length,
        rows = 1;
  } 
  else {
    var rows = Math.ceil(Math.sqrt(vars.data.app.length/(vars.app_width/vars.app_height))),
        columns = Math.ceil(Math.sqrt(vars.data.app.length*(vars.app_width/vars.app_height)));
  }

  if (vars.data.app.length > 0) {
    while ((rows-1)*columns >= vars.data.app.length) rows--
  }
  
  var column_width = vars.app_width/columns,
      column_height = vars.app_height/rows
      
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define size scale
  //-------------------------------------------------------------------
  if (!vars.data.app) vars.data.app = []
  
  var domain_min = d3.min(vars.data.app, function(d){ 
    if (!vars.size.key) return 0
    return d3plus.variable.value(vars,d,vars.size.key,null,"min")
  })
  
  var domain_max = d3.max(vars.data.app, function(d){ 
    if (!vars.size.key) return 0
    return d3plus.variable.value(vars,d,vars.size.key)
  })
  
  var padding = 5
  
  var size_min = 20
  var size_max = (d3.min([column_width,column_height])/2)-(padding*2)
  size_max -= label_height
  
  var size = d3.scale[vars.size.scale.value]()
    .domain([domain_min,domain_max])
    .range([size_min,size_max])
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate bubble packing
  //-------------------------------------------------------------------
  var pack = d3.layout.pack()
    .size([column_width-padding*2,column_height-padding*2-label_height])
    .value(function(d) { 
      if (!vars.size.key) return 0
      return d3plus.variable.value(vars,d,vars.size.key)
    })
    .padding(padding)
    .radius(function(d){ 
      return size(d) 
    })
    
  var data = []
  
  var row = 0
  vars.data.app.forEach(function(d,i){
    
    var temp = pack.nodes(d)
    
    var xoffset = (column_width*i) % vars.app_width,
        yoffset = column_height*row
        
    temp.forEach(function(t){
      if (!t.d3plus) t.d3plus = {}
      if (!t.d3plus.depth) t.d3plus.depth = t.depth
      t.xoffset = xoffset
      t.yoffset = yoffset+label_height
      if (t.depth < vars.depth.value) {
        t.d3plus.static = true
      }
      else {
        t.d3plus.static = false
      }
      if (temp.length == 1) {
        t.d3plus.label = false
      }
      else {
        t.d3plus.label = true
      }
    })
    
    data = data.concat(temp)
    
    if ((i+1) % columns == 0) {
      row++
    }
  
  })
  
  var downscale = size_max/d3.max(data,function(d){ return d.r })
  
  data.forEach(function(d){
    d.x = ((d.x-column_width/2)*downscale)+column_width/2
    d.d3plus.x = d.x+d.xoffset
    d.y = ((d.y-column_height/2)*downscale)+column_height/2
    d.d3plus.y = d.y+d.yoffset
    d.r = d.r*downscale
    d.d3plus.r = d.r
  })
  
  data.sort(function(a,b){
    return a.depth-b.depth
  })
  
  var label_data = data.filter(function(d){
    return d.depth == 0
  })
  
  var labels = vars.group.selectAll("text.bubble_label")
    .data(label_data,function(d){
      if (!d.d3plus.label_height) d.d3plus.label_height = 0
      return d[vars.id.nesting[d.depth]]
    })
    
  function label_style(l) {
    l
      .attr("x",function(d){
        return d.d3plus.x
      })
      .attr("y",function(d){
        return d.d3plus.y-d.r-d.d3plus.label_height-padding
      })
      .attr("text-anchor","middle")
      .style("font-weight",vars.style.font.weight)
      .attr("font-family",vars.style.font.family)
      .attr("font-size","12px")
      .style("fill",function(d){
        var color = d3plus.variable.color(vars,d)
        return d3plus.color.legible(color)
      })
      .each(function(d){
        if (d.r > 10 && label_height > 10) {
          var names = d3plus.variable.text(vars,d,d.depth)
          d3plus.utils.wordwrap({
            "text": names,
            "parent": this,
            "width": column_width-padding*2,
            "height": label_height
          })
        }
      })
      .attr("y",function(d){
        d.d3plus.label_height = d3.select(this).node().getBBox().height
        return d.d3plus.y-d.r-d.d3plus.label_height-padding
      })
      .selectAll("tspan")
        .attr("x",function(d){
          return d.d3plus.x
        })
  }
  
  labels.enter().append("text")
    .attr("class","bubble_label")
    .call(label_style)
    .attr("opacity",0)
    
  labels.transition().duration(vars.style.timing.transitions)
    .call(label_style)
    .attr("opacity",1)
    
  labels.exit()
    .attr("opacity",0)
    .remove()
  
  return data
//   
// 
//   
//   var max_size = d3.max(data_packed,function(d){return d.r;})*2,
//       downscale = (d3.min([vars.app_width/columns,(vars.app_height/rows)-title_height])*0.90)/max_size;
//       
//   var r = 0, c = 0;
//   data_packed.forEach(function(d){
//     
//     if (d.depth == 1) {
//       
//       if (vars.grouping != "active") {
//         var color = d3plus.variable.color(vars,d.children[0]);
//       }
//       else {
//         var color = "#cccccc";
//       }
//       
//       color = d3.rgb(color).hsl()
//       if (color.s > 0.9) color.s = 0.75
//       while (color.l > 0.75) color = color.darker()
//       color = color.rgb()
//       
//       groups[d.key] = {};
//       groups[d.key][vars.color] = color;
//       groups[d.key].children = d.children.length;
//       groups[d.key].key = d.key;
//       groups[d.key][vars.text.key] = d[vars.text.key];
//       groups[d.key].x = ((vars.app_width/columns)*c)+((vars.app_width/columns)/2);
//       groups[d.key].y = ((vars.app_height/rows)*r)+((vars.app_height/rows)/2)+(title_height/2);
//       groups[d.key].width = (vars.app_width/columns);
//       groups[d.key].height = (vars.app_height/rows);
//       groups[d.key].r = d.r*downscale;
// 
//       if (c < columns-1) c++
//       else {
//         c = 0
//         r++
//       }
//       
//     }
//     
//   })
//   
//   vars.data.app.forEach(function(d){
//     var parent = data_packed.filter(function(p){ 
//       if (d3plus.variable.value(vars,d[vars.id],vars.grouping) === false) var key = "false";
//       else if (d3plus.variable.value(vars,d[vars.id],vars.grouping) === true) var key = "true";
//       else var key = d3plus.variable.value(vars,d[vars.id],vars.grouping)
//       return key == p.key 
//     })[0]
//     d.x = (downscale*(d.x-parent.x))+groups[parent.key].x;
//     d.y = (downscale*(d.y-parent.y))+groups[parent.key].y;
//     d.r = d.r*downscale;
//   })
//     
//   //===================================================================
//   
//   //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   // Set up initial SVG groups
//   //-------------------------------------------------------------------
//     
//   vars.parent_enter.append('g')
//     .attr('class','groups');
//     
//   vars.parent_enter.append('g')
//     .attr('class','bubbles');
//     
//   vars.parent_enter.append('g')
//     .attr('class','labels');
//     
//   //===================================================================
//   
//   //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   // New labels enter, initialize them here
//   //-------------------------------------------------------------------
// 
//   if (vars.small) groups = {};
// 
//   var group = d3.select("g.groups").selectAll("g.group")
//     .data(d3.values(groups),function(d){ return d.key })
//     
//   group.enter().append("g")
//     .attr("class", "group")
//     .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
//     .each(function(d){
//       
//       if (vars.grouping == "active") {
//         var t = d[vars.text.key] == "true" ? "Fully "+vars.active : "Not Fully "+vars.active
//       } else {
//         var t = d[vars.text.key]
//       }
//         
//       d3.select(this).append("text")
//         .attr("opacity",0)
//         .attr("text-anchor","middle")
//         .attr("font-weight",vars.style.font.weight)
//         .attr("font-size","12px")
//         .attr("font-family",vars.style.font.family)
//         .attr("fill",d3plus.color.legible(d[vars.color]))
//         .attr('x',0)
//         .attr('y',function(dd) {
//           return -(d.height/2)-title_height/4;
//         })
//         .each(function(){
//           d3plus.utils.wordwrap({
//             "text": t,
//             "parent": this,
//             "width": d.width,
//             "height": 30
//           })
//         })
//       
//     });
//     
//   group.transition().duration(vars.style.timing.transitions)
//     .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
//     .each(function(d){
//       
//       if (vars.style.group.background && d.children > 1) {
//         
//         var bg = d3.select(this).selectAll("circle")
//           .data([d]);
//         
//         bg.enter().append("circle")
//           .attr("fill", d[vars.color])
//           .attr("stroke", d[vars.color])
//           .attr("stroke-width",1)
//           .style('fill-opacity', 0.1 )
//           .attr("opacity",0)
//           .attr("r",d.r)
//         
//         bg.transition().duration(vars.style.timing.transitions)
//           .attr("opacity",1)
//           .attr("r",d.r);
//           
//       } else {
//         d3.select(this).select("circle").transition().duration(vars.style.timing.transitions)
//           .attr("opacity",0)
//           .remove();
//       }
//       
//       d3.select(this).select("text").transition().duration(vars.style.timing.transitions)
//         .attr("opacity",1)
//         .attr('y',function(dd) {
//           return -(d.height/2)-title_height/4;
//         })
//       
//     });
//     
//   group.exit().transition().duration(vars.style.timing.transitions)
//     .each(function(d){
//       
//       if (vars.style.group.background) {
//         d3.select(this).select("circle").transition().duration(vars.style.timing.transitions)
//           .attr("r",0)
//           .attr("opacity",0);
//       }
//       
//       d3.select(this).selectAll("text").transition().duration(vars.style.timing.transitions)
//         .attr("opacity",0);
//         
//     }).remove();
//     
//   //===================================================================

};
