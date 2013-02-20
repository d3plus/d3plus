vizwhiz.viz.network = function() {

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
      layer = {},
      terrain = true,
      background = null,
      default_opacity = 0.5,
      select_opacity = 0.75,
      land_style = {"fill": "#375629"},
      water_color = "#153D72";

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
          tile = d3.geo.tile().size([width, height]);

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
            zoom("reset")
          }
        });
        
      var country_group = viz_enter.append('g')
        .attr('class','countries');
        
      // Create group outside of zoom group for info panel
      // var info_group = svg_enter.append("g")
      //   .attr("class","info")
        
      // Create Zoom Controls div on svg_enter
      // var zoom_div = svg.enter().append("div")
      //   .attr("id","zoom_controls")
      //   
      // zoom_div.append("div")
      //   .attr("id","zoom_in")
      //   .attr("unselectable","on")
      //   .on(vizwhiz.evt.click,function(){ zoom("in") })
      //   .text("+")
      //   
      // zoom_div.append("div")
      //   .attr("id","zoom_out")
      //   .attr("unselectable","on")
      //   .on(vizwhiz.evt.click,function(){ zoom("out") })
      //   .text("-")
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // New nodes and links enter, initialize them here
      //-------------------------------------------------------------------

      var country = country_group.selectAll("path.country")
        .data(topojson.object(layer.countries, layer.countries.objects.munic).geometries)
        
      country.enter().append("path")
        .attr("class","country")
        .attr("id",function(d) { return "path"+d.id } )
        .attr("d",path)
        .attr("fill","red")
        .attr("stroke","black")
        .attr("stroke-width",0.5)
        .attr("opacity",default_opacity)
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
            zoom("reset")
          } else {
            if (highlight) d3.select("#path"+highlight.id).attr("opacity",default_opacity)
            highlight = d;
            d3.select("#path"+highlight.id).attr("opacity",select_opacity)
            clicked = true;
            zoom(highlight);
          }
        })
      
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
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Zoom Function
      //-------------------------------------------------------------------
      
      function zoom(param) {
        
        var translate = zoom_behavior.translate(),
            scale = zoom_behavior.scale(),
            zoom_extent = zoom_behavior.scaleExtent(),
            svg_scale = scale/width,
            svg_translate = [translate[0]-(scale/2),translate[1]-(scale/2)+(200*svg_scale)]
            
        if (param == "reset") {
            
          scale = width
          translate = [(scale/2),(scale/2)-(200*scale/width)]
            
        } else if (param) {
          var b = path.bounds(param),
              w = b[1][0] - b[0][0],
              h = b[1][1] - b[0][1],
              c = path.centroid(param),
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
        svg_scale = scale/width;
        svg_translate = [translate[0]-(scale/2),translate[1]-(scale/2)+(200*svg_scale)];
            
        if (d3.event.scale) {
          if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
            zoom_timing = 0
          } else {
            zoom_timing = timing
          }
        } else {
          zoom_timing = timing*4
        }
        
        if (terrain) update_tiles();
        
        d3.selectAll(".viz").transition().duration(zoom_timing)
          .attr("transform","translate(" + svg_translate + ")" + "scale(" + svg_scale + ")")
        
        d3.selectAll("path").transition().duration(zoom_timing)
          .attr("stroke-width",0.5/svg_scale)
            
      }

      function zoomer(direction) {
        
        // If d3 zoom event is detected, use it!
        if(d3.event.scale) {
          evt_scale = d3.event.scale
          translate = d3.event.translate
        } else {
          if (direction == "in") {
            if (zoom_behavior.scale() > zoom_extent[1]/2) multiplier = zoom_extent[1]/zoom_behavior.scale()
            else multiplier = 2
          } else if (direction == "out") {
            if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
            else multiplier = 0.5
          } else if (connections[direction]) {
            var x_bounds = [scale.x(connections[direction].extent.x[0]),scale.x(connections[direction].extent.x[1])],
                y_bounds = [scale.y(connections[direction].extent.y[0]),scale.y(connections[direction].extent.y[1])]
                
            if (x_bounds[1] > (width-info_width-5)) var offset_left = info_width+32
            else var offset_left = 0
                
            var w_zoom = (width-info_width-10)/(x_bounds[1]-x_bounds[0]),
                h_zoom = height/(y_bounds[1]-y_bounds[0])
            
            if (w_zoom < h_zoom) {
              x_bounds = [x_bounds[0]-(max_size*2),x_bounds[1]+(max_size*2)]
              evt_scale = (width-info_width-10)/(x_bounds[1]-x_bounds[0])
              if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
              offset_x = -(x_bounds[0]*evt_scale)
              offset_y = -(y_bounds[0]*evt_scale)+((height-((y_bounds[1]-y_bounds[0])*evt_scale))/2)
            } else {
              y_bounds = [y_bounds[0]-(max_size*2),y_bounds[1]+(max_size*2)]
              evt_scale = height/(y_bounds[1]-y_bounds[0])
              if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
              offset_x = -(x_bounds[0]*evt_scale)+(((width-info_width-10)-((x_bounds[1]-x_bounds[0])*evt_scale))/2)
              offset_y = -(y_bounds[0]*evt_scale)
            }

            translate = [offset_x+offset_left,offset_y]
          } else if (direction == "reset") {
            translate = [0,0]
            evt_scale = 1
          }
          
          if (direction == "in" || direction == "out") {
            var trans = d3.select("g.viz")[0][0].getAttribute('transform')
            if (trans) {
              trans = trans.split('(')
              var coords = trans[1].split(')')
              coords = coords[0].replace(' ',',')
              coords = coords.substring(0,trans[1].length-6).split(',')
              offset_x = parseFloat(coords[0])
              offset_y = coords.length == 2 ? parseFloat(coords[1]) : parseFloat(coords[0])
              zoom_var = parseFloat(trans[2].substring(0,trans[2].length-1))
            } else {
              offset_x = 0
              offset_y = 0
              zoom_var = 1
            }
            if ((multiplier > 0.5 && multiplier <= 1) && direction == "out") {
              offset_x = 0
              offset_y = 0
            } else {
              offset_x = (width/2)-(((width/2)-offset_x)*multiplier)
              offset_y = (height/2)-(((height/2)-offset_y)*multiplier)
            }
          
            translate = [offset_x,offset_y]
            evt_scale = zoom_var*multiplier
          }
        
        }
      }

      //===================================================================

      function tileUrl(d) {
        return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
      }
      
      function update_tiles() {

        var t = projection.translate(),
            s = projection.scale(),
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0);
            rz = Math.floor(z),
            ts = 256 * Math.pow(2, z - rz);
          
        var tile_origin = [s / 2 - t[0], s / 2 - t[1]];
          
        var tiles = tile.scale(s).translate(t)();
        
        var image = tile_group.selectAll("image.tile")
          .data(tiles, function(d) { return d; });

        image.enter().append('image')
          .attr('class', 'tile')
          .attr('xlink:href', tileUrl);
          
        image.transition().duration(zoom_timing)
          .attr("width", Math.ceil(tiles.scale))
          .attr("height", Math.ceil(tiles.scale))
          .attr("x", function(d) { return Math.round((d[0] + tiles.translate[0]) * tiles.scale); })
          .attr("y", function(d) { return Math.round((d[1] + tiles.translate[1]) * tiles.scale); });
          
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

  chart.layer = function(n,x) {
    if (!arguments.length) return layer[n];
    layer[n] = x;
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