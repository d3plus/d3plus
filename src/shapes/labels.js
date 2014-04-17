//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "labels" using svg:text and d3plus.util.wordwrap
//------------------------------------------------------------------------------
d3plus.shape.labels = function(vars,selection) {

  var scale = vars.zoom.behavior.scaleExtent()

  var opacity = function(elem) {

    elem
      .attr("opacity",function(d){
        if (!d) var d = {"scale": scale[1]}
        var size = parseFloat(d3.select(this).attr("font-size"),10)
        d.visible = size/d.scale*vars.zoom.scale >= 7
        return d.visible ? 1 : 0
      })

  }

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
      .attr("font-weight",vars.style.labels.font.weight)
      .attr("font-family",vars.style.labels.font.family)
      .attr("text-anchor","start")
      .attr("pointer-events",function(t){
        return t.mouse ? "auto": "none"
      })
      .attr("fill", function(t){
        if (t.color) {
          return t.color
        }
        else {
          return d3plus.color.text(d3plus.shape.color(t.parent,vars))
        }
      })
      .attr("x",x_pos)
      .attr("y",y_pos)

    if (wrap) {

      text
        .each(function(t){

          if (t.resize instanceof Array) {
            var min = t.resize[0]
              , max = t.resize[1]
          }

          if (t.text) {


            if (!(t.resize instanceof Array)) {
              var min = 8
                , max = 70
            }

            d3plus.util.wordwrap({
              "text": vars.format(t.text*100,"share")+"%",
              "parent": this,
              "width": t.w*t.scale-t.padding,
              "height": t.h*t.scale-t.padding,
              "resize": t.resize,
              "font_min": min/t.scale,
              "font_max": max*t.scale
            })

          }
          else {

            if (vars.style.labels.align != "middle") {
              var height = t.h-t.share
            }
            else {
              var height = t.h
            }

            if (!(t.resize instanceof Array)) {
              var min = 8
                , max = 40
            }

            d3plus.util.wordwrap({
              "text": t.names,
              "parent": this,
              "width": t.w*t.scale-t.padding,
              "height": height*t.scale-t.padding,
              "resize": t.resize,
              "font_min": min/t.scale,
              "font_max": max*t.scale
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
          label = d.d3plus_label ? d.d3plus_label : vars.zoom.labels ? vars.zoom.labels[d.d3plus.id] : null,
          share = d.d3plus_share,
          names = label && label.names ? label.names : d3plus.variable.text(vars,d),
          group = label && "group" in label ? label.group : d3.select(this),
          share_size = 0,
          fill = d3plus.visualization[vars.type.value].fill

      if (label) {

        if (["line","area"].indexOf(vars.shape.value) >= 0) {
          var background = true
        }
        else if (d && "d3plus" in d) {
          var active = vars.active.value ? d.d3plus[vars.active.value] : d.d3plus.active,
              temp = vars.temp.value ? d.d3plus[vars.temp.value] : d.d3plus.temp,
              total = vars.total.value ? d.d3plus[vars.total.value] : d.d3plus.total,
              background = (!temp && !active) || (active == total)
        }

      }

      if (!disabled && (background || !fill) && !stat) {

        if (share && d.d3plus.share && vars.style.labels.align != "middle") {

          share.resize = vars.labels.resize.value === false ? false :
            share && "resize" in share ? share.resize : true

          share.scale = share.resize ? scale[1] : scale[0]

          share.padding = (vars.style.labels.padding/share.scale)*2

          share.text = d.d3plus.share
          share.parent = d

          var text = group.selectAll("text#d3plus_share_"+d.d3plus.id)
            .data([share],function(t){
              return t.w+""+t.h+""+t.text
            })

          if (vars.timing) {

            text
              .transition().duration(vars.timing/2)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*share.scale)
              .attr("id","d3plus_share_"+d.d3plus.id)
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
              .attr("font-size",vars.style.labels.font.size*share.scale)
              .attr("id","d3plus_share_"+d.d3plus.id)
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

          label.resize = vars.labels.resize.value === false ? false :
            label && "resize" in label ? label.resize : true

          label.scale = label.resize ? scale[1] : scale[0]

          label.padding = (vars.style.labels.padding/label.scale)*2

        }

        if (label && label.w*label.scale-label.padding >= 20 && label.h*label.scale-label.padding >= 10 && names.length) {

          label.names = names

          label.share = share_size
          label.parent = d

          var text = group.selectAll("text#d3plus_label_"+d.d3plus.id)
            .data([label],function(t){
              if (!t) return false
              return t.w+"_"+t.h+"_"+t.x+"_"+t.y+"_"+t.names.join("_")
            })

          if (vars.timing) {

            text
              .transition().duration(vars.timing/2)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*label.scale)
              .attr("id","d3plus_label_"+d.d3plus.id)
              .attr("class","d3plus_label")
              .attr("opacity",0)
              .call(style,true)
              .transition().duration(vars.timing/2)
              .delay(vars.timing/2)
              .call(opacity)

          }
          else {

            text
              .attr("opacity",1)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*label.scale)
              .attr("id","d3plus_label_"+d.d3plus.id)
              .attr("class","d3plus_label")
              .call(style,true)
              .call(opacity)

          }

          text.exit().call(remove)

          if (text.size() == 0 || text.html() == "") {
            delete d.d3plus_label
            group.selectAll("text.d3plus_label, rect.d3plus_label_bg")
              .call(remove)
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

            var bg = group.selectAll("rect#d3plus_label_bg_"+d.d3plus.id)
                       .data(background_data)
              , bg_opacity = typeof label.background == "number"
                        ? label.background : 0.6

            function bg_style(elem) {

              var color = vars.style.background == "transparent"
                        ? "#ffffff" : vars.style.background
                , fill = typeof label.background == "string"
                       ? label.background : color
                , a = label.angle || 0
                , x = label.translate ? bounds.x+bounds.width/2 : 0
                , y = label.translate ? bounds.y+bounds.height/2 : 0
                , transform = "scale("+1/scale[1]+")rotate("+a+","+x+","+y+")"

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
                .attr("opacity",bg_opacity)
                .call(bg_style)

              bg.enter().insert("rect",".d3plus_label")
                .attr("id","d3plus_label_bg_"+d.d3plus.id)
                .attr("class","d3plus_label_bg")
                .attr("opacity",0)
                .call(bg_style)
                .transition().duration(vars.timing)
                  .attr("opacity",bg_opacity)

            }
            else {

              bg.exit().remove()

              bg.enter().insert("rect",".d3plus_label")
                .attr("id","d3plus_label_bg_"+d.d3plus.id)
                .attr("class","d3plus_label_bg")

              bg.attr("opacity",bg_opacity)
                .call(bg_style)

            }

          }

        }
        else {
          delete d.d3plus_label
          group.selectAll("text#d3plus_label_"+d.d3plus.id+", rect#d3plus_label_bg_"+d.d3plus.id)
            .call(remove)
        }

      }
      else {
        delete d.d3plus_label
        group.selectAll("text#d3plus_label_"+d.d3plus.id+", rect#d3plus_label_bg_"+d.d3plus.id)
          .call(remove)
      }
    })

  }
  else {

    selection.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .call(remove)

    vars.g.labels.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .call(remove)

  }

}
