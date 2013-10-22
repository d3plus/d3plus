d3plus.geo_map = function(vars) { 
  
  var default_opacity = 0.50,
      select_opacity = 0.75,
      stroke_width = 1,
      color_gradient = ["#00008f", "#003fff", "#00efff", "#ffdf00", "#ff3000", "#7f0000"],
      projection = null
      gmap_projection = null,
      path = null,
      hover = null,
      dragging = false,
      scale_height = 10,
      scale_padding = 20,
      scale_width = 250,
      info_width = vars.small ? 0 : 300,
      redraw = false
      
  vars.loading_text = vars.format("Loading Geography")
      
  /**********************/
  /* Define Color Scale */
  /**********************/
  vars.data_range = []
  vars.data_extent = [0,0]
  if (vars.data) {
    vars.data_extent = d3.extent(d3.values(vars.data),function(d){
      return d[vars.value_var] && d[vars.value_var] != 0 ? d[vars.value_var] : null
    })
    var step = 0.0
    while(step <= 1) {
      vars.data_range.push((vars.data_extent[0]*Math.pow((vars.data_extent[1]/vars.data_extent[0]),step)))
      step += 0.25
    }
    vars.value_color = d3.scale.log()
      .domain(vars.data_range)
      .interpolate(d3.interpolateRgb)
      .range(color_gradient)
  }
  else {
    vars.data = []
  }
      
  /*******************/
  /* Create Init Map */
  /*******************/
  var map_div = vars.parent.selectAll("div#map").data([vars.data])
  
  map_div.enter().append("div")
    .attr("id","map")
    .style("width",vars.width+"px")
    .style("height",vars.height+"px")
    .style("margin-left",vars.margin.left+"px")
    .style("margin-top",vars.margin.top+"px")
    .each(function(){
      
      /************************/
      /* Initial Map Creation */
      /************************/
      google.maps.visualRefresh = true;
      vars.map = new google.maps.Map(this, {
        zoom: 5,
        center: new google.maps.LatLng(-13.544541, -52.734375),
        mapTypeControl: false,
        panControl: false,
        streetViewControl: false,
        zoomControl: false,
        scrollwheel: vars.scroll_zoom,
        mapTypeId: google.maps.MapTypeId.TERRAIN
      })
      
      google.maps.event.addListener(vars.map,"drag", function(e){
        dragging = true
      })

      // google.maps.event.addListener(vars.map,"dragend", function(){
      //   dragging = false
      // })
      
      var zoomControl = document.createElement('div')
      zoomControl.style.marginLeft = "5px"
      zoomControl.style.marginTop = "5px"
      
      var zoomIn = document.createElement('div')
      zoomIn.id = "zoom_in"
      zoomIn.innerHTML = "+"
      zoomControl.appendChild(zoomIn)
      
      var zoomOut = document.createElement('div')
      zoomOut.id = "zoom_out"
      zoomOut.innerHTML = "-"
      zoomControl.appendChild(zoomOut)
      
      vars.map.controls[google.maps.ControlPosition.LEFT_TOP].push(zoomControl)
      
      //zoom in control click event
      google.maps.event.addDomListener(zoomIn, 'click', function() {
        vars.loading_text = vars.format("Zooming In")
         var currentZoomLevel = vars.map.getZoom();
         if(currentZoomLevel != 21){
           vars.map.setZoom(currentZoomLevel + 1);
          }
       });

      //zoom out control click event
      google.maps.event.addDomListener(zoomOut, 'click', function() {
        vars.loading_text = vars.format("Zooming Out")
         var currentZoomLevel = vars.map.getZoom();
         if(currentZoomLevel != 0){
           vars.map.setZoom(currentZoomLevel - 1);
         }
       });
      
      var tileControl = document.createElement('div')
      tileControl.style.marginRight = "5px"
      
      var roadMap = document.createElement('div')
      roadMap.className = "tile_toggle"
      roadMap.innerHTML = vars.format("roads")
      tileControl.appendChild(roadMap)
      
      var terrain = document.createElement('div')
      terrain.className = "tile_toggle active"
      terrain.innerHTML = vars.format("terrain")
      tileControl.appendChild(terrain)
      
      var satellite = document.createElement('div')
      satellite.className = "tile_toggle"
      satellite.innerHTML = vars.format("satellite")
      tileControl.appendChild(satellite)
      
      var hybrid = document.createElement('div')
      hybrid.className = "tile_toggle"
      hybrid.innerHTML = vars.format("hybrid")
      tileControl.appendChild(hybrid)
      
      vars.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(tileControl)

      google.maps.event.addDomListener(roadMap, 'click', function() {
        d3.selectAll(".tile_toggle").attr("class","tile_toggle")
        this.className = "tile_toggle active"
        vars.map.setMapTypeId(google.maps.MapTypeId.ROADMAP)
      });
      
      google.maps.event.addDomListener(terrain, 'click', function() {
        d3.selectAll(".tile_toggle").attr("class","tile_toggle")
        this.className = "tile_toggle active"
        vars.map.setMapTypeId(google.maps.MapTypeId.TERRAIN)
      });
      
      google.maps.event.addDomListener(satellite, 'click', function() {
        d3.selectAll(".tile_toggle").attr("class","tile_toggle")
        this.className = "tile_toggle active"
        vars.map.setMapTypeId(google.maps.MapTypeId.SATELLITE)
      });
      
      google.maps.event.addDomListener(hybrid, 'click', function() {
        d3.selectAll(".tile_toggle").attr("class","tile_toggle")
        this.className = "tile_toggle active"
        vars.map.setMapTypeId(google.maps.MapTypeId.HYBRID)
      });
  
      scale()
  
      vars.overlay = new google.maps.OverlayView();
  
      // Add the container when the overlay is added to the map.
      vars.overlay.onAdd = function() {
        
        vars.zoom = vars.map.zoom
    
        var layer = d3.select(this.getPanes().overlayMouseTarget).append("div")

        path_group = layer.append("svg")
            .attr("id","gmap_overlay")
            .append("g")
            
        path_defs = path_group.append("defs")
        
        path_group.append("rect")
          .attr("class","overlay")
          .attr("width",20000)
          .attr("height",20000)
          .attr("fill","transparent")
          .on(d3plus.evt.move, function(d) {
            if (vars.highlight && !dragging && !d3plus.ie) {
              d3.select(this).style("cursor","-moz-zoom-out")
              d3.select(this).style("cursor","-webkit-zoom-out")
            }
          })
          .on(d3plus.evt.click, function(d) {
            if (vars.highlight && !dragging) zoom("reset")
          })

        vars.overlay.draw = function() {
          
          redraw = true
          
          vars.loader.select("div").text(vars.loading_text)
          vars.loader.style("display","block")
          
          var self = this
          
          setTimeout(function(){

            projection = self.getProjection()
            gmap_projection = function (coordinates) {
              var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
              var pixelCoordinates = projection.fromLatLngToDivPixel(googleCoordinates);
              return [pixelCoordinates.x + 10000, pixelCoordinates.y + 10000];
            }
      
            path = d3.geo.path().projection(gmap_projection);

            var paths = path_group.selectAll("path")
              .data(vars.coords)
        
            paths.enter().append("path")
                .attr("id",function(d) { 
                  return "path"+d.id
                } )
                .attr("d", path)
                .attr("opacity",default_opacity)
                .call(color_paths)
                .attr("vector-effect","non-scaling-stroke")

            if (vars.map.zoom != vars.zoom) {
              paths.attr("d",path)
            }
            
            paths
              .attr("opacity",default_opacity)
              .call(color_paths)
              .on(d3plus.evt.over, function(d){
                hover = d.id
                if (vars.highlight != d.id) {
                  d3.select(this)
                    .style("cursor","pointer")
                    .attr("opacity",select_opacity)
                  if (!d3plus.ie) {
                    d3.select(this)
                      .style("cursor","-moz-zoom-in")
                      .style("cursor","-webkit-zoom-in")
                  }
                }
                if (!vars.highlight) {
                  update()
                }
              })
              .on(d3plus.evt.out, function(d){
                hover = null
                if (vars.highlight != d.id) {
                  d3.select(this).attr("opacity",default_opacity)
                }
                if (!vars.highlight) {
                  update()
                }
              })
              .on(d3plus.evt.click, function(d) {
                if (!dragging) {
                  vars.loading_text = vars.format("Calculating Coordinates")
                  if (vars.highlight == d.id) {
                    zoom("reset")
                  } 
                  else {
                    if (vars.highlight) {
                      var temp = vars.highlight
                      vars.highlight = null
                      d3.select("path#path"+temp).call(color_paths);
                    }
                    vars.highlight = d.id;
                    d3.select(this).call(color_paths);
                    zoom(d3.select(this).datum());
                  }
                  update();
                }
                dragging = false
              })
              
            vars.zoom = vars.map.zoom
            scale_update()
            update()
            
            if (vars.coord_change) {
              if (vars.highlight) var z = d3.select("path#path"+vars.highlight).datum()
              else var z = "reset"
              vars.loading_text = vars.format("Calculating Coordinates")
              zoom(z)
              vars.coord_change = false
            }
          
            vars.loader.style("display","none")

          },5)
        
        }
      }

      // Bind our overlay to the map…
      vars.overlay.setMap(vars.map)
  
    })
  
  map_div
    .style("width",vars.width+"px")
    .style("height",vars.height+"px")
    .style("margin-left",vars.margin.left+"px")
    .style("margin-top",vars.margin.top+"px")
  
  setTimeout(function(){
    var c = vars.map.getCenter()
    google.maps.event.trigger(vars.map, "resize")
    vars.map.panTo(c)
  },d3plus.timing)
  
  if (!redraw && vars.overlay.draw) vars.overlay.draw()
  
  function zoom(d) {
    
    if (d == "reset") {
      d = vars.boundaries
      if (vars.highlight) {
        var temp = vars.highlight;
        vars.highlight = null;
        d3.select("#path"+temp).call(color_paths);
        update()
      }
    }
    
    var bounds = d3.geo.bounds(d),
        gbounds = new google.maps.LatLngBounds()
    
    if (info_width > 0 && vars.highlight) {
      bounds[1][0] =  bounds[1][0]+(bounds[1][0]-bounds[0][0])
    }
        
    gbounds.extend(new google.maps.LatLng(bounds[0][1],bounds[0][0]))
    gbounds.extend(new google.maps.LatLng(bounds[1][1],bounds[1][0]))
    
    vars.map.fitBounds(gbounds)
  }
  
  function color_paths(p) {
    
    path_defs.selectAll("#stroke_clip").remove();
    
    p
      .attr("fill",function(d){ 
        if (d.id == vars.highlight) return "none";
        else if (!vars.data[d.id]) return "#888888";
        else return vars.data[d.id][vars.value_var] ? vars.value_color(vars.data[d.id][vars.value_var]) : "#888888"
      })
      .attr("stroke-width",function(d) {
        if (d.id == vars.highlight) return 10;
        else return stroke_width;
      })
      .attr("stroke",function(d) {
        if (d.id == vars.highlight) {
          if (!vars.data[d.id]) return "#888"
          return vars.data[d.id][vars.value_var] ? vars.value_color(vars.data[d.id][vars.value_var]) : "#888888";
        }
        else return "white";
      })
      .attr("opacity",function(d){
        if (d.id == vars.highlight) return select_opacity;
        else return default_opacity;
      })
      .each(function(d){
        if (d.id == vars.highlight) {
          path_defs.append("clipPath")
            .attr("id","stroke_clip")
            .append("use")
              .attr("xlink:href","#path"+vars.highlight)
          d3.select(this).attr("clip-path","url(#stroke_clip)")
        }
        else {
          d3.select(this).attr("clip-path","none")
        }
      })
  }
  
  function update() {
    
    d3plus.tooltip.remove(vars.type);
    
    if (!vars.small && (hover || vars.highlight)) {
      
      var id = vars.highlight ? vars.highlight : hover
      
      var data = vars.data[id]
      
      if (data && data[vars.value_var]) {
        var color = vars.value_color(data[vars.value_var])
      }
      else {
        var color = "#888"
      }
      
      make_tooltip = function(html) {
    
        d3plus.tooltip.remove(vars.type);
        
        if (typeof html == "string") html = "<br>"+html

        d3plus.tooltip.create({
          "data": tooltip_data,
          "title": find_variable(id,vars.text_var),
          "id": vars.type,
          "icon": find_variable(id,"icon"),
          "style": vars.icon_style,
          "color": color,
          "footer": footer,
          "x": vars.width-info_width-5+vars.margin.left,
          "y": vars.margin.top+5,
          "fixed": true,
          "width": info_width,
          "html": html,
          "parent": vars.parent,
          "mouseevents": true,
          "background": vars.background,
          "max_height": vars.height-47
        })
        
      }
      
      if (!data || !data[vars.value_var]) {
        var footer = vars.format("No Data Available")
        make_tooltip(null)
      }
      else if (!vars.highlight) {
        var tooltip_data = get_tooltip_data(id,"short"),
            footer = footer_text()
        make_tooltip(null)
      }
      else {
        var tooltip_data = get_tooltip_data(id,"long"),
            footer = vars.footer

        var html = vars.click_function ? vars.click_function(id) : null

        if (typeof html == "string") make_tooltip(html)
        else if (html.url && html.callback) {
          d3.json(html.url,function(data){
            html = html.callback(data)
            make_tooltip(html)
          })
        }
            
      }
      
    }
    
  }
  
  function scale() {
    
    var scale_svg = vars.parent.selectAll("svg#scale").data(["scale"])
    
    var scale_enter = scale_svg.enter().append("svg")
      .attr("id","scale")
      .style("left",(30+vars.margin.left)+"px")
      .style("top",(5+vars.margin.top)+"px")
      .attr("width", scale_width+"px")
      .attr("height", "45px")
      
    var scale_defs = scale_enter.append("defs")
    
    var gradient = scale_defs
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")
      .attr("spreadMethod", "pad");
     
    vars.data_range.forEach(function(v,i){
      gradient.append("stop")
        .attr("offset",Math.round((i/(vars.data_range.length-1))*100)+"%")
        .attr("stop-color", vars.value_color(v))
        .attr("stop-opacity", 1)
    })
  
    var scale = scale_enter.append('g')
      .attr('class','scale')
      .style("opacity",0)
    
    var shadow = scale_defs.append("filter")
      .attr("id", "shadow")
      .attr("x", "-50%")
      .attr("y", "0")
      .attr("width", "200%")
      .attr("height", "200%");
    
    shadow.append("feGaussianBlur")
      .attr("in","SourceAlpha")
      .attr("result","blurOut")
      .attr("stdDeviation","3")
    
    shadow.append("feOffset")
      .attr("in","blurOut")
      .attr("result","the-shadow")
      .attr("dx","0")
      .attr("dy","1")
    
    shadow.append("feColorMatrix")
      .attr("in","the-shadow")
      .attr("result","colorOut")
      .attr("type","matrix")
      .attr("values","0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0")
    
    shadow.append("feBlend")
      .attr("in","SourceGraphic")
      .attr("in2","colorOut")
      .attr("mode","normal")
  
    scale.append("rect")
      .attr("id","scalebg")
      .attr("width", scale_width+"px")
      .attr("height", "45px")
      .attr("fill","#ffffff")
      .attr("opacity",0.75)
      .attr("filter","url(#shadow)")
      .attr("shape-rendering","crispEdges")
      
    scale.append("text")
      .attr("id","scale_title")
      .attr("x",(scale_width/2)+"px")
      .attr("y","0px")
      .attr("dy","1.25em")
      .attr("text-anchor","middle")
      .attr("fill","#333")
      .attr("font-size","10px")
      .attr("font-family",vars.font)
      .style("font-weight",vars.font_weight)
  
    scale.append("rect")
      .attr("id","scalecolor")
      .attr("x",scale_padding+"px")
      .attr("y",(scale_height*1.75)+"px")
      .attr("width", (scale_width-(scale_padding*2))+"px")
      .attr("height", scale_height*0.75+"px")
      .style("fill", "url(#gradient)")
     
    vars.data_range.forEach(function(v,i){
      if (i == vars.data_range.length-1) {
        var x = scale_padding+Math.round((i/(vars.data_range.length-1))*(scale_width-(scale_padding*2)))-1
      } else if (i != 0) {
        var x = scale_padding+Math.round((i/(vars.data_range.length-1))*(scale_width-(scale_padding*2)))-1
      } else {
        var x = scale_padding+Math.round((i/(vars.data_range.length-1))*(scale_width-(scale_padding*2)))
      }
      scale.append("rect")
        .attr("id","scaletick_"+i)
        .attr("x", x+"px")
        .attr("y", (scale_height*1.75)+"px")
        .attr("width", 1)
        .attr("height", ((scale_height*0.75)+3)+"px")
        .style("fill", "#333")
        .attr("opacity",0.25)
      
      scale.append("text")
        .attr("id","scale_"+i)
        .attr("x",x+"px")
        .attr("y", (scale_height*2.75)+"px")
        .attr("dy","1em")
        .attr("text-anchor","middle")
        .attr("fill","#333")
        .attr("font-family",vars.font)
        .style("font-weight",vars.font_weight)
        .attr("font-size","10px")
    })
    
  }
  
  function scale_update() {
    if (!vars.data_extent[0] || Object.keys(vars.data).length < 2 || vars.small) {
      d3.select("g.scale").transition().duration(d3plus.timing)
        .style("opacity",0)
    }
    else {
      var max = 0
      vars.data_range.forEach(function(v,i){
        var elem = d3.select("g.scale").select("text#scale_"+i)
        elem.text(vars.format(v,vars.value_var))
        var w = elem.node().getBBox().width
        if (w > max) max = w
      })
    
      max += 10
      
      d3.select("g.scale").transition().duration(d3plus.timing)
        .style("opacity",1)
      
      d3.select("svg#scale").transition().duration(d3plus.timing)
        .attr("width",max*vars.data_range.length+"px")
        .style("left",(30+vars.margin.left)+"px")
        .style("top",(5+vars.margin.top)+"px")
      
      d3.select("g.scale").select("rect#scalebg").transition().duration(d3plus.timing)
        .attr("width",max*vars.data_range.length+"px")
      
      d3.select("g.scale").select("rect#scalecolor").transition().duration(d3plus.timing)
        .attr("x",max/2+"px")
        .attr("width",max*(vars.data_range.length-1)+"px")
      
      d3.select("g.scale").select("text#scale_title").transition().duration(d3plus.timing)
        .attr("x",(max*vars.data_range.length)/2+"px")
        .text(vars.format(vars.value_var))
      
      vars.data_range.forEach(function(v,i){
      
        if (i == vars.data_range.length-1) {
          var x = (max/2)+Math.round((i/(vars.data_range.length-1))*(max*vars.data_range.length-(max)))-1
        } 
        else if (i != 0) {
          var x = (max/2)+Math.round((i/(vars.data_range.length-1))*(max*vars.data_range.length-(max)))-1
        } 
        else {
          var x = (max/2)+Math.round((i/(vars.data_range.length-1))*(max*vars.data_range.length-(max)))
        }
      
        d3.select("g.scale").select("rect#scaletick_"+i).transition().duration(d3plus.timing)
          .attr("x",x+"px")
      
        d3.select("g.scale").select("text#scale_"+i).transition().duration(d3plus.timing)
          .attr("x",x+"px")
      })
    
    }
    
  }
  
};
