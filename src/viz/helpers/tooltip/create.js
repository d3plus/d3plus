var arraySort     = require("../../../array/sort.coffee"),
    createTooltip = require("../../../tooltip/create.js"),
    dataNest      = require("../../../core/data/nest.js"),
    fetchData     = require("./data.js"),
    fetchColor    = require("../../../core/fetch/color.coffee"),
    fetchText     = require("../../../core/fetch/text.js"),
    fetchValue    = require("../../../core/fetch/value.coffee"),
    mergeObject   = require("../../../object/merge.coffee"),
    removeTooltip = require("../../../tooltip/remove.coffee"),
    segments      = require("../shapes/segments.coffee"),
    uniques       = require("../../../util/uniques.coffee"),
    validObject   = require("../../../object/validate.coffee"),
    zoomDirection = require("../zoom/direction.coffee");
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates correctly formatted tooltip for Apps
//-------------------------------------------------------------------
module.exports = function(params) {

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
        zoom = zoomDirection(d, vars)

    if (zoom === -1) {
      var key = vars.id.nesting[dataDepth-1],
          parent = fetchValue(vars,id,key)
    }

    if (zoom === 1 && vars.zoom.value) {
      var text = vars.format.value(vars.format.locale.value.ui.expand)
    }
    else if (zoom === -1 && vars.zoom.value && vars.history.states.length && !vars.tooltip.value.long) {
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

    var footer = text.length ? vars.format.value(text,{"key": "footer", "vars": vars}) : false

  }

  if ("x" in params) {
    var x = params.x;
  }
  else if (vars.types[vars.type.value].tooltip === "static") {
    var x = d.d3plus.x;
    if (vars.zoom.translate && vars.zoom.scale) {
      x = vars.zoom.translate[0]+x*vars.zoom.scale;
    }
    x += vars.margin.left;
    if (params.length !== "long") {
      y += window.scrollX;
      x += vars.container.value.node().getBoundingClientRect().left;
      x += parseFloat(vars.container.value.style("padding-left"), 10);
    }
  }
  else {
    var x = d3.mouse(d3.select("html").node())[0];
  }

  if ("y" in params) {
    var y = params.y;
  }
  else if (vars.types[vars.type.value].tooltip == "static") {
    var y = d.d3plus.y;
    if (vars.zoom.translate && vars.zoom.scale) {
      y = vars.zoom.translate[1]+y*vars.zoom.scale;
    }
    y += vars.margin.top;
    if (params.length !== "long") {
      y += window.scrollY;
      y += vars.container.value.node().getBoundingClientRect().top;
      y += parseFloat(vars.container.value.style("padding-top"), 10);
    }
  }
  else {
    var y = d3.mouse(d3.select("html").node())[1];
  }

  if ("offset" in params) {
    var offset = params.offset;
  }
  else if (vars.types[vars.type.value].tooltip == "static") {
    var offset = d.d3plus.r ? d.d3plus.r : d.d3plus.height/2;
    if (vars.zoom.scale) {
      offset = offset * vars.zoom.scale;
    }
  }
  else {
    var offset = 3;
  }

  function make_tooltip(html) {

    var titleDepth = "depth" in params ? params.depth : dataDepth;

    var ex = {},
        children = {},
        depth     = vars.id.nesting[titleDepth+1] in d ? titleDepth + 1 : titleDepth,
        nestKey   = vars.id.nesting[depth],
        nameList  = "merged" in d.d3plus ? d.d3plus.merged : d[nestKey];

    if (!(nameList instanceof Array)) nameList = [nameList];

    var dataValue = fetchValue( vars , d , vars.size.value );

    if (vars.tooltip.children.value) {

      nameList = nameList.slice(0);

      if (vars.size.value && validObject(nameList[0])) {

        var namesWithValues = nameList.filter(function(n){
          return vars.size.value in n && (!("d3plus" in n) || !n.d3plus.merged);
        });

        var namesNoValues = nameList.filter(function(n){
          return !(vars.size.value in n) || (n.d3plus && n.d3plus.merged);
        });

        arraySort(namesWithValues, vars.size.value, "desc", [], vars);

        nameList = namesWithValues.concat(namesNoValues);

      }

      var limit = length === "short" ? 3 : vars.data.large,
          listLength = nameList.length,
          max   = d3.min([listLength , limit]),
          objs  = [];

      for (var i = 0; i < max; i++) {

        if (!nameList.length) break;

        var obj  = nameList.shift(),
            name = fetchText(vars, obj, depth)[0],
            id   = validObject(obj) ? fetchValue(vars, obj, nestKey, depth) : obj;

        if (id !== d[vars.id.nesting[titleDepth]] && name && !children[name]) {

          var value = fetchValue(vars, obj, vars.size.value, nestKey),
              color = fetchColor(vars, obj, nestKey);

          children[name] = value && !(value instanceof Array) ? vars.format.value(value, {"key": vars.size.value, "vars": vars, "data": obj}) : "";

          if (color) {
            if ( !children.d3plus_colors ) children.d3plus_colors = {};
            children.d3plus_colors[name] = color;
          }

        }
        else {
          i--;
        }

      }

      if ( listLength > max ) {
        children.d3plusMore = listLength - max;
      }

    }

    if (d.d3plus.tooltip) {
      ex = mergeObject(ex, d.d3plus.tooltip);
    }

    function getLabel(method) {
      return typeof vars[method].value === "string" ? vars[method].value :
             vars.format.locale.value.method[method];
    }

    if ( vars.tooltip.size.value ) {
      if (dataValue && typeof vars.size.value !== "number") {
        ex[getLabel("size")] = dataValue;
      }
      if (vars.axes.opposite && vars[vars.axes.opposite].value !== vars.size.value) {
        ex[getLabel(vars.axes.opposite)] = fetchValue(vars, d, vars[vars.axes.opposite].value);
      }
      if (vars.color.valueScale) {
        ex[getLabel("color")] = fetchValue(vars, d, vars.color.value);
      }
    }

    var active = segments(vars, d, "active"),
        temp   = segments(vars, d, "temp"),
        total  = segments(vars, d, "total");

    if (typeof active == "number" && active > 0 && total) {
      ex[getLabel("active")] = active+"/"+total+" ("+vars.format.value((active/total)*100, {"key": "share", "vars": vars, "data": d})+")";
    }

    if (typeof temp == "number" && temp > 0 && total) {
      ex[getLabel("temp")] = temp+"/"+total+" ("+vars.format.value((temp/total)*100, {"key": "share", "vars": vars, "data": d})+")";
    }

    if ( vars.tooltip.share.value && d.d3plus.share ) {
      ex.share = vars.format.value(d.d3plus.share*100, {"key": "share", "vars": vars, "data": d});
    }

    var depth = "depth" in params ? params.depth : dataDepth,
        title = params.title || fetchText(vars,d,depth)[0],
        icon = uniques(d, vars.icon.value, fetchValue, vars, vars.id.nesting[depth]),
        tooltip_data = fetchData(vars,d,length,ex,children,depth)

    if (icon.length === 1 && typeof icon[0] === "string") {
      icon = icon[0];
    }
    else {
      icon = false;
    }

    if ((tooltip_data.length > 0 || footer) || ((!d.d3plus_label && length == "short" && title) || (d.d3plus_label && (!("visible" in d.d3plus_label) || ("visible" in d.d3plus_label && d.d3plus_label.visible === false))))) {

      if (!title) {
        title = id;
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

      var parent = params.length !== "long" ? d3.select("body") : vars.container.value

      createTooltip({
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
        "color": fetchColor(vars, d),
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
        "parent": parent,
        "style": icon_style,
        "title": title,
        "width": width,
        "x": x,
        "y": y
      })

    }
    else {
      removeTooltip(tooltip_id)
    }

  }

  if (fullscreen || params.length === "long") {

    if (typeof vars.tooltip.html.value == "string") {
      make_tooltip(vars.tooltip.html.value)
    }
    else if (typeof vars.tooltip.html.value == "function") {
      make_tooltip(vars.tooltip.html.value(id))
    }
    else if (vars.tooltip.html.value && typeof vars.tooltip.html.value == "object" && vars.tooltip.html.value.url) {
      var tooltip_url = vars.tooltip.html.value.url;
      if (typeof tooltip_url === "function") tooltip_url = tooltip_url(id);
      d3.json(tooltip_url,function(data){
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
