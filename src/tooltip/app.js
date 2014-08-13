var fetchValue = require("../core/fetch/value.js"),
    fetchColor = require("../core/fetch/color.js"),
    fetchText  = require("../core/fetch/text.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates correctly formatted tooltip for Apps
//-------------------------------------------------------------------
d3plus.tooltip.app = function(params) {

  if ( !( "d3plus" in params.data ) ) {
    params.data.d3plus = {}
  }

  var vars = params.vars,
      d = params.data,
      dataDepth = "d3plus" in d && "depth" in d.d3plus ? d.d3plus.depth : vars.depth.value,
      ex = params.ex,
      mouse = params.mouseevents ? params.mouseevents : false,
      arrow = "arrow" in params ? params.arrow : true,
      id = fetchValue(vars,d,vars.id.value),
      tooltip_id = params.id || vars.type.value

  if ((d3.event && d3.event.type == "click") && (vars.tooltip.html.value || vars.tooltip.value.long) && !("fullscreen" in params)) {
    var fullscreen = true,
        arrow = false,
        mouse = true,
        length = "long",
        footer = vars.footer.value

    vars.covered = true
  }
  else {
    var fullscreen = false,
        align = params.anchor || vars.tooltip.anchor,
        length = params.length || "short",
        zoom = vars.zoom.direction(d)

    if (zoom === -1) {
      var key = vars.id.nesting[dataDepth-1],
          parent = fetchValue(vars,id,key)
    }

    if (zoom === 1 && vars.zoom.value) {
      var text = vars.format.value(vars.format.locale.value.ui.expand)
    }
    else if (zoom === -1 && vars.zoom.value && vars.history.states.length) {
      var text = vars.format.value(vars.format.locale.value.ui.collapse)
    }
    else if (!vars.small && length == "short" && (vars.tooltip.html.value || vars.tooltip.value.long) && (vars.focus.value.length !== 1 || vars.focus.value[0] != id)) {
      var text = vars.format.locale.value.ui.moreInfo
    }
    else if (length == "long") {
      var text = vars.footer.value || ""
    }
    else {
      var text = ""
    }

    var footer = text.length ? vars.format.value(text,"footer") : false

  }

  if ("x" in params) {
    var x = params.x
  }
  else if (vars.types[vars.type.value].tooltip == "follow") {
    var x = d3.mouse(vars.container.value.node())[0]
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
  else if (vars.types[vars.type.value].tooltip == "follow") {
    var y = d3.mouse(vars.container.value.node())[1]
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
  else if (vars.types[vars.type.value].tooltip == "follow") {
    var offset = 3
  }
  else {
    var offset = d.d3plus.r ? d.d3plus.r : d.d3plus.height/2
    if (vars.zoom.scale) {
      offset = offset * vars.zoom.scale
    }
  }

  function make_tooltip(html) {

    var ex = {}
      , children = {}
      , depth     = vars.id.nesting[dataDepth+1] in d ? dataDepth+1 : dataDepth
      , nestKey   = vars.id.nesting[depth]
      , nameList  = "merged" in d.d3plus ? d.d3plus.merged : d[nestKey]
      , dataValue = fetchValue( vars , d , vars.size.value )
      , same = (!(nameList instanceof Array) || (nameList instanceof Array && nameList.length === 1)) && depth === vars.depth.value

    if ( !same && vars.tooltip.children.value ) {

      if ( nameList instanceof Array ) {

        nameList = nameList.slice(0)

        if (vars.size.value && d3plus.object.validate(nameList[0])) {

          var namesWithValues = nameList.filter(function(n){
            return vars.size.value in n
          })

          var namesNoValues = nameList.filter(function(n){
            return !(vars.size.value in n)
          })

          d3plus.array.sort( namesWithValues , vars.size.value , "desc" , [] , vars )

          nameList = namesWithValues.concat(namesNoValues)

        }

        var limit = length === "short" ? 3 : vars.data.large
          , max   = d3.min([nameList.length , limit])
          , objs  = []

        for ( var i = 0 ; i < max ; i++ ) {

          var id    = nameList[i]
            , name  = fetchText( vars , id , depth )[0]
            , value = fetchValue( vars , id , vars.size.value , nestKey )
            , color = fetchColor( vars , id , nestKey )

          children[name] = value ? vars.format.value( value , vars.size.value ) : ""

          if ( color ) {
            if ( !children.d3plus_colors ) children.d3plus_colors = {}
            children.d3plus_colors[name] = color
          }

        }

        if ( nameList.length > max ) {
          children.d3plusMore = nameList.length - max
        }

      }
      else if ( nameList && nameList !== "null" ) {

        var name  = fetchText( vars , nameList , depth )[0]
        children[name] = dataValue ? vars.format.value( dataValue , vars.size.value ) : ""

      }

    }

    if ( vars.size.value && vars.tooltip.size.value && dataValue && ( same || !nameList || nameList instanceof Array ) ) {
      ex[vars.size.value] = dataValue
    }

    var active = vars.active.value ? fetchValue(vars,d,vars.active.value) : d.d3plus.active,
        temp = vars.temp.value ? fetchValue(vars,d,vars.temp.value) : d.d3plus.temp,
        total = vars.total.value ? fetchValue(vars,d,vars.total.value) : d.d3plus.total

    if (typeof active == "number" && active > 0 && total) {
      var label = vars.active.value || "active"
      ex[label] = active+"/"+total+" ("+vars.format.value((active/total)*100,"share")+"%)"
    }

    if (typeof temp == "number" && temp > 0 && total) {
      var label = vars.temp.value || "temp"
      ex[label] = temp+"/"+total+" ("+vars.format.value((temp/total)*100,"share")+"%)"
    }

    if ( vars.tooltip.share.value && d.d3plus.share ) {
      ex.share = vars.format.value(d.d3plus.share*100,"share")+"%"
    }

    var depth = "depth" in params ? params.depth : dataDepth,
        title = params.title || fetchText(vars,d,depth)[0],
        icon = fetchValue(vars,d,vars.icon.value,vars.id.nesting[depth]),
        tooltip_data = d3plus.tooltip.data(vars,d,length,ex,children,depth)

    if (icon === "null") icon = false

    if ((tooltip_data.length > 0 || footer) || ((!d.d3plus_label && length == "short" && title) || (d.d3plus_label && (!("visible" in d.d3plus_label) || ("visible" in d.d3plus_label && d.d3plus_label.visible === false))))) {

      if (!title) {
        title = id
      }

      var depth = "d3plus" in d && "merged" in d.d3plus ? dataDepth - 1 : dataDepth

      if (depth < 0) depth = 0

      depth = vars.id.nesting[depth]

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
        var width = vars.tooltip.small
      }

      d3plus.tooltip.create({
        "align": align,
        "arrow": arrow,
        "locale": vars.format.locale.value,
        "background": vars.tooltip.background,
        "curtain": vars.tooltip.curtain.color,
        "curtainopacity": vars.tooltip.curtain.opacity,
        "fontcolor": vars.tooltip.font.color,
        "fontfamily": vars.tooltip.font.family.value,
        "fontsize": vars.tooltip.font.size,
        "fontweight": vars.tooltip.font.weight,
        "data": tooltip_data,
        "color": fetchColor(vars,d),
        "allColors": true,
        "footer": params.footer === false ? params.footer : footer,
        "fullscreen": fullscreen,
        "html": html,
        "icon": icon,
        "id": tooltip_id,
        "max_height": params.maxheight,
        "max_width": vars.tooltip.small,
        "mouseevents": mouse,
        "offset": offset,
        "parent": vars.container.value,
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

    if (typeof vars.tooltip.html.value == "string") {
      make_tooltip(vars.tooltip.html.value)
    }
    else if (typeof vars.tooltip.html.value == "function") {
      make_tooltip(vars.tooltip.html.value(id))
    }
    else if (vars.tooltip.html.value && typeof vars.tooltip.html.value == "object" && vars.tooltip.html.value.url) {
      d3.json(vars.tooltip.html.value.url,function(data){
        var html = vars.tooltip.html.value.callback ? vars.tooltip.html.value.callback(data) : data
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
