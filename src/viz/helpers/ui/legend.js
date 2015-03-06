var arraySort = require("../../../array/sort.coffee"),
    buckets       = require("../../../util/buckets.coffee"),
    copy          = require("../../../util/copy.coffee"),
    createTooltip = require("../tooltip/create.js"),
    dataNest      = require("../../../core/data/nest.js"),
    dataURL       = require("../../../util/dataURL.coffee"),
    events        = require("../../../client/pointer.coffee"),
    fetchValue    = require("../../../core/fetch/value.coffee"),
    fetchColor    = require("../../../core/fetch/color.coffee"),
    fetchText     = require("../../../core/fetch/text.js"),
    print         = require("../../../core/console/print.coffee"),
    removeTooltip = require("../../../tooltip/remove.coffee"),
    textColor     = require("../../../color/text.coffee"),
    uniqueValues  = require("../../../util/uniques.coffee"),
    stringStrip   = require("../../../string/strip.js"),
    textWrap      = require("../../../textwrap/textwrap.coffee"),
    touch         = require("../../../client/touch.coffee"),
    validObject   = require("../../../object/validate.coffee");
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//------------------------------------------------------------------------------
module.exports = function(vars) {

  var key_display = true,
      square_size = 0;

  if (!vars.error.internal && vars.color.value && !vars.small && vars.legend.value) {

    if (!vars.color.valueScale) {

      if ( vars.dev.value ) print.time("grouping data by colors");

      var data;
      if ( vars.nodes.value && vars.types[vars.type.value].requirements.indexOf("nodes") >= 0 ) {
        data = copy(vars.nodes.restriced || vars.nodes.value);
        if ( vars.data.viz.length ) {
          for (var i = 0 ; i < data.length ; i++) {
            var appData = vars.data.viz.filter(function(a){
              return a[vars.id.value] === data[i][vars.id.value];
            });
            if (appData.length) {
              data[i] = appData[0];
            }
          }
        }
      }
      else {
        data = vars.data.viz;
      }

      var colorFunction = function(d){
            return fetchColor(vars, d, colorDepth);
          },
          colorDepth = 0,
          colorKey = vars.id.value;

      var colorIndex = vars.id.nesting.indexOf(vars.color.value);
      if (colorIndex >= 0) {
        colorDepth = colorIndex;
        colorKey = vars.id.nesting[colorIndex];
      }
      else {

        for (var n = 0; n <= vars.depth.value; n++) {

          colorDepth = n;
          colorKey   = vars.id.nesting[n];

          var uniqueIDs = uniqueValues(data , function(d){
                return fetchValue(vars, d, colorKey);
              }),
              uniqueColors = uniqueValues(data, colorFunction);

          if (uniqueIDs.length <= uniqueColors.length && uniqueColors.length > 1) {
            break;
          }

        }

      }

      var legendNesting = [vars.color.value];
      if (vars.icon.value && vars.legend.icons.value) legendNesting.push(vars.icon.value);
      var colors = dataNest(vars, data, legendNesting, []);

      if ( vars.dev.value ) print.timeEnd("grouping data by color")

      var available_width = vars.width.value;

      square_size = vars.legend.size;

      var key_width = square_size*colors.length+vars.ui.padding*(colors.length+1)

      if (square_size instanceof Array) {

        if ( vars.dev.value ) print.time("calculating legend size")

        for (var i = square_size[1]; i >= square_size[0]; i--) {
          key_width = i*colors.length+vars.ui.padding*(colors.length+1)
          if (available_width >= key_width) {
            square_size = i;
            break;
          }
        }

        if ( vars.dev.value ) print.timeEnd("calculating legend size");

      }
      else if (typeof square_size != "number" && square_size !== false) {
        square_size = 30;
      }

      if (available_width < key_width || colors.length == 1) {
        key_display = false;
      }
      else {

        key_width -= vars.ui.padding*2;

        if ( vars.dev.value ) print.time("sorting legend");

        var order = vars[vars.legend.order.value].value;

        arraySort(colors, order, vars.legend.order.sort.value, vars.color.value, vars, colorDepth);

        if ( vars.dev.value ) print.timeEnd("sorting legend");

        if ( vars.dev.value ) print.time("drawing legend");

        var start_x;

        if (vars.legend.align == "start") {
          start_x = vars.ui.padding;
        }
        else if (vars.legend.align == "end") {
          start_x = available_width - vars.ui.padding - key_width;
        }
        else {
          start_x = available_width/2 - key_width/2;
        }

        vars.g.legend.selectAll("g.d3plus_scale")
          .transition().duration(vars.draw.timing)
          .attr("opacity",0)
          .remove();

        function position(group) {

          group
            .attr("transform",function(g,i){
              var x = start_x + (i*(vars.ui.padding+square_size))
              return "translate("+x+","+vars.ui.padding+")"
            })

        }

        function style(rect) {

          rect
            .attr("width", square_size)
            .attr("height", square_size)
            .attr("fill",function(g){

              d3.select(this.parentNode).select("text").remove();

              var icon = uniqueValues(g, vars.icon.value, fetchValue, vars, colorKey),
                  color = fetchColor(vars, g, colorKey);

              if (vars.legend.icons.value && icon.length === 1 &&
                  typeof icon[0] === "string") {
                icon = icon[0];
                var short_url = stringStrip(icon+"_"+color),
                    iconStyle = vars.icon.style.value,
                    icon_style,
                    pattern = vars.defs.selectAll("pattern#"+short_url)
                      .data([short_url]);

                if (typeof iconStyle === "string") {
                  icon_style = vars.icon.style.value;
                }
                else if (validObject(iconStyle) && iconStyle[colorKey]) {
                  icon_style = iconStyle[colorKey];
                }
                else {
                  icon_style = "default";
                }

                color = icon_style == "knockout" ? color : "none";

                pattern.select("rect").transition().duration(vars.draw.timing)
                  .attr("fill",color)
                  .attr("width",square_size)
                  .attr("height",square_size);

                pattern.select("image").transition().duration(vars.draw.timing)
                  .attr("width",square_size)
                  .attr("height",square_size);

                var pattern_enter = pattern.enter().append("pattern")
                  .attr("id",short_url)
                  .attr("width",square_size)
                  .attr("height",square_size);

                pattern_enter.append("rect")
                  .attr("fill",color)
                  .attr("width",square_size)
                  .attr("height",square_size);

                pattern_enter.append("image")
                  .attr("xlink:href",icon)
                  .attr("width",square_size)
                  .attr("height",square_size)
                  .each(function(d){

                    if (icon.indexOf("/") === 0 || icon.indexOf(window.location.hostname) >= 0) {
                      dataURL(icon,function(base64){
                        pattern.select("image").attr("xlink:href",base64);
                      });
                    }
                    else {
                      pattern.select("image").attr("xlink:href",icon);
                    }

                  });

                return "url(#"+short_url+")";
              }
              else {

                var names;
                if (vars.legend.text.value) {
                  names = [fetchValue(vars, g, vars.legend.text.value, colorDepth)];
                }
                else {
                  names = fetchText(vars, g, colorDepth);
                }

                if (names.length === 1 && !(names[0] instanceof Array) && names[0].length) {

                  var text = d3.select(this.parentNode).append("text");

                  text
                    .attr("font-size",vars.legend.font.size+"px")
                    .attr("font-weight",vars.legend.font.weight)
                    .attr("font-family",vars.legend.font.family.value)
                    .attr("fill",textColor(color))
                    .attr("x",0)
                    .attr("y",0)
                    .each(function(t){

                      textWrap()
                        .align("middle")
                        .container( d3.select(this) )
                        .height(square_size)
                        .padding(vars.ui.padding)
                        .resize( vars.labels.resize.value )
                        .text( names[0] )
                        .width(square_size)
                        .valign("middle")
                        .draw();

                    })

                  if (text.select("tspan").empty()) {
                    text.remove();
                  }

                }

                return color;
              }

            });

        }

        var colorInt = {};
        var keys = vars.g.legend.selectAll("g.d3plus_color")
          .data(colors,function(d){
            var c = fetchColor(vars, d, colorKey);
            if (!(c in colorInt)) colorInt[c] = -1;
            colorInt[c]++;
            return colorInt[c]+"_"+c;
          });

        keys.enter().append("g")
          .attr("class","d3plus_color")
          .attr("opacity",0)
          .call(position)
          .append("rect")
            .attr("class","d3plus_color")
            .call(style);

        keys.order()
          .transition().duration(vars.draw.timing)
          .call(position)
          .attr("opacity", 1)
          .selectAll("rect.d3plus_color")
            .call(style);

        keys.exit()
          .transition().duration(vars.draw.timing)
          .attr("opacity",0)
          .remove();

        if (!touch && vars.legend.tooltip.value) {

          keys
            .on(events.over,function(d,i){

              d3.select(this).style("cursor","pointer");

              var bounds = this.getBoundingClientRect(),
                  x = bounds.left + square_size/2 + window.scrollX,
                  y = bounds.top + square_size/2 + window.scrollY;

              var idIndex = vars.id.nesting.indexOf(colorKey),
                  title = idIndex >= 0 ? fetchText(vars,d,idIndex)[0] :
                          vars.format.value(fetchValue(vars,d,vars.color.value,colorKey), {"key": vars.color.value, "vars": vars, "data": d});

              createTooltip({
                "data": d,
                "footer": false,
                "vars": vars,
                "x": x,
                "y": y,
                "title": title,
                "offset": square_size*0.4
              });

            })
            .on(events.out,function(d){
              removeTooltip(vars.type.value);
            });

        }

        if ( vars.dev.value ) print.timeEnd("drawing legend");

      }

    }
    else if (vars.color.valueScale) {

      if ( vars.dev.value ) print.time("drawing color scale");

      vars.g.legend.selectAll("g.d3plus_color")
        .transition().duration(vars.draw.timing)
        .attr("opacity",0)
        .remove();

      var values = vars.color.valueScale.domain(),
          colors = vars.color.valueScale.range();

      if (values.length <= 2) {
        values = buckets(values,6);
      }

      var scale = vars.g.legend.selectAll("g.d3plus_scale")
        .data(["scale"]);

      scale.enter().append("g")
        .attr("class","d3plus_scale")
        .attr("opacity",0);

      var heatmap = scale.selectAll("#d3plus_legend_heatmap")
        .data(["heatmap"]);

      heatmap.enter().append("linearGradient")
        .attr("id", "d3plus_legend_heatmap")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

      var stops = heatmap.selectAll("stop")
        .data(d3.range(0,colors.length));

      stops.enter().append("stop")
        .attr("stop-opacity",1);

      stops
        .attr("offset",function(i){
          return Math.round((i/(colors.length-1))*100)+"%";
        })
        .attr("stop-color",function(i){
          return colors[i];
        });

      stops.exit().remove();

      var gradient = scale.selectAll("rect#gradient")
        .data(["gradient"]);

      gradient.enter().append("rect")
        .attr("id","gradient")
        .attr("x",function(d){
          if (vars.legend.align == "middle") {
            return vars.width.value/2;
          }
          else if (vars.legend.align == "end") {
            return vars.width.value;
          }
          else {
            return 0;
          }
        })
        .attr("y",vars.ui.padding)
        .attr("width", 0)
        .attr("height", vars.legend.gradient.height)
        .attr("stroke",vars.legend.font.color)
        .attr("stroke-width",1)
        .style("fill", "url(#d3plus_legend_heatmap)");

      var text = scale.selectAll("text.d3plus_tick")
        .data(d3.range(0,values.length));

      text.enter().append("text")
        .attr("class","d3plus_tick")
        .attr("x",function(d){
          if (vars.legend.align == "middle") {
            return vars.width.value/2;
          }
          else if (vars.legend.align == "end") {
            return vars.width.value;
          }
          else {
            return 0;
          }
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.legend.gradient.height+vars.ui.padding*2;
        });

      var label_width = 0;

      text
        .order()
        .attr("font-weight",vars.legend.font.weight)
        .attr("font-family",vars.legend.font.family.value)
        .attr("font-size",vars.legend.font.size+"px")
        .style("text-anchor",vars.legend.font.align)
        .attr("fill",vars.legend.font.color)
        .text(function(d){
          return vars.format.value(values[d], {"key": key, "vars": vars});
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.legend.gradient.height+vars.ui.padding*2;
        })
        .each(function(d){
          var w = this.offsetWidth;
          if (w > label_width) label_width = w;
        });

      label_width += vars.labels.padding*2;

      var key_width = label_width * (values.length-1);

      if (key_width+label_width < vars.width.value) {

        if (key_width+label_width < vars.width.value/2) {
          key_width = vars.width.value/2;
          label_width = key_width/values.length;
          key_width -= label_width;
        }

        var start_x;
        if (vars.legend.align == "start") {
          start_x = vars.ui.padding;
        }
        else if (vars.legend.align == "end") {
          start_x = vars.width.value - vars.ui.padding - key_width;
        }
        else {
          start_x = vars.width.value/2 - key_width/2;
        }

        text.transition().duration(vars.draw.timing)
          .attr("x",function(d){
            return start_x + (label_width*d);
          });

        text.exit().transition().duration(vars.draw.timing)
          .attr("opacity",0)
          .remove();

        var ticks = scale.selectAll("rect.d3plus_tick")
          .data(d3.range(0,values.length));

        ticks.enter().append("rect")
          .attr("class","d3plus_tick")
          .attr("x",function(d){
            if (vars.legend.align == "middle") {
              return vars.width.value/2;
            }
            else if (vars.legend.align == "end") {
              return vars.width.value;
            }
            else {
              return 0;
            }
          })
          .attr("y",vars.ui.padding)
          .attr("width",0)
          .attr("height",vars.ui.padding+vars.legend.gradient.height)
          .attr("fill",vars.legend.font.color);

        ticks.transition().duration(vars.draw.timing)
          .attr("x",function(d){
            var mod = d === 0 ? 1 : 0;
            return start_x + (label_width*d) - mod;
          })
          .attr("y",vars.ui.padding)
          .attr("width",1)
          .attr("height",vars.ui.padding+vars.legend.gradient.height)
          .attr("fill",vars.legend.font.color);

        ticks.exit().transition().duration(vars.draw.timing)
          .attr("width",0)
          .remove();

        gradient.transition().duration(vars.draw.timing)
          .attr("x",function(d){
            if (vars.legend.align == "middle") {
              return vars.width.value/2 - key_width/2;
            }
            else if (vars.legend.align == "end") {
              return vars.width.value - key_width - vars.ui.padding;
            }
            else {
              return vars.ui.padding;
            }
          })
          .attr("y",vars.ui.padding)
          .attr("width", key_width)
          .attr("height", vars.legend.gradient.height);

        scale.transition().duration(vars.draw.timing)
          .attr("opacity",1);

        if ( vars.dev.value ) print.timeEnd("drawing color scale");

      }
      else {
        key_display = false;
      }

    }
    else {
      key_display = false;
    }

  }
  else {
    key_display = false;
  }
  if (vars.legend.value && key && key_display) {

    if ( vars.dev.value ) print.time("positioning legend");

    if (square_size) {
      var key_height = square_size+vars.ui.padding;
    }
    else {
      var key_box = vars.g.legend.node().getBBox(),
          key_height = key_box.height+key_box.y;
    }

    if (vars.margin.bottom === 0) {
      vars.margin.bottom += vars.ui.padding;
    }
    vars.margin.bottom += key_height;

    vars.g.legend.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")

    if ( vars.dev.value ) print.timeEnd("positioning legend")

  }
  else {

    if ( vars.dev.value ) print.time("hiding legend")

    vars.g.legend.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+vars.height.value+")")

    if ( vars.dev.value ) print.timeEnd("hiding legend")

  }

}
