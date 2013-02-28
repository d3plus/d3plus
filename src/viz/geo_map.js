vizwhiz.viz.geo_map = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var width = 300,
      height = 300,
      value_var = "value",
      id_var = "id",
      text_var = "name",
      clicked = false,
      highlight = null,
      timing = 500,
      coords = null,
      shape = null,
      terrain = true,
      background = null,
      default_opacity = 0.25,
      select_opacity = 0.75,
      land_style = {"fill": "#F1EEE8"},
      water_color = "#B5D0D0",
      stroke_width = 1,
      tooltip_info = [],
      color_gradient = ["#00008f", "#003fff", "#00efff", "#ffdf00", "#ff3000", "#7f0000"],
      zoom_behavior = d3.behavior.zoom(),
      projection = d3.geo.mercator(),
      value_color = d3.scale.log(),
      initial_width,
      initial_height,
      first = true;

  //===================================================================


  function chart(selection) {
    selection.each(function(data, i) {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Private Variables
      //-------------------------------------------------------------------
      
      if (first) {
        projection
          .scale(width)
          .translate([width/2,height/2]);
          
        initial_width = width
        initial_height = height
          
        zoom_behavior
          .scale(projection.scale())
          .translate(projection.translate())
          .on("zoom",function(d){ zoom(d); })
          .scaleExtent([width, 1 << 23]);
      }
      
      var this_selection = this,
          dragging = false,
          info_width = 300,
          scale_height = 10,
          scale_padding = 20,
          path = d3.geo.path().projection(projection),
          tile = d3.geo.tile().size([width, height]),
          old_scale = projection.scale(),
          old_translate = projection.translate();
          
      
      if (data) {
        data_extent = d3.extent(d3.values(data),function(d){
          return d[value_var] && d[value_var] != 0 ? d[value_var] : null
        })
        var data_range = [],
            step = 0.0
        while(step <= 1) {
          data_range.push((data_extent[0]*Math.pow((data_extent[1]/data_extent[0]),step)))
          step += 0.2
        }
        value_color
          .domain(data_range)
          .interpolate(d3.interpolateRgb)
          .range(color_gradient)
      }

      //===================================================================
      
      // Select the svg element, if it exists.
      var svg = d3.select(this_selection).selectAll("svg").data([data]);
      
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height)
        .style("z-index", 10)
        .style("position","absolute");
        
      var defs = svg_enter.append("defs")
        
      if (background) {
            
        svg_enter.append("rect")
          .attr("width",width)
          .attr("height",height)
          .attr("fill",water_color);
          
        svg_enter.append("g")
          .attr("id","land")
          .attr("class","viz")
              
        var land = d3.select("g#land").selectAll("path")
          .data(topojson.object(background, background.objects.land).geometries)
        
        land.enter().append("path")
          .attr("d",path)
          .attr(land_style)
            
      }

      svg_enter.append('g')
        .attr('class','tiles');
        
      if (terrain) update_tiles(0);
      else d3.selectAll("g.tiles *").remove()
        
      // Create viz group on svg_enter
      var viz_enter = svg_enter.append('g')
        .call(zoom_behavior)
        .on(vizwhiz.evt.down,function(d){dragging = true})
        .on(vizwhiz.evt.up,function(d){dragging = false})
        .append('g')
          .attr('class','viz');
        
      viz_enter.append("rect")
        .attr("class","overlay")
        .attr("width",width)
        .attr("height",height)
        .attr("fill","transparent")
        .on(vizwhiz.evt.click, function(d) {
          if (highlight) {
            var temp = highlight;
            highlight = null;
            d3.select("#path"+temp).call(color_paths);
            clicked = false;
            zoom(shape);
            info();
          }
        });
        
      viz_enter.append('g')
        .attr('class','paths');
        
      // add scale
        
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
        
      var scale = svg_enter.append('g')
        .attr('class','scale')
        .attr("transform","translate("+(width-info_width-5)+","+5+")");
        
      scale.append("rect")
        .attr("width", info_width+"px")
        .attr("height", (scale_height*3)+"px")
        .attr("fill","#ffffff")
        .attr("rx",3)
        .attr("ry",3)
        .attr("stroke","#cccccc")
        .attr("stroke-width",2)
        
      scale.append("rect")
        .attr("x",scale_padding+"px")
        .attr("y","5px")
        .attr("width", (info_width-(scale_padding*2))+"px")
        .attr("height", scale_height+"px")
        .style("fill", "url(#gradient)")
           
      data_range.forEach(function(v,i){
        if (i == data_range.length-1) {
          var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))-2
        } else if (i != 0) {
          var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))-1
        } else {
          var x = scale_padding+Math.round((i/(data_range.length-1))*(info_width-(scale_padding*2)))
        }
        scale.append("rect")
          .attr("x", x+"px")
          .attr("y", "5px")
          .attr("width", 2)
          .attr("height", scale_height+"px")
          .style("fill", "#fff")
            
        scale.append("text")
          .attr("id","scale_"+i)
          .attr("x",x+"px")
          .attr("y", (scale_height+5)+"px")
          .attr("dy","1em")
          .attr("text-anchor","middle")
          .attr("fill","#000000")
          .style("font-weight","bold")
          .attr("font-size","10px")
          .attr("font-family","Helvetica")
      })
      
      data_range.forEach(function(v,i){
        d3.select("text#scale_"+i).text(vizwhiz.utils.format_num(v,false,2,true))
      })
        
      // Create Zoom Controls div on svg_enter
      d3.select(this_selection).select("div#zoom_controls").remove()
      var zoom_div = d3.select(this_selection).append("div")
        .attr("id","zoom_controls")
        
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
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New nodes and links enter, initialize them here
      //-------------------------------------------------------------------

      var coord = d3.select("g.paths").selectAll("path")
        .data(coords)
        
      coord.enter().append("path")
        .attr("id",function(d) { return "path"+d.id } )
        .attr("d",path)
        .attr("vector-effect","non-scaling-stroke")
        .attr("opacity",0)
        .on(vizwhiz.evt.over, function(d){
          if (!clicked) {
            highlight = d[id_var];
            d3.select(this).attr("opacity",select_opacity);
            info();
          }
          if (highlight != d[id_var]) d3.select(this).attr("opacity",select_opacity);
        })
        .on(vizwhiz.evt.out, function(d){
          if (!clicked) {
            highlight = null;
            d3.select(this).attr("opacity",default_opacity);
            info();
          }
          if (highlight != d[id_var]) d3.select(this).attr("opacity",default_opacity);
        })
        .on(vizwhiz.evt.click, function(d) {
          if (clicked && highlight == d[id_var]) {
            var temp = highlight;
            highlight = null;
            d3.select("#path"+temp).call(color_paths);
            clicked = false;
            zoom(shape);
            info();
          } else {
            if (highlight) {
              var temp = highlight;
              highlight = null;
              d3.select("#path"+temp).call(color_paths);
            }
            highlight = d[id_var];
            d3.select(this).call(color_paths);
            clicked = true;
            zoom(d3.select("path#path"+highlight).datum());
            info();
          }
        });
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for things that are already in existance
      //-------------------------------------------------------------------
      
      coord.transition().duration(timing)
        .attr("opacity",default_opacity)
        .call(color_paths);
        
      // land.attr("d",path);
        
      svg.transition().duration(timing)
        .attr("width", width)
        .attr("height", height)
        .each("end",function(){
          info()
        });
        
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Exit, for nodes and links that are being removed
      //-------------------------------------------------------------------

      // node.exit().remove()

      //===================================================================
      
      if (first) {
        zoom(shape,0);
        first = false;
      } else if (clicked) {
        zoom(d3.select("path#path"+highlight).datum());
      }
      
      function color_paths(p) {
        p
          .attr("fill",function(d){ 
            if (d[id_var] == highlight) return "none";
            else if (!data) return "#888888";
            else return data[d[id_var]] ? value_color(data[d[id_var]][value_var]) : "#eeeeee"
          })
          .attr("stroke-width",function(d) {
            if (d[id_var] == highlight) return 10;
            else return stroke_width;
          })
          .attr("stroke",function(d) {
            if (d[id_var] == highlight) return data[d[id_var]] ? value_color(data[d[id_var]][value_var]) : "#eeeeee";
            else return "white";
          })
          .attr("opacity",function(d){
            if (d[id_var] == highlight) return select_opacity;
            else return default_opacity;
          })
          .attr("clip-path",function(d){ 
            if (d[id_var] == highlight) return "url(#stroke_clip)";
            else return "none"
          })
          .each(function(d){
            if (d[id_var] == highlight) {
              defs.selectAll("#stroke_clip").remove();
              d3.select("defs").append("clipPath")
                .attr("id","stroke_clip")
                .append("use")
                  .attr("xlink:href",function(dd) { return "#path"+highlight } )
            }
          });
      }
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Zoom Function
      //-------------------------------------------------------------------
      
      function zoom(param,custom_timing) {
        
        var translate = zoom_behavior.translate(),
            zoom_extent = zoom_behavior.scaleExtent()
            
        var scale = zoom_behavior.scale()
        
        if (param == "in") var scale = scale*2
        else if (param == "out") var scale = scale*0.5
        
        var svg_scale = scale/initial_width,
            svg_translate = [translate[0]-(scale/2),translate[1]-(((scale/initial_width)*initial_height)/2)]
            
        old_scale = projection.scale()
        old_translate = projection.translate()
            
        if (param.coordinates) {
          
          if (clicked && highlight) { 
            var left = 20, w_avail = width-info_width-left
          } else {
            var left = 0, w_avail = width
          }
          
          var b = path.bounds(param),
              w = (b[1][0] - b[0][0])*1.1,
              h = (b[1][1] - b[0][1])*1.1,
              s_width = (w_avail*(scale/initial_width))/w,
              s_height = (height*(scale/initial_width))/h
              
          if (s_width < s_height) {
            var s = s_width*initial_width,
                offset_left = ((w_avail-(((w/1.1)/svg_scale)*s/initial_width))/2)+left,
                offset_top = (height-((h/svg_scale)*s/initial_width))/2
          } else {
            var s = s_height*initial_width,
                offset_left = ((w_avail-((w/svg_scale)*s/initial_width))/2)+left,
                offset_top = (height-(((h/1.1)/svg_scale)*s/initial_width))/2
          }
          
          var t_x = ((-(b[0][0]-svg_translate[0])/svg_scale)*s/initial_width)+offset_left,
              t_y = ((-(b[0][1]-svg_translate[1])/svg_scale)*s/initial_width)+offset_top
              
          var t = [t_x+(s/2),t_y+(((s/initial_width)*initial_height)/2)]
          
          translate = t
          scale = s
          
        } else if (param == "in" || param == "out") {
          
          var b = projection.translate()
          
          if (param == "in") translate = [b[0]+(b[0]-(width/2)),b[1]+(b[1]-(height/2))]
          else if (param == "out") translate = [b[0]+(((width/2)-b[0])/2),b[1]+(((height/2)-b[1])/2)]
        }
        
        // Scale Boundries
        if (scale < zoom_extent[0]) scale = zoom_extent[0]
        else if (scale > zoom_extent[1]) scale = zoom_extent[1]
        // X Boundries
        if (translate[0] > scale/2) translate[0] = scale/2
        else if (translate[0] < width-scale/2) translate[0] = width-scale/2
        // Y Boundries
        if (translate[1] > scale/2) translate[1] = scale/2
        else if (translate[1] < height-scale/2) translate[1] = height-scale/2

        projection.scale(scale).translate(translate);
        zoom_behavior.scale(scale).translate(translate);
        svg_scale = scale/initial_width;
        svg_translate = [translate[0]-(scale/2),translate[1]-(((scale/initial_width)*initial_height)/2)];
        
        if (typeof custom_timing != "number") {
          if (d3.event) {
            if (d3.event.scale) {
              if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
                var zoom_timing = 0
              } else {
                var zoom_timing = timing
              }
            } else {
              var zoom_timing = timing
            }
          } else {
            var zoom_timing = timing*4
          }
        } else var zoom_timing = custom_timing

        if (terrain) update_tiles(zoom_timing);
        
        if (zoom_timing > 0) var viz_transition = d3.selectAll(".viz").transition().duration(zoom_timing)
        else var viz_transition = d3.selectAll(".viz")
        
        viz_transition.attr("transform","translate(" + svg_translate + ")" + "scale(" + svg_scale + ")")
            
      }

      //===================================================================

      function info() {
        
        vizwhiz.tooltip.remove();
        
        if (highlight && data[highlight]) {
            
          var tooltip_data = {}, sub_title = null
          
          if (!clicked) {
            sub_title = "Click for More Info"
          } else {
            tooltip_info.forEach(function(t){
              if (data[highlight][t]) tooltip_data[t] = data[highlight][t]
            })
          }
          
          vizwhiz.tooltip.create({
            "svg": svg,
            "data": tooltip_data,
            "title": data[highlight][text_var],
            "description": sub_title,
            "x": width,
            "y": (scale_height*3)+10,
            "width": info_width,
            "arrow": false
          })
          
        }
        
      }

      function tileUrl(d) {
        return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
      }
      
      function update_tiles(image_timing) {

        var t = projection.translate(),
            s = projection.scale();
            
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
      
    });
    
    return chart;
    
  }


  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------

  chart.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return chart;
  };

  chart.coords = function(x) {
    if (!arguments.length) return coords;
    coords = topojson.object(x, x.objects.munic).geometries;
    shape = {"coordinates": [[]], "type": "Polygon"}
    coords.forEach(function(v,i){
      v.coordinates[0].forEach(function(a){
        shape.coordinates[0].push(a)
      })
    })
    return chart;
  };

  chart.background = function(x,style) {
    if (!arguments.length) return background;
    background = x;
    if (style) {
      land_style = style.land;
      water_color = style.water;
    }
    return chart;
  };
  
  chart.tiles = function(x) {
    if (!arguments.length) return terrain;
    terrain = x;
    return chart;
  };

  chart.highlight = function(x) {
    if (!arguments.length) return highlight;
    highlight = x;
    if (highlight) clicked = true;
    else clicked = false;
    return chart;
  };
  
  chart.value_var = function(x) {
    if (!arguments.length) return value_var;
    value_var = x;
    return chart;
  };
  
  chart.id_var = function(x) {
    if (!arguments.length) return id_var;
    id_var = x;
    return chart;
  };
  
  chart.text_var = function(x) {
    if (!arguments.length) return text_var;
    text_var = x;
    return chart;
  };
  
  chart.tooltip = function(x) {
    if (!arguments.length) return tooltip_info;
    tooltip_info = x;
    return chart;
  };

  //===================================================================


  return chart;
};
