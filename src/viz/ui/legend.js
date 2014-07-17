//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//------------------------------------------------------------------------------
d3plus.ui.legend = function(vars) {

  var key_display = true,
      square_size = 0,
      key = vars.color.value
    , colorName = vars.color.value || "d3plus_color"

  if (key && !vars.small && vars.legend.value) {

    if (!vars.color.scale) {

      if ( vars.dev.value ) d3plus.console.time("grouping data by colors")

      if ( vars.nodes.value && d3plus.visualization[vars.type.value].requirements.indexOf("nodes") >= 0 ) {
        var data = vars.nodes.restriced || vars.nodes.value
        if ( vars.data.app.length ) {
          for ( var i = 0 ; i < data.length ; i++ ) {
            var appData = vars.data.app.filter(function(a){
              return a[vars.id.value] === data[i][vars.id.value]
            })
            if (appData.length) {
              data[i] = d3plus.object.merge(data[i],appData[0])
            }
          }
        }
      }
      else {
        var data = vars.data.app
      }

      for ( var z = 0 ; z < data.length ; z++ ) {

        d = data[z]

        for ( var i = 0 ; i < vars.id.nesting.length ; i++ ) {

          var colorKey = vars.id.nesting[i]

          if ( !(colorKey in d) ) {
            var nextKey = vars.id.nesting[ i + 1 ]
            d[colorKey] = d3plus.variable.value( vars , d[nextKey] , colorKey , nextKey )
          }

        }

      }

      var colorFunction = function( d ){
            return d3plus.variable.color( vars , d , vars.id.nesting[colorDepth] )
          }

      for ( var i = 0 ; i < vars.id.nesting.length ; i++ ) {

        var colorDepth = i
          , colorKey   = vars.id.nesting[i]

        var uniqueIDs = d3plus.util.uniques( data , colorKey )
          , uniqueColors = d3plus.util.uniques( data , colorFunction )

        if ( uniqueIDs.length === uniqueColors.length && uniqueColors.length > 1 ) {
          break
        }

      }

      var colors = d3plus.data.nest( vars , data , [ colorFunction ] , [] )

      for ( var z = 0 ; z < colors.length ; z++ ) {

        d = colors[z]

        var nextKey = vars.id.nesting[ colorDepth + 1 ]

        d[colorKey] = d[colorKey]
          || d3plus.variable.value( vars , d[nextKey] , colorKey , nextKey )

        d[colorName] = d[colorName]
          || d3plus.variable.color( vars , d , colorKey )

        d.d3plus.colorDepth = colorDepth

      }

      if ( vars.dev.value ) d3plus.console.timeEnd("grouping data by color")

      var available_width = vars.width.value

      square_size = vars.legend.size

      var key_width = square_size*colors.length+vars.ui.padding*(colors.length+1)

      if (square_size instanceof Array) {

        if ( vars.dev.value ) d3plus.console.time("calculating legend size")

        for (var i = square_size[1]; i >= square_size[0]; i--) {
          key_width = i*colors.length+vars.ui.padding*(colors.length+1)
          if (available_width >= key_width) {
            square_size = i
            break;
          }
        }

        if ( vars.dev.value ) d3plus.console.timeEnd("calculating legend size")

      }
      else if (typeof square_size != "number" && square_size !== false) {
        square_size = 30
      }

      if (available_width < key_width || colors.length == 1) {
        key_display = false
      }
      else {

        key_width -= vars.ui.padding*2

        if ( vars.dev.value ) d3plus.console.time("sorting legend")

        var order = vars[vars.legend.order.value].value

        d3plus.array.sort( colors , order , vars.legend.order.sort.value
                         , colorName , vars )

        if ( vars.dev.value ) d3plus.console.timeEnd("sorting legend")

        if ( vars.dev.value ) d3plus.console.time("drawing legend")

        if (vars.legend.align == "start") {
          var start_x = vars.ui.padding
        }
        else if (vars.legend.align == "end") {
          var start_x = available_width - vars.ui.padding - key_width
        }
        else {
          var start_x = available_width/2 - key_width/2
        }

        vars.g.legend.selectAll("g.d3plus_scale")
          .transition().duration(vars.draw.timing)
          .attr("opacity",0)
          .remove()

        var keys = vars.g.legend.selectAll("g.d3plus_color")
          .data(colors,function(d){
            return d[vars.id.nesting[d.d3plus.colorDepth]]
          })

        function position(group) {

          group
            .attr("transform",function(g,i){
              var x = start_x + (i*(vars.ui.padding+square_size))
              return "translate("+x+","+vars.ui.padding+")"
            })

        }

        var key_enter = keys.enter().append("g")
          .attr("class","d3plus_color")
          .attr("opacity",0)
          .call(position)

        function style(rect) {

          rect
            .attr("width",square_size)
            .attr("height",square_size)
            .attr("fill",function(g){

              d3.select(this.parentNode).selectAll("text").remove()

              var icon = d3plus.variable.value( vars , g , vars.icon.value , vars.id.nesting[g.d3plus.depth] )
                , color = d3plus.variable.color( vars , g , vars.id.nesting[g.d3plus.depth] )

              if (icon) {

                var short_url = d3plus.string.strip(icon+"_"+color)

                var pattern = vars.defs.selectAll("pattern#"+short_url)
                  .data([short_url])

                if (typeof vars.icon.style.value == "string") {
                  var icon_style = vars.icon.style.value
                }
                else if (typeof vars.icon.style.value == "object" && vars.icon.style.value[vars.id.nesting[colorDepth]]) {
                  var icon_style = vars.icon.style.value[vars.id.nesting[colorDepth]]
                }
                else {
                  var icon_style = "default"
                }

                var color = icon_style == "knockout" ? color : "none"

                pattern.select("rect").transition().duration(vars.draw.timing)
                  .attr("fill",color)
                  .attr("width",square_size)
                  .attr("height",square_size)

                pattern.select("image").transition().duration(vars.draw.timing)
                  .attr("width",square_size)
                  .attr("height",square_size)

                var pattern_enter = pattern.enter().append("pattern")
                  .attr("id",short_url)
                  .attr("width",square_size)
                  .attr("height",square_size)

                pattern_enter.append("rect")
                  .attr("fill",color)
                  .attr("width",square_size)
                  .attr("height",square_size)

                pattern_enter.append("image")
                  .attr("xlink:href",icon)
                  .attr("width",square_size)
                  .attr("height",square_size)
                  .each(function(d){

                    if (icon.indexOf("/") == 0 || icon.indexOf(window.location.hostname) >= 0) {

                      d3plus.util.dataurl(icon,function(base64){

                        pattern.select("image")
                          .attr("xlink:href",base64)

                      })

                    }
                    else {

                      pattern.select("image")
                        .attr("xlink:href",icon)

                    }

                  })

                return "url(#"+short_url+")"
              }
              else {

                var text = d3.select(this.parentNode).append("text")

                text
                  .attr("font-size",vars.legend.font.size)
                  .attr("font-weight",vars.legend.font.weight)
                  .attr("font-family",vars.legend.font.family.value)
                  .attr("text-anchor","start")
                  .attr("fill",d3plus.color.text(color))
                  .attr("x",0)
                  .attr("y",0)
                  .each(function(t){

                    var text = d3plus.variable.text( vars , g , g.d3plus.depth )

                    if (text.length === 1 && text[0].length) {

                      d3plus.textwrap()
                        .container( d3.select(this) )
                        .height( square_size - vars.ui.padding * 2 )
                        .resize( vars.labels.resize.value )
                        .text( text[0] )
                        .width( square_size - vars.ui.padding * 2 )
                        .draw()

                    }

                  })
                  .attr("y",function(t){
                    var h = this.getBBox().height,
                        diff = parseFloat(d3.select(this).style("font-size"),10)/5
                    return square_size/2 - h/2 - diff/2
                  })
                  .selectAll("tspan")
                    .attr("x",function(t){
                      var w = this.getComputedTextLength()
                      return square_size/2 - w/2
                    })

                if (text.select("tspan").empty()) {
                  text.remove()
                }

                return color
              }

            })

        }

        key_enter
          .append("rect")
            .attr("class","d3plus_color")
            .call(style)

        if (!d3plus.touch) {

          keys
            .on(d3plus.evt.over,function(d,i){

              d3.select(this).style("cursor","pointer")

              var x = start_x + (i*(vars.ui.padding+square_size)),
                  y = d3.transform(d3.select(this.parentNode).attr("transform")).translate[1]

              x += square_size/2
              y += vars.ui.padding+square_size/2

              d3plus.tooltip.app({
                "data": d,
                "footer": false,
                "vars": vars,
                "x": x,
                "y": y
              })

            })
            .on(d3plus.evt.out,function(d){
              d3plus.tooltip.remove(vars.type.value)
            })

        }

        keys.order()
          .transition().duration(vars.draw.timing)
          .attr("opacity",1)
          .call(position)

        keys.selectAll("rect.d3plus_color").transition().duration(vars.draw.timing)
          .call(style)

        keys.exit()
          .transition().duration(vars.draw.timing)
          .attr("opacity",0)
          .remove()

        if ( vars.dev.value ) d3plus.console.timeEnd("drawing legend")

      }

    }
    else if (vars.color.scale) {

      if ( vars.dev.value ) d3plus.console.time("drawing color scale")

      vars.g.legend.selectAll("g.d3plus_color")
        .transition().duration(vars.draw.timing)
        .attr("opacity",0)
        .remove()

      var values = vars.color.scale.domain(),
          colors = vars.color.scale.range()

      if (values.length <= 2) {
        values = d3plus.util.buckets(values,6)
      }

      var scale = vars.g.legend.selectAll("g.d3plus_scale")
        .data(["scale"])

      scale.enter().append("g")
        .attr("class","d3plus_scale")
        .attr("opacity",0)

      var heatmap = scale.selectAll("#d3plus_legend_heatmap")
        .data(["heatmap"])

      heatmap.enter().append("linearGradient")
        .attr("id", "d3plus_legend_heatmap")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

      var stops = heatmap.selectAll("stop")
        .data(d3.range(0,colors.length))

      stops.enter().append("stop")
        .attr("stop-opacity",1)

      stops
        .attr("offset",function(i){
          return Math.round((i/(colors.length-1))*100)+"%"
        })
        .attr("stop-color",function(i){
          return colors[i]
        })

      stops.exit().remove()

      var gradient = scale.selectAll("rect#gradient")
        .data(["gradient"])

      gradient.enter().append("rect")
        .attr("id","gradient")
        .attr("x",function(d){
          if (vars.legend.align == "middle") {
            return vars.width.value/2
          }
          else if (vars.legend.align == "end") {
            return vars.width.value
          }
          else {
            return 0
          }
        })
        .attr("y",vars.ui.padding)
        .attr("width", 0)
        .attr("height", vars.legend.gradient.height)
        .attr("stroke",vars.legend.font.color)
        .attr("stroke-width",1)
        .style("fill", "url(#d3plus_legend_heatmap)")

      var text = scale.selectAll("text.d3plus_tick")
        .data(d3.range(0,values.length))

      text.enter().append("text")
        .attr("class","d3plus_tick")
        .attr("x",function(d){
          if (vars.legend.align == "middle") {
            return vars.width.value/2
          }
          else if (vars.legend.align == "end") {
            return vars.width.value
          }
          else {
            return 0
          }
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.legend.gradient.height+vars.ui.padding*2
        })

      var label_width = 0

      text
        .order()
        .attr("font-weight",vars.legend.font.weight)
        .attr("font-family",vars.legend.font.family.value)
        .attr("font-size",vars.legend.font.size)
        .attr("text-anchor",vars.legend.font.align)
        .attr("fill",vars.legend.font.color)
        .text(function(d){
          return vars.format.value(values[d],key)
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.legend.gradient.height+vars.ui.padding*2
        })
        .each(function(d){
          var w = this.offsetWidth
          if (w > label_width) label_width = w
        })

      label_width += vars.labels.padding*2

      var key_width = label_width * (values.length-1)

      if (key_width+label_width < vars.width.value) {

        if (key_width+label_width < vars.width.value/2) {
          key_width = vars.width.value/2
          label_width = key_width/values.length
          key_width -= label_width
        }

        if (vars.legend.align == "start") {
          var start_x = vars.ui.padding
        }
        else if (vars.legend.align == "end") {
          var start_x = vars.width.value - vars.ui.padding - key_width
        }
        else {
          var start_x = vars.width.value/2 - key_width/2
        }

        text.transition().duration(vars.draw.timing)
          .attr("x",function(d){
            return start_x + (label_width*d)
          })

        text.exit().transition().duration(vars.draw.timing)
          .attr("opacity",0)
          .remove()

        var ticks = scale.selectAll("rect.d3plus_tick")
          .data(d3.range(0,values.length))

        ticks.enter().append("rect")
          .attr("class","d3plus_tick")
          .attr("x",function(d){
            if (vars.legend.align == "middle") {
              return vars.width.value/2
            }
            else if (vars.legend.align == "end") {
              return vars.width.value
            }
            else {
              return 0
            }
          })
          .attr("y",vars.ui.padding)
          .attr("width",0)
          .attr("height",vars.ui.padding+vars.legend.gradient.height)
          .attr("fill",vars.legend.font.color)

        ticks.transition().duration(vars.draw.timing)
          .attr("x",function(d){
            var mod = d == 0 ? 1 : 0
            return start_x + (label_width*d) - mod
          })
          .attr("y",vars.ui.padding)
          .attr("width",1)
          .attr("height",vars.ui.padding+vars.legend.gradient.height)
          .attr("fill",vars.legend.font.color)

        ticks.exit().transition().duration(vars.draw.timing)
          .attr("width",0)
          .remove()

        gradient.transition().duration(vars.draw.timing)
          .attr("x",function(d){
            if (vars.legend.align == "middle") {
              return vars.width.value/2 - key_width/2
            }
            else if (vars.legend.align == "end") {
              return vars.width.value - key_width - vars.ui.padding
            }
            else {
              return vars.ui.padding
            }
          })
          .attr("y",vars.ui.padding)
          .attr("width", key_width)
          .attr("height", vars.legend.gradient.height)

        scale.transition().duration(vars.draw.timing)
          .attr("opacity",1)

        if ( vars.dev.value ) d3plus.console.timeEnd("drawing color scale")

      }
      else {
        key_display = false
      }

    }
    else {
      key_display = false
    }

  }
  else {
    key_display = false
  }
  if (vars.legend.value && key && key_display) {

    if ( vars.dev.value ) d3plus.console.time("positioning legend")

    if (square_size) {
      var key_height = square_size+vars.ui.padding
    }
    else {
      var key_box = vars.g.legend.node().getBBox(),
          key_height = key_box.height+key_box.y-vars.ui.padding
    }

    if (vars.margin.bottom === 0) {
      vars.margin.bottom += vars.ui.padding
    }
    vars.margin.bottom += key_height

    vars.g.legend.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")

    if ( vars.dev.value ) d3plus.console.timeEnd("positioning legend")

  }
  else {

    if ( vars.dev.value ) d3plus.console.time("hiding legend")

    vars.g.legend.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+vars.height.value+")")

    if ( vars.dev.value ) d3plus.console.timeEnd("hiding legend")

  }


}
