vizwhiz.geo_map = function(data,vars) {

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
      .on("zoom",function(d){ zoom(d); })
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
      path = d3.geo.path().projection(vars.projection),
      tile = d3.geo.tile().size([vars.width, vars.height]),
      old_scale = vars.projection.scale()*2*Math.PI,
      old_translate = vars.projection.translate();

  //===================================================================
  
  if (data) {
    data_extent = d3.extent(d3.values(data),function(d){
      return d[vars.value_var] && d[vars.value_var] != 0 ? d[vars.value_var] : null
    })
    var data_range = [],
        step = 0.0
    while(step <= 1) {
      data_range.push((data_extent[0]*Math.pow((data_extent[1]/data_extent[0]),step)))
      step += 0.2
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
      .attr("width",vars.width)
      .attr("height",vars.height)
      .attr(vars.map.style.water);
      
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
    .on(vizwhiz.evt.down,function(d){dragging = true})
    .on(vizwhiz.evt.up,function(d){dragging = false})
    .append('g')
      .attr('class','viz');
    
  viz_enter.append("rect")
    .attr("class","overlay")
    .attr("width",vars.width)
    .attr("height",vars.height)
    .attr("fill","transparent");
    
  d3.select("rect.overlay")
    .on(vizwhiz.evt.click, function(d) {
      if (vars.highlight) {
        var temp = vars.highlight;
        vars.highlight = null;
        d3.select("#path"+temp).call(color_paths);
        vars.clicked = false;
        zoom(vars.boundries);
        info();
      }
    })
    
  viz_enter.append('g')
    .attr('class','paths');
    
  // add scale
  
  if (!vars.small) {
    var gradient = defs
      .append("svg:linearGradient")
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
      .attr("transform","translate("+(vars.width-info_width-5)+","+5+")");
    
    scale.append("rect")
      .attr("width", info_width+"px")
      .attr("height", (scale_height*6)+"px")
      .attr("fill","#ffffff")
      .attr("rx",3)
      .attr("ry",3)
      .attr("stroke","#888")
      .attr("stroke-width",1)
        
    scale.append("text")
      .attr("id","scale_title")
      .attr("x",(info_width/2)+"px")
      .attr("y","0px")
      .attr("dy","1.25em")
      .attr("text-anchor","middle")
      .attr("fill","#333")
      .style("font-weight","bold")
      .attr("font-size","12px")
      .attr("font-family","Helvetica")
       
    data_range.forEach(function(v,i){
      if (i == data_range.length-1) {
        var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))-1
      } else if (i != 0) {
        var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))-1
      } else {
        var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))
      }
      scale.append("rect")
        .attr("x", x+"px")
        .attr("y", (scale_height*2.5)+"px")
        .attr("width", 1)
        .attr("height", (scale_height*1.5)+"px")
        .style("fill", "#333")
    
      scale.append("rect")
        .attr("x",scale_padding+"px")
        .attr("y",(scale_height*2.5)+"px")
        .attr("width", (info_width-(scale_padding*2))+"px")
        .attr("height", scale_height+"px")
        .style("fill", "url(#gradient)")
        
      scale.append("text")
        .attr("id","scale_"+i)
        .attr("x",x+"px")
        .attr("y", ((scale_height*3.5)+5)+"px")
        .attr("dy","1em")
        .attr("text-anchor","middle")
        .attr("fill","#333")
        .style("font-weight","normal")
        .attr("font-size","10px")
        .attr("font-family","Helvetica")
    })
    
    if (!data_extent[0]) {
      d3.select("g.scale").style("opacity",0)
    }
    else {

      data_range.forEach(function(v,i){
        scale.select("text#scale_"+i).text(vizwhiz.utils.format_num(v,false,2,true))
      })
      scale.select("text#scale_title").text(vars.value_var)
      d3.select("g.scale").style("opacity",1)
    }
    
    // Create Zoom Controls div on vars.svg_enter
    vars.parent.select("div#zoom_controls").remove()
    var zoom_div = vars.parent.append("div")
      .attr("id","zoom_controls")
      .style("top",function(){
        return this.offsetTop+vars.margin.top+"px";
      })
    
    zoom_div.append("div")
      .attr("id","zoom_in")
      .attr("unselectable","on")
      .on(vizwhiz.evt.click,function(){ zoom("in") })
      .text("+")
    
    zoom_div.append("div")
      .attr("id","zoom_out")
      .attr("unselectable","on")
      .on(vizwhiz.evt.click,function(){ zoom("out") })
      .text("-")
  }
  
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
      if (!vars.clicked) {
        vars.highlight = d[vars.id_var];
        d3.select(this).attr("opacity",select_opacity);
        info();
      }
      if (vars.highlight != d[vars.id_var]) d3.select(this).attr("opacity",select_opacity);
    })
    .on(vizwhiz.evt.out, function(d){
      if (!vars.clicked) {
        vars.highlight = null;
        d3.select(this).attr("opacity",default_opacity);
        info();
      }
      if (vars.highlight != d[vars.id_var]) d3.select(this).attr("opacity",default_opacity);
    })
    .on(vizwhiz.evt.click, function(d) {
      if (vars.clicked && vars.highlight == d[vars.id_var]) {
        var temp = vars.highlight;
        vars.highlight = null;
        d3.select("#path"+temp).call(color_paths);
        vars.clicked = false;
        zoom(vars.boundries);
        info();
      } else {
        if (vars.highlight && vars.clicked) {
          var temp = vars.highlight;
          vars.highlight = null;
          d3.select("#path"+temp).call(color_paths);
        }
        else {
          vars.clicked = true;
        }
        vars.highlight = d[vars.id_var];
        d3.select(this).call(color_paths);
        zoom(d3.select("path#path"+vars.highlight).datum());
        info();
      }
    })
  
  coord.transition().duration(vizwhiz.timing)
    .attr("opacity",default_opacity)
    .call(color_paths);
  
  info();
    
  d3.select("g.scale").transition().duration(vizwhiz.timing)
    .attr("transform","translate("+(vars.width-info_width-5)+","+5+")");
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit, for nodes and links that are being removed
  //-------------------------------------------------------------------

  // node.exit().remove()

  //===================================================================
  
  if (vars.init) {
    zoom(vars.boundries,0);
    vars.init = false;
  }
  if (vars.clicked) {
    zoom(d3.select("path#path"+vars.highlight).datum());
  }
  
  function color_paths(p) {
    defs.selectAll("#stroke_clip").remove();
    p
      .attr("fill",function(d){ 
        if (d[vars.id_var] == vars.highlight && vars.clicked) return "none";
        else if (!data) return "#888888";
        else return data[d[vars.id_var]][vars.value_var] ? value_color(data[d[vars.id_var]][vars.value_var]) : "#888888"
      })
      .attr("stroke-width",function(d) {
        if (d[vars.id_var] == vars.highlight && vars.clicked) return 10;
        else return stroke_width;
      })
      .attr("stroke",function(d) {
        if (d[vars.id_var] == vars.highlight && vars.clicked) {
          return data[d[vars.id_var]][vars.value_var] ? value_color(data[d[vars.id_var]][vars.value_var]) : "#888888";
        }
        else return "white";
      })
      .attr("opacity",function(d){
        if (d[vars.id_var] == vars.highlight) return select_opacity;
        else return default_opacity;
      })
      .attr("clip-path",function(d){ 
        if (d[vars.id_var] == vars.highlight && vars.clicked) return "url(#stroke_clip)";
        else return "none"
      })
      .each(function(d){
        if (d[vars.id_var] == vars.highlight && vars.clicked) {
          d3.select("defs").append("clipPath")
            .attr("id","stroke_clip")
            .append("use")
              .attr("xlink:href",function(dd) { return "#path"+vars.highlight } )
        }
      });
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Zoom Function
  //-------------------------------------------------------------------
  
  function zoom(param,custom_timing) {
    
    var translate = vars.zoom_behavior.translate(),
        zoom_extent = vars.zoom_behavior.scaleExtent()
        
    var scale = vars.zoom_behavior.scale()
    
    if (param == "in") var scale = scale*2
    else if (param == "out") var scale = scale*0.5
    
    var svg_scale = scale/vars.width,
        svg_translate = [translate[0]-(scale/2),translate[1]-(((scale/vars.width)*vars.height)/2)]
        
    old_scale = vars.projection.scale()*2*Math.PI
    old_translate = vars.projection.translate()
        
    if (param.coordinates) {
      
      if (vars.clicked && vars.highlight) { 
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

  function info() {
    
    vizwhiz.tooltip.remove();
    
    if (vars.highlight && !vars.small) {
      
      var tooltip_data = []
      
      if (!data[vars.highlight][vars.value_var]) {
        var footer = "No Data Available",
            color = "#888"
      }
      else {
        var color = data[vars.highlight][vars.value_var] ? value_color(data[vars.highlight][vars.value_var]) : "#888888"
        if (!vars.clicked) var footer = "Click for More Info"
        else {
          var footer = vars.data_source
          if (vars.tooltip_info instanceof Array) var a = vars.tooltip_info
          else var a = vars.tooltip_info.long
          a.forEach(function(t){
            if (data[vars.highlight][t]) {
              h = t == vars.value_var
              tooltip_data.push({"name": t, "value": data[vars.highlight][t], "highlight": h, "format": vars.number_format})
            }
          })
        }
      }
      
      vizwhiz.tooltip.create({
        "data": tooltip_data,
        "title": data[vars.highlight][vars.text_var],
        "id": data[vars.highlight][vars.id_var],
        "icon": data[vars.highlight].icon,
        "color": color,
        "footer": footer,
        "x": vars.width-info_width-5,
        "y": vars.margin.top+10+(scale_height*6),
        "fixed": true,
        "width": info_width
      })
      
    }
    
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
