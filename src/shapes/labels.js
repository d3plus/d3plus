//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "labels" using svg:text and d3plus.utils.wordwrap
//------------------------------------------------------------------------------
d3plus.shape.labels = function(vars,selection) {

  var scale = vars.zoom_behavior.scaleExtent()

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Label Exiting
  //----------------------------------------------------------------------------
  remove = function(text) {

    if (vars.timing) {
      text
        .transition().duration(vars.timing)
        .attr("opacity",0)
        .remove()
    }
    else {
      text.remove()
    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Label Styling
  //----------------------------------------------------------------------------
  style = function(text,wrap) {

    function x_pos(t) {

      var align = t.anchor || vars.style.labels.align,
          tspan = this.tagName == "tspan",
          share = tspan ? this.parentNode.className.baseVal == "d3plus_share" : this.className.baseVal == "d3plus_share",
          width = d3.select(this).node().getComputedTextLength()/scale[1]

      if (align == "middle" || share) {
        var pos = t.x-width/2
      }
      else if ((align == "end" && !d3plus.rtl) || (align == "start" && d3plus.rtl)) {
        var pos = t.x+(t.w-t.padding)/2-width
      }
      else {
        var pos = t.x-(t.w-t.padding)/2
      }

      if (tspan) {
        var t_width = this.getComputedTextLength()/scale[1]
        if (align == "middle") {
          if (d3plus.rtl) {
            pos -= (width-t_width)/2
          }
          else {
            pos += (width-t_width)/2
          }
        }
        else if (align == "end") {
          if (d3plus.rtl) {
            pos -= (width-t_width)
          }
          else {
            pos += (width-t_width)
          }
        }
      }

      if (d3plus.rtl) {
        pos += width
      }

      return pos*scale[1]

    }

    function y_pos(t) {

      if (d3.select(this).select("tspan").empty()) {
        return 0
      }
      else {

        var align = vars.style.labels.align,
            height = d3.select(this).node().getBBox().height/scale[1],
            diff = (parseFloat(d3.select(this).style("font-size"),10)/5)/scale[1]

        if (this.className.baseVal == "d3plus_share") {
          var data = d3.select(this.parentNode).datum()
          var pheight = data.d3plus.r ? data.d3plus.r*2 : data.d3plus.height
          pheight = pheight/scale[1]
          if (align == "end") {
            var y = t.y-pheight/2+diff/2
          }
          else {
            var y = t.y+pheight/2-height-diff/2
          }
        }
        else {

          if (align == "middle" || t.valign == "center") {
            var y = t.y-height/2-diff/2
          }
          else if (align == "end") {
            var y = t.y+(t.h-t.padding)/2-height+diff/2
          }
          else {
            var y = t.y-(t.h-t.padding)/2-diff
          }

        }

        return y*scale[1]

      }
    }

    text
      .style("font-weight",vars.style.font.weight)
      .attr("font-family",vars.style.font.family)
      .attr("text-anchor","start")
      .attr("fill", function(t){
        if (t.color) {
          return t.color
        }
        else {
          var d = d3.select(this.parentNode).datum()
          return d3plus.color.text(d3plus.shape.color(d,vars))
        }
      })
      .attr("x",x_pos)
      .attr("y",y_pos)

    if (wrap) {

      text
        .each(function(t){

          if (t.text) {

            d3plus.utils.wordwrap({
              "text": vars.format(t.text*100,"share")+"%",
              "parent": this,
              "width": t.w*scale[1]-t.padding,
              "height": t.h*scale[1]-t.padding,
              "resize": t.resize,
              "font_min": 9/scale[1],
              "font_max": 70*scale[1]
            })

          }
          else {

            if (vars.style.labels.align != "middle") {
              var height = t.h-t.share
            }
            else {
              var height = t.h
            }

            d3plus.utils.wordwrap({
              "text": t.names,
              "parent": this,
              "width": t.w*scale[1]-t.padding,
              "height": height*scale[1]-t.padding,
              "font_max": 40*scale[1],
              "font_min": 9/scale[1],
              "resize": t.resize
            })

          }

        })
        .attr("x",x_pos)
        .attr("y",y_pos)

    }

    text
      .attr("transform",function(t){
        var a = t.angle || 0,
            x = t.translate && t.translate.x || 0,
            y = t.translate && t.translate.y || 0

        return "rotate("+a+","+x+","+y+")scale("+1/scale[1]+")"
      })
      .selectAll("tspan")
        .attr("x",x_pos)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Loop through each selection and analyze the labels
  //----------------------------------------------------------------------------
  if (vars.labels.value) {

    selection.each(function(d){

      var disabled = d.d3plus && "label" in d.d3plus && !d.d3plus.label,
          stat = d.d3plus && "static" in d.d3plus && d.d3plus.static
          label = d.d3plus_label,
          share = d.d3plus_share,
          names = label && label.names ? label.names : d3plus.variable.text(vars,d),
          group = d3.select(this),
          share_size = 0,
          fill = d3plus.apps[vars.type.value].fill

      if (["line","area"].indexOf(vars.shape.value) >= 0) {
        var background = true
      }
      else {
        var active = vars.active.key ? d.d3plus[vars.active.key] : d.d3plus.active,
            temp = vars.temp.key ? d.d3plus[vars.temp.key] : d.d3plus.temp,
            total = vars.total.key ? d.d3plus[vars.total.key] : d.d3plus.total,
            background = (!temp && !active) || (active == total)
      }

      if (!disabled && (background || !fill) && !stat) {

        if (share && d.d3plus.share && vars.style.labels.align != "middle") {

          share.padding = (vars.style.labels.padding/scale[1])*2

          share.text = d.d3plus.share
          if (!("resize" in share)) {
            share.resize = true
          }

          var text = group.selectAll("text.d3plus_share")
            .data([share],function(t){
              return t.w+""+t.h+""+t.text
            })

          if (vars.timing) {

            text
              .transition().duration(vars.timing/2)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*scale[0])
              .attr("class","d3plus_share")
              .attr("opacity",0)
              .call(style,true)
              .transition().duration(vars.timing/2)
              .delay(vars.timing/2)
              .attr("opacity",0.5)

          }
          else {

            text
              .attr("opacity",0.5)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*scale[0])
              .attr("class","d3plus_share")
              .attr("opacity",0.5)
              .call(style,true)

          }

          share_size = text.node().getBBox().height

          text.exit().call(remove)

        }
        else {
          group.selectAll("text.d3plus_share")
            .call(remove)
        }

        if (label) {
          label.padding = (vars.style.labels.padding/scale[1])*2
        }
        
        if (label && label.w*scale[1]-label.padding >= 20 && label.h*scale[1]-label.padding >= 10 && names.length) {

          label.names = names
          if (!("resize" in label)) {
            label.resize = true
          }

          label.share = share_size

          var text = group.selectAll("text.d3plus_label")
            .data([label],function(t){
              if (!t) return false
              return t.w+"_"+t.h+"_"+t.x+"_"+t.y+"_"+t.names.join("_")
            })

          if (vars.timing) {

            text
              .transition().duration(vars.timing/2)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*scale[0])
              .attr("class","d3plus_label")
              .attr("opacity",0)
              .call(style,true)
              .transition().duration(vars.timing/2)
              .delay(vars.timing/2)
              .attr("opacity",1)

          }
          else {

            text
              .attr("opacity",1)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*scale[0])
              .attr("class","d3plus_label")
              .call(style,true)
              .attr("opacity",1)

          }

          text.exit().call(remove)

          if (text.size() == 0 || text.html() == "") {
            delete d.d3plus_label
            text.remove()
          }
          else {

            if (label.background) {

              var background_data = ["background"]

              var bounds = text.node().getBBox()

              bounds.width += vars.style.labels.padding*scale[0]
              bounds.height += vars.style.labels.padding*scale[0]
              bounds.x -= (vars.style.labels.padding*scale[0])/2
              bounds.y -= (vars.style.labels.padding*scale[0])/2

            }
            else {
              var background_data = [],
                  bounds = {}
            }

            var bg = group.selectAll("rect.d3plus_label_bg")
              .data(background_data)

            function bg_style(elem) {

              var color = vars.style.background == "transparent" ? "#ffffff" : vars.style.background,
                  fill = label.background === true ? color : label.background,
                  a = label.angle || 0,
                  x = label.translate ? bounds.x+bounds.width/2 : 0,
                  y = label.translate ? bounds.y+bounds.height/2 : 0,
                  transform = "scale("+1/scale[1]+")rotate("+a+","+x+","+y+")"

              elem
                .attr("fill",fill)
                .attr(bounds)
                .attr("transform",transform)

            }

            if (vars.timing) {

              bg.exit().transition().duration(vars.timing)
                .attr("opacity",0)
                .remove()

              bg.transition().duration(vars.timing)
                .attr("opacity",1)
                .call(bg_style)

              bg.enter().insert("rect",".d3plus_label")
                .attr("class","d3plus_label_bg")
                .attr("opacity",0)
                .call(bg_style)
                .transition().duration(vars.timing)
                  .attr("opacity",1)

            }
            else {

              bg.exit().remove()

              bg.enter().insert("rect",".d3plus_label")
                .attr("class","d3plus_label_bg")

              bg.attr("opacity",0.5)
                .call(bg_style)

            }

          }

        }
        else {
          delete d.d3plus_label
          group.selectAll("text.d3plus_label, rect.d3plus_label_bg")
            .call(remove)
        }

      }
      else {
        delete d.d3plus_label
        group.selectAll("text.d3plus_label, rect.d3plus_label_bg")
          .call(remove)
      }
    })

  }
  else {

    selection.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .call(remove)

  }

}
