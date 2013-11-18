d3plus.data.bubbles = "array";
d3plus.vars.bubbles = ["value"];

d3plus.apps.bubbles = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------
  
  var covered = false
  
  var groups = {},
      donut_size = 0.35,
      title_height = vars.small ? 0 : 30,
      arc_offset = vars.donut ? donut_size : 0,
      sort_order = vars.sort == "value" ? vars.value : vars.sort;
      
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
  // Define size scaling
  //-------------------------------------------------------------------
  if (!vars.app_data) vars.app_data = []
  var size_domain = d3.extent(vars.app_data, function(d){ 
    return d[vars.value] == 0 ? null : d[vars.value] 
  })
  
  if (!size_domain[1]) size_domain = [0,0]
  if (size_domain[1] == size_domain[0]) size_domain[0] = 0
  
  vars.size_scale = d3.scale[vars.size_scale_type]()
    .domain(size_domain)
    .range([1,4])
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate positioning for each bubble
  //-------------------------------------------------------------------
  
  var data_nested = {}
  data_nested.key = "root";
  data_nested.values = d3.nest()
    .key(function(d){ return d3plus.utils.variable(vars,d[vars.id],vars.grouping) })
    .entries(vars.app_data)
    
  var pack = d3.layout.pack()
    .size([vars.width,vars.height])
    .children(function(d) { return d.values; })
    .value(function(d) { return d[vars.value] })
    .padding(0)
    .radius(function(d){ return vars.size_scale(d) })
    .sort(function(a,b) { 
      if (a.values && b.values) return a.values.length - b.values.length;
      else return a[vars.value] - b[vars.value];
    })
  
  var data_packed = pack.nodes(data_nested)
    .filter(function(d){
      if (d.depth == 1) {
        if (d.children.length == 1 ) {
          d[vars.text] = d3plus.utils.variable(vars,d.children[0][vars.id],vars.text);
          d.category = d.children[0].category;
        }
        else {
          d[vars.text] = d.key;
          d.category = d.key;
        }
        d[vars.value] = d.value;
      }
      return d.depth == 1;
    })
    .sort(function(a,b){
      var s = sort_order == vars.color ? "category" : sort_order
      var a_val = d3plus.utils.variable(vars,a,s)
      var b_val = d3plus.utils.variable(vars,b,s)
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

  if (vars.app_data.length > 0) {
    while ((rows-1)*columns >= data_packed.length) rows--
  }
  

  
  var max_size = d3.max(data_packed,function(d){return d.r;})*2,
      downscale = (d3.min([vars.width/columns,(vars.height/rows)-title_height])*0.90)/max_size;
      
  var r = 0, c = 0;
  data_packed.forEach(function(d){
    
    if (d.depth == 1) {
      
      if (vars.grouping != "active") {
        var color = d3plus.utils.color(vars,d.children[0]);
      }
      else {
        var color = "#cccccc";
      }
      
      color = d3.rgb(color).hsl()
      if (color.s > 0.9) color.s = 0.75
      while (color.l > 0.75) color = color.darker()
      color = color.rgb()
      
      groups[d.key] = {};
      groups[d.key][vars.color] = color;
      groups[d.key].children = d.children.length;
      groups[d.key].key = d.key;
      groups[d.key][vars.text] = d[vars.text];
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
  
  vars.app_data.forEach(function(d){
    var parent = data_packed.filter(function(p){ 
      if (d3plus.utils.variable(vars,d[vars.id],vars.grouping) === false) var key = "false";
      else if (d3plus.utils.variable(vars,d[vars.id],vars.grouping) === true) var key = "true";
      else var key = d3plus.utils.variable(vars,d[vars.id],vars.grouping)
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
        var t = d[vars.text] == "true" ? "Fully "+vars.active : "Not Fully "+vars.active
      } else {
        var t = d[vars.text]
      }
        
      d3.select(this).append("text")
        .attr("opacity",0)
        .attr("text-anchor","middle")
        .attr("font-weight",vars.font_weight)
        .attr("font-size","12px")
        .attr("font-family",vars.font)
        .attr("fill",d3plus.utils.darker_color(d[vars.color]))
        .attr('x',0)
        .attr('y',function(dd) {
          return -(d.height/2)-title_height/4;
        })
        .each(function(){
          d3plus.utils.wordwrap({
            "text": t,
            "parent": this,
            "width": d.width,
            "height": 30
          })
        })
      
    });
    
  group.transition().duration(d3plus.timing)
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      if (vars.group_bgs && d.children > 1) {
        
        var bg = d3.select(this).selectAll("circle")
          .data([d]);
        
        bg.enter().append("circle")
          .attr("fill", d[vars.color])
          .attr("stroke", d[vars.color])
          .attr("stroke-width",1)
          .style('fill-opacity', 0.1 )
          .attr("opacity",0)
          .attr("r",d.r)
        
        bg.transition().duration(d3plus.timing)
          .attr("opacity",1)
          .attr("r",d.r);
          
      } else {
        d3.select(this).select("circle").transition().duration(d3plus.timing)
          .attr("opacity",0)
          .remove();
      }
      
      d3.select(this).select("text").transition().duration(d3plus.timing)
        .attr("opacity",1)
        .attr('y',function(dd) {
          return -(d.height/2)-title_height/4;
        })
      
    });
    
  group.exit().transition().duration(d3plus.timing)
    .each(function(d){
      
      if (vars.group_bgs) {
        d3.select(this).select("circle").transition().duration(d3plus.timing)
          .attr("r",0)
          .attr("opacity",0);
      }
      
      d3.select(this).selectAll("text").transition().duration(d3plus.timing)
        .attr("opacity",0);
        
    }).remove();
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New bubbles enter, initialize them here
  //-------------------------------------------------------------------

  var bubble = d3.select("g.bubbles").selectAll("g.bubble")
    .data(vars.app_data,function(d){ return d[vars.id] })
    
  update_function = function(obj,d) {
  
    
  
  }
  
  bubble.transition().duration(d3plus.timing)
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      if (vars.donut) d.arc_inner_bg = d.r*arc_offset;
      else d.arc_inner_bg = 0;
      d.arc_radius_bg = d.r;
  
      var color = d3plus.utils.color(vars,d)
  
      var bg_color = d3.hsl(color)
      bg_color.l = 0.95
      bg_color = bg_color.toString()

      d3.select(this).select("path.bg").transition().duration(d3plus.timing)
        .attr("fill", bg_color )
        .attr("stroke", color)
        .attrTween("d",arcTween_bg)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id]+"_bg"] = d.arc_inner_bg
        })
  
  
      var arc_start = d.r*arc_offset;

      d.arc_inner = arc_start;
      d.arc_radius = arc_start+(d.r-arc_start);
    
      if (d[vars.total]) d.arc_angle = (((d[vars.active]/d[vars.total])*360) * (Math.PI/180));
      else if (d.active) d.arc_angle = Math.PI; 

      d.arc_angle = d.arc_angle < Math.PI*2 ? d.arc_angle : Math.PI*2

      d3.select(this).select("path.available").transition().duration(d3plus.timing)
        .style('fill', color)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]] = d.arc_radius
          vars.arc_inners[d[vars.id]] = d.arc_inner
          vars.arc_angles[d[vars.id]] = d.arc_angle
        })

      if (d[vars.else_var]) {

        d.arc_inner_else = arc_start;
        d.arc_radius_else = d.r;
  
        d.arc_angle_else = d.arc_angle + (((d[vars.else_var] / d[vars.total])*360) * (Math.PI/180));
        d.arc_angle_else = d.arc_angle_else < Math.PI*2 ? d.arc_angle_else : Math.PI*2
    
        d3.select("pattern#hatch"+d[vars.id]).select("rect").transition().duration(d3plus.timing)
          .style("fill",color)
    
        d3.select("pattern#hatch"+d[vars.id]).select("path").transition().duration(d3plus.timing)
          .style("stroke",color)

        d3.select(this).select("path.elsewhere").transition().duration(d3plus.timing)
          .style("stroke",color)
          .attrTween("d",arcTween_else)
          .each("end", function() {
            vars.arc_sizes[d[vars.id]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id]+"_else"] = d.arc_inner_else
            vars.arc_angles[d[vars.id]+"_else"] = d.arc_angle_else
          })
      }
      
    })
    
  bubble.enter().append("g")
    .attr("class", "bubble")
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      d3.select(this).append("rect")
        .attr("fill","transparent")
        .attr("opacity",0)
        .attr("x",-d.r)
        .attr("y",-d.r)
        .attr("width",d.r*2)
        .attr("height",d.r*2)
      
      vars.arc_sizes[d[vars.id]+"_bg"] = 0
      vars.arc_inners[d[vars.id]+"_bg"] = 0
      
      var color = d3plus.utils.color(vars,d)
      
      var bg_color = d3.hsl(color)
      bg_color.l = 0.95
      bg_color = bg_color.toString()
      
      d3.select(this).append("path")
        .attr("class","bg")
        .attr("fill", bg_color )
        .attr("stroke", color)
        .attr("stroke-width",1)
      
      d3.select(this).select("path.bg").transition().duration(d3plus.timing)
        .attrTween("d",arcTween_bg)
    
      if (d[vars.else_var]) {
    
        vars.arc_angles[d[vars.id]+"_else"] = 0
        vars.arc_sizes[d[vars.id]+"_else"] = 0
        vars.arc_inners[d[vars.id]+"_else"] = 0
        
        vars.defs.select("pattern#hatch"+d[vars.id]).remove()
        
        var pattern = vars.defs.append("pattern")
          .attr("id","hatch"+d[vars.id])
          .attr("patternUnits","userSpaceOnUse")
          .attr("x","0")
          .attr("y","0")
          .attr("width","10")
          .attr("height","10")
          .append("g")
            
        pattern.append("rect")
          .attr("x","0")
          .attr("y","0")
          .attr("width","10")
          .attr("height","10")
          .attr("fill",color)
          .attr("fill-opacity",0.25)
            
        pattern.append("line")
          .attr("x1","0")
          .attr("x2","10")
          .attr("y1","0")
          .attr("y2","10")
          .attr("stroke",color)
          .attr("stroke-width",1)
            
        pattern.append("line")
          .attr("x1","-1")
          .attr("x2","1")
          .attr("y1","9")
          .attr("y2","11")
          .attr("stroke",color)
          .attr("stroke-width",1)
            
        pattern.append("line")
          .attr("x1","9")
          .attr("x2","11")
          .attr("y1","-1")
          .attr("y2","1")
          .attr("stroke",color)
          .attr("stroke-width",1)
      
        d3.select(this).append("path")
          .attr("class","elsewhere")
          .attr("fill", "url(#hatch"+d[vars.id]+")")
          .attr("stroke",color)
          .attr("stroke-width",1)
      
        d3.select(this).select("path.elsewhere").transition().duration(d3plus.timing)
          .attrTween("d",arcTween_else)
      }
      
      vars.arc_angles[d[vars.id]] = 0
      vars.arc_sizes[d[vars.id]] = 0
      vars.arc_inners[d[vars.id]] = 0
      
      d3.select(this).append("path")
        .each(function(dd) { dd.arc_id = dd[vars.id]; })
        .attr("class","available")
        .attr('fill', color)
      
      d3.select(this).select("path.available").transition().duration(d3plus.timing)
        .attrTween("d",arcTween)
        
    })
    .each(function(d){
    
      if (vars.donut) d.arc_inner_bg = d.r*arc_offset;
      else d.arc_inner_bg = 0;
      d.arc_radius_bg = d.r;
      
      d3.select(this).select("path.bg").transition().duration(d3plus.timing)
        .attrTween("d",arcTween_bg)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id]+"_bg"] = d.arc_inner_bg
        })
        
        
      var arc_start = d.r*arc_offset;
      
      d.arc_inner = arc_start;
      d.arc_radius = arc_start+(d.r-arc_start);

      d3.select(this).select("path.available").transition().duration(d3plus.timing)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]] = d.arc_radius
          vars.arc_inners[d[vars.id]] = d.arc_inner
          
          if (d[vars.total]) d.arc_angle = (((d[vars.active] / d[vars.total])*360) * (Math.PI/180));
          else if (d.active) d.arc_angle = Math.PI; 
          
          d.arc_angle = d.arc_angle < Math.PI*2 ? d.arc_angle : Math.PI*2
          
          d3.select(this).transition().duration(d3plus.timing*(d.arc_angle/2))
            .attrTween("d",arcTween)
            .each("end", function() {
              vars.arc_angles[d[vars.id]] = d.arc_angle
            })
        })
    
      if (d[vars.else_var]) {
      
        d.arc_inner_else = arc_start;
        d.arc_radius_else = d.r;
      
        d3.select(this).select("path.elsewhere").transition().duration(d3plus.timing)
          .attrTween("d",arcTween_else)
          .each("end", function() {
            vars.arc_sizes[d[vars.id]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id]+"_else"] = d.arc_inner_else
      
            d.arc_angle_else = d.arc_angle + (((d[vars.else_var] / d[vars.total])*360) * (Math.PI/180));

            d.arc_angle_else = d.arc_angle_else < Math.PI*2 ? d.arc_angle_else : Math.PI*2
            
            d3.select(this).transition().duration(d3plus.timing*(d.arc_angle_else/2))
              .attrTween("d",arcTween_else)
              .each("end", function() {
                vars.arc_angles[d[vars.id]+"_else"] = d.arc_angle_else
              })
          })
      }
      
    })
    
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for things that are already in existance
  //-------------------------------------------------------------------
    
  bubble
    .on(d3plus.evt.over, function(d){
      
      covered = false
      d3.select(this).style("cursor","pointer")
      
      var tooltip_data = d3plus.utils.tooltip(vars,d,"short")

      d3plus.ui.tooltip.remove(vars.type)
      d3plus.ui.tooltip.create({
        "id": vars.type,
        "color": d3plus.utils.color(vars,d),
        "icon": d3plus.utils.variable(vars,d[vars.id],"icon"),
        "style": vars.icon_style,
        "data": tooltip_data,
        "title": d3plus.utils.variable(vars,d[vars.id],vars.text),
        "x": d.x+vars.margin.left+vars.parent.node().offsetLeft,
        "y": d.y+vars.margin.top+vars.parent.node().offsetTop,
        "offset": d.r-5,
        "arrow": true,
        "mouseevents": false,
        "footer": vars.footer_text()
      })
      
    })
    .on(d3plus.evt.out, function(d){
      if (!covered) d3plus.ui.tooltip.remove(vars.type)
    })
    .on(d3plus.evt.click, function(d){

      covered = true
      var id = d3plus.utils.variable(vars,d,vars.id)
      var self = this
      
      make_tooltip = function(html) {
        d3plus.ui.tooltip.remove(vars.type)
        d3.selectAll(".axis_hover").remove()
        
        var tooltip_data = d3plus.utils.tooltip(vars,d,"long")
        
        d3plus.ui.tooltip.create({
          "title": d3plus.utils.variable(vars,d,vars.text),
          "color": d3plus.utils.color(vars,d),
          "icon": d3plus.utils.variable(vars,d,"icon"),
          "style": vars.icon_style,
          "id": vars.type,
          "fullscreen": true,
          "html": html,
          "footer": vars.footer,
          "data": tooltip_data,
          "mouseevents": self,
          "parent": vars.parent,
          "background": vars.background
        })
        
      }
      
      var html = vars.click_function ? vars.click_function(id) : null
      
      if (typeof html == "string") make_tooltip(html)
      else if (html && html.url && html.callback) {
        d3.json(html.url,function(data){
          html = html.callback(data)
          make_tooltip(html)
        })
      }
      else if (vars.tooltip.long) {
        make_tooltip(html)
      }
      
    })
      
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit, for nodes and links that are being removed
  //-------------------------------------------------------------------

  bubble.exit().transition().duration(d3plus.timing)
    .each(function(d){
    
      d.arc_radius_bg = 0;
      d.arc_inner_bg = 0;
      
      d3.select(this).select("path.bg").transition().duration(d3plus.timing)
        .attrTween("d",arcTween_bg)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id]+"_bg"] = d.arc_inner_bg
        })
    
      d.arc_radius = 0;
      d.arc_angle = 0; 
      d.arc_inner = 0;

      d3.select(this).select("path.available").transition().duration(d3plus.timing)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_angles[d[vars.id]] = d.arc_angle
          vars.arc_sizes[d[vars.id]] = d.arc_radius
          vars.arc_inners[d[vars.id]] = d.arc_inner
        })
    
      if (d[vars.else_var]) {
      
        d.arc_angle_else = 0;
        d.arc_radius_else = 0;
        d.arc_inner_else = 0;
      
        d3.select(this).select("path.elsewhere").transition().duration(d3plus.timing)
          .attrTween("d",arcTween_else)
          .each("end", function(dd) {
            vars.arc_angles[d[vars.id]+"_else"] = d.arc_angle_else
            vars.arc_sizes[d[vars.id]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id]+"_else"] = d.arc_inner_else
          })
      }

      d3.select(this).select("circle.hole").transition().duration(d3plus.timing)
        .attr("r", 0)
      
    })
    .remove();

  //===================================================================
  
  function arcTween(b) {
    var i = d3.interpolate({arc_angle: vars.arc_angles[b[vars.id]], arc_radius: vars.arc_sizes[b[vars.id]], arc_inner: vars.arc_inners[b[vars.id]]}, b);
    return function(t) {
      return arc(i(t));
    };
  }
  
  function arcTween_else(b) {
    var i = d3.interpolate({arc_angle_else: vars.arc_angles[b[vars.id]+"_else"], arc_radius_else: vars.arc_sizes[b[vars.id]+"_else"], arc_inner_else: vars.arc_inners[b[vars.id]+"_else"]}, b);
    return function(t) {
      return arc_else(i(t));
    };
  }
  
  function arcTween_bg(b) {
    var i = d3.interpolate({arc_radius_bg: vars.arc_sizes[b[vars.id]+"_bg"], arc_inner_bg: vars.arc_inners[b[vars.id]+"_bg"]}, b);
    return function(t) {
      return arc_bg(i(t));
    };
  }

  //===================================================================
};
