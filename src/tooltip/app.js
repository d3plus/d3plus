//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates correctly formatted tooltip for Apps
//-------------------------------------------------------------------
d3plus.tooltip.app = function(params) {

  var vars = params.vars,
      d = params.data,
      ex = params.ex,
      mouse = params.mouseevents ? params.mouseevents : false,
      arrow = "arrow" in params ? params.arrow : true,
      id = d3plus.variable.value(vars,d,vars.id.value),
      tooltip_id = params.id || vars.type.value

  if ((d3.event && d3.event.type == "click") && (vars.html.value || vars.tooltip.value.long) && !("fullscreen" in params)) {
    var fullscreen = true,
        arrow = false,
        mouse = true,
        length = "long",
        footer = vars.footer.value

    vars.covered = true
  }
  else {
    var fullscreen = false,
        align = params.anchor || vars.style.tooltip.anchor,
        length = params.length || "short",
        zoom = vars.zoom_direction()

    if (zoom === -1) {
      var key = vars.id.nesting[vars.depth.value-1],
          parent = d3plus.variable.value(vars,id,key),
          solo = vars.id.solo.value.indexOf(parent) >= 0
    }

    if (zoom === 1 && vars.zoom.value) {
      var text = vars.format("Click to Expand")
    }
    else if (zoom === -1 && vars.zoom.value && solo) {
      var text = vars.format("Click to Collapse")
    }
    else if (length == "short" && (vars.html.value || vars.tooltip.value.long) && vars.focus.value != id) {
      var text = "Click for More Info"
    }
    else if (length == "long") {
      var text = vars.footer.value || ""
    }
    else {
      var text = ""
    }

    var footer = text.length ? vars.format(text,"footer") : false

  }

  if ("x" in params) {
    var x = params.x
  }
  else if (d3plus.visualization[vars.type.value].tooltip == "follow") {
    var x = d3.mouse(vars.parent.node())[0]
  }
  else {
    var x = d.d3plus.x
    if (vars.zoom.translate && vars.zoom.scale) {
      x = vars.zoom.translate[0]+x*vars.zoom.scale
    }
    x += vars.margin.left
  }

  if ("y" in params) {
    var y = params.y
  }
  else if (d3plus.visualization[vars.type.value].tooltip == "follow") {
    var y = d3.mouse(vars.parent.node())[1]
  }
  else {
    var y = d.d3plus.y
    if (vars.zoom.translate && vars.zoom.scale) {
      y = vars.zoom.translate[1]+y*vars.zoom.scale
    }
    y += vars.margin.top
  }

  if ("offset" in params) {
    var offset = params.offset
  }
  else if (d3plus.visualization[vars.type.value].tooltip == "follow") {
    var offset = 3
  }
  else {
    var offset = d.d3plus.r ? d.d3plus.r : d.d3plus.height/2
    if (vars.zoom.scale) {
      offset = offset * vars.zoom.scale
    }
  }

  function make_tooltip(html) {

    if (d.d3plus) {

      if (d.d3plus.merged) {
        if (!ex) ex = {}
        ex.items = d.d3plus.merged.length
      }

      var active = vars.active.value ? d3plus.variable.value(vars,d,vars.active.value) : d.d3plus.active,
          temp = vars.temp.value ? d3plus.variable.value(vars,d,vars.temp.value) : d.d3plus.temp,
          total = vars.total.value ? d3plus.variable.value(vars,d,vars.total.value) : d.d3plus.total

      if (typeof active == "number" && active > 0 && total) {
        if (!ex) ex = {}
        var label = vars.active.value || "active"
        ex[label] = active+"/"+total+" ("+vars.format((active/total)*100,"share")+"%)"
      }

      if (typeof temp == "number" && temp > 0 && total) {
        if (!ex) ex = {}
        var label = vars.temp.value || "temp"
        ex[label] = temp+"/"+total+" ("+vars.format((temp/total)*100,"share")+"%)"
      }

      if (d.d3plus.share) {
        if (!ex) ex = {}
        ex.share = vars.format(d.d3plus.share*100,"share")+"%"
      }

    }

    var depth = "depth" in params ? params.depth : vars.depth.value,
        title = d3plus.variable.text(vars,d,depth)[0],
        icon = d3plus.variable.value(vars,d,vars.icon.value,vars.id.nesting[depth]),
        tooltip_data = d3plus.tooltip.data(vars,d,length,ex,depth)

    if ((tooltip_data.length > 0 || footer) || ((!d.d3plus_label && length == "short" && title) || (d.d3plus_label && "visible" in d.d3plus_label && !d.d3plus_label.visible))) {

      if (!title) {
        title = id
      }

      var depth = d.d3plus && "depth" in d.d3plus ? vars.id.nesting[d.d3plus.depth] : vars.id.value

      if (typeof vars.icon.style.value == "string") {
        var icon_style = vars.icon.style.value
      }
      else if (typeof vars.icon.style.value == "object" && vars.icon.style.value[depth]) {
        var icon_style = vars.icon.style.value[depth]
      }
      else {
        var icon_style = "default"
      }

      if (params.width) {
        var width = params.width
      }
      else if (!fullscreen && tooltip_data.length == 0) {
        var width = "auto"
      }
      else {
        var width = vars.style.tooltip.small
      }

      d3plus.tooltip.create({
        "align": align,
        "arrow": arrow,
        "background": vars.style.tooltip.background,
        "curtain": vars.style.tooltip.curtain.color,
        "curtainopacity": vars.style.tooltip.curtain.opacity,
        "fontcolor": vars.style.tooltip.font.color,
        "fontfamily": vars.style.tooltip.font.family,
        "fontsize": vars.style.tooltip.font.size,
        "fontweight": vars.style.tooltip.font.weight,
        "data": tooltip_data,
        "color": d3plus.variable.color(vars,d),
        "footer": footer,
        "fullscreen": fullscreen,
        "html": html,
        "icon": icon,
        "id": tooltip_id,
        "max_height": params.maxheight,
        "max_width": vars.style.tooltip.small,
        "mouseevents": mouse,
        "offset": offset,
        "parent": vars.parent,
        "style": icon_style,
        "title": title,
        "width": width,
        "x": x,
        "y": y
      })

    }
    else {
      d3plus.tooltip.remove(tooltip_id)
    }

  }

  if (fullscreen) {

    if (typeof vars.html.value == "string") {
      make_tooltip(vars.html.value)
    }
    else if (typeof vars.html.value == "function") {
      make_tooltip(vars.html.value(id))
    }
    else if (vars.html.value && typeof vars.html.value == "object" && vars.html.value.url) {
      d3.json(vars.html.value.url,function(data){
        var html = vars.html.value.callback ? vars.html.value.callback(data) : data
        make_tooltip(html)
      })
    }
    else {
      make_tooltip("")
    }

  }
  else {
    make_tooltip("")
  }

}
