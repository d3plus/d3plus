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
      zoom_timing = null,
      coords = null,
      shape = null,
      terrain = true,
      background = null,
      default_opacity = 0.25,
      select_opacity = 0.75,
      land_style = {"fill": "#F1EEE8"},
      water_color = "#B5D0D0",
      stroke_width = 1,
      color_gradient = ["#00008f", "#003fff", "#00efff", "#ffdf00", "#ff3000", "#7f0000"];

  //===================================================================


  function chart(selection) {
    selection.each(function(data, i) {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Private Variables
      //-------------------------------------------------------------------
      
      var this_selection = this,
          dragging = false,
          info_width = 300,
          projection = d3.geo.mercator()
            .scale(width)
            .translate([width/2,height/2]),
          path = d3.geo.path().projection(projection),
          zoom_behavior = d3.behavior.zoom()
            .scale(projection.scale())
            .scaleExtent([width, 1 << 23])
            .translate(projection.translate())
            .on("zoom",zoom),
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
        var value_color = d3.scale.log()
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
        
      if (background) {
            
        svg_enter.append("rect")
          .attr("width",width)
          .attr("height",height)
          .attr("fill",water_color);
          
        svg_enter.append("g")
          .attr("class","viz")
            .append("path")
              .datum(topojson.object(background, background.objects.land))
              .attr("id","land")
              .attr("d",path)
              .attr(land_style)
            
      }
          
      if (terrain) {
        var tile_group = svg_enter.append('g')
          .attr('class','tiles');
          
        update_tiles();
      }
        
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
            d3.select("#path"+highlight.id).attr("opacity",default_opacity)
            highlight = null;
            clicked = false;
            zoom(shape)
          }
        });
        
      var coord_group = viz_enter.append('g')
        .attr('class','paths');
        
      var defs = coord_group.append("defs")
        
      // Create group outside of zoom group for info panel
      var info_group = svg_enter.append("g")
        .attr("class","info")
        
      // Create Zoom Controls div on svg_enter
      var zoom_div = svg.enter().append("div")
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

      var coord = coord_group.selectAll("path")
        .data(coords)
        
      coord.enter().append("path")
        .attr("id",function(d) { return "path"+d.id } )
        .attr("d",path)
        .attr("stroke-width",stroke_width)
        .attr("stroke","white")
        .attr("vector-effect","non-scaling-stroke")
        .attr("opacity",default_opacity)
        // .attr("clip-path",function(d) { return "url(#clip-path"+d.id+")" } )
        // .each(function(d){
        //   defs.append("clipPath")
        //     .attr("id",function(dd) { return "clip-path"+d.id } )
        //     .append("use")
        //       .attr("xlink:href",function(dd) { return "#path"+d.id } )
        // })
        .on(vizwhiz.evt.over, function(d) {
          if (highlight != d) d3.select(this).attr("opacity",select_opacity);
        })
        .on(vizwhiz.evt.out, function(d) {
          if (highlight != d) d3.select(this).attr("opacity",default_opacity);
        })
        .on(vizwhiz.evt.click, function(d) {
          if (highlight == d) {
            d3.select("#path"+highlight.id).attr("opacity",default_opacity)
            highlight = null;
            clicked = false;
            zoom(shape);
          } else {
            if (highlight) d3.select("#path"+highlight.id).attr("opacity",default_opacity)
            highlight = d;
            d3.select("#path"+highlight.id).attr("opacity",select_opacity)
            clicked = true;
            zoom(highlight);
          }
        })
        .call(color_paths);
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update, for things that are already in existance
      //-------------------------------------------------------------------

      // node.transition().duration(timing)
      //   .call(size_nodes)
      //   .call(color_nodes);
      //   
      // svg.transition().duration(timing)
      //   .attr("width", width)
      //   .attr("height", height);
      //   
      // d3.select('.overlay').transition().duration(timing)
      //   .attr("width", viz_width)
      //   .attr("height", viz_height);
          
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Exit, for nodes and links that are being removed
      //-------------------------------------------------------------------

      // node.exit().remove()

      //===================================================================
      
      zoom(shape);
      
      function color_paths(p) {
        p
          .attr("fill",function(d){ 
            if (!data) return "#888888"
            else return data[d.id] ? value_color(data[d.id][value_var]) : "#eeeeee"
          });
      }
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Zoom Function
      //-------------------------------------------------------------------
      
      function zoom(param) {
        
        var translate = zoom_behavior.translate(),
            zoom_extent = zoom_behavior.scaleExtent()
            
        var scale = zoom_behavior.scale()
        if (param == "in") var scale = ((scale/width)*2)*width
        else if (param == "out") var scale = ((scale/width)*0.5)*width
        
        var svg_scale = scale/width,
            svg_translate = [translate[0]-(scale/2),translate[1]-(scale/2)+(200*svg_scale)]
            
        old_scale = projection.scale()
        old_translate = projection.translate()
            
        if (param.coordinates) {
          
          var b = path.bounds(param),
              w = b[1][0] - b[0][0],
              h = b[1][1] - b[0][1],
              s_width = scale/w,
              s_height = (height*(scale/width))/h
          if (s_width < s_height) {
            var s = s_width*width,
                offset_left = 0,
                offset_top = (height-((h/svg_scale)*s/width))/2
          } else {
            var s = s_height*width,
                offset_left = (width-((w/svg_scale)*s/width))/2,
                offset_top = 0
          }
          
          var t_x = ((-(b[0][0]-svg_translate[0])/svg_scale)*s/width)+offset_left,
              t_y = ((-(b[0][1]-svg_translate[1])/svg_scale)*s/width)+offset_top
              
          var t = [t_x+(s/2),t_y+(s/2)-(200*s/width)]
          
          translate = t
          scale = s
          
        } else if (param == "in" || param == "out") {
          
          var b = projection.translate()
          
          if (param == "in") translate = [b[0]+(b[0]-(width/2)),b[1]+(b[1]-(height/2))]
          else if (param == "out") translate = [b[0]+(((width/2)-b[0])/2),b[1]+(((height/2)-b[1])/2)]
        }
        // if (d3.event.sourceEvent) console.log(d3.event.sourceEvent.layerX)
        // console.log(projection.translate()[0],translate[0],svg_translate[0],width,scale,svg_scale)
        // console.log(svg_translate[0],translate[0],(width*svg_scale)/2)
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
        svg_scale = scale/width;
        svg_translate = [translate[0]-(scale/2),translate[1]-(scale/2)+(200*svg_scale)];
            
        if (d3.event) {
          if (d3.event.scale) {
            if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
              zoom_timing = 0
            } else {
              zoom_timing = timing
            }
          } else {
            zoom_timing = timing
          }
        } else {
          zoom_timing = timing*4
        }

        if (terrain) update_tiles();
        
        if (zoom_timing > 0) {
          d3.selectAll(".viz").transition().duration(zoom_timing)
            .attr("transform","translate(" + svg_translate + ")" + "scale(" + svg_scale + ")")
        } else {
          d3.selectAll(".viz")
            .attr("transform","translate(" + svg_translate + ")" + "scale(" + svg_scale + ")")
        }
            
      }

      //===================================================================

      function tileUrl(d) {
        return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
      }
      
      function update_tiles() {

        var t = projection.translate(),
            s = projection.scale();
          
        var tiles = tile.scale(s).translate(t)(),
            old_tiles = tile.scale(old_scale).translate(old_translate)()
        
        var image = tile_group.selectAll("image.tile")
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

        if (zoom_timing > 0) {
          image.transition().duration(zoom_timing)
            .attr("opacity",1)
            .attr("width", Math.ceil(tiles.scale))
            .attr("height", Math.ceil(tiles.scale))
            .attr("x", function(d) { return Math.ceil((d[0] + tiles.translate[0]) * tiles.scale); })
            .attr("y", function(d) { return Math.ceil((d[1] + tiles.translate[1]) * tiles.scale); });
          image.exit().remove();
        } else {
          image
            .attr("opacity",1)
            .attr("width", Math.ceil(tiles.scale))
            .attr("height", Math.ceil(tiles.scale))
            .attr("x", function(d) { return Math.ceil((d[0] + tiles.translate[0]) * tiles.scale); })
            .attr("y", function(d) { return Math.ceil((d[1] + tiles.translate[1]) * tiles.scale); });
          
          image.exit().remove();
            
        }
          
          
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

  chart.background = function(x) {
    if (!arguments.length) return background;
    background = x;
    return chart;
  };
  
  chart.land = function(x) {
    if (!arguments.length) return land_style;
    land_style = x;
    return chart;
  };
  
  chart.water = function(x) {
    if (!arguments.length) return water_color;
    water_color = x;
    return chart;
  };
  
  chart.terrain = function(x) {
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

  //===================================================================


  return chart;
};