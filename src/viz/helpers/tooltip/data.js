var copy = require("../../../util/copy.coffee"),
    fetchValue   = require("../../../core/fetch/value.coffee"),
    fetchColor   = require("../../../core/fetch/color.coffee"),
    fetchText    = require("../../../core/fetch/text.js"),
    legible      = require("../../../color/legible.coffee"),
    mergeObject  = require("../../../object/merge.coffee"),
    prefix       = require("../../../client/prefix.coffee"),
    stringFormat = require("../../../string/format.js"),
    validObject  = require("../../../object/validate.coffee");
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a data object for the Tooltip
//------------------------------------------------------------------------------
module.exports = function(vars, id, length, extras, children, depth) {

  if (vars.small) {
    return []
  }

  if (!length) var length = "long"
  if (length == "long") {
    var other_length = "short"
  }
  else {
    var other_length = "long"
  }

  var extra_data = {}
  if (extras && typeof extras == "string") extras = [extras]
  else if (extras && typeof extras == "object") {
    extra_data = mergeObject(extra_data,extras)
    var extras = []
    for ( var k in extra_data ) {
      extras.push(k)
    }
  }
  else if (!extras) var extras = []

  var tooltip_highlights = []

  if (vars.tooltip.value instanceof Array) {
    var a = vars.tooltip.value
  }
  else if (typeof vars.tooltip.value == "string") {
    var a = [vars.tooltip.value]
  }
  else {

    if (vars.tooltip.value[vars.id.nesting[depth]]) {
      var a = vars.tooltip.value[vars.id.nesting[depth]]
    }
    else {
      var a = vars.tooltip.value
    }

    if (!(a instanceof Array)) {

      if (a[length]) {
        a = a[length]
      }
      else if (a[other_length]) {
        a = []
      }
      else {
        a = mergeObject({"":[]},a)
      }

    }

    if (typeof a == "string") {
      a = [a]
    }
    else if (!(a instanceof Array)) {
      a = mergeObject({"":[]},a)
    }

  }

  function format_key(key,group) {

    if (vars.attrs.value[group]) var id_var = group
    else var id_var = null

    if (group) group = vars.format.value(group)

    var value = extra_data[key] || fetchValue(vars,id,key,id_var)

    if (validObject(value)) {
      tooltip_data.push({
        "name": vars.format.value(key),
        "value": vars.format.value(value.value, {"key": value.key, "vars": vars}),
        "group": group
      })
    }
    else if (value != null && value != "undefined" && !(value instanceof Array) && ((typeof value === "string" && value.indexOf("d3plus_other") < 0) || !(typeof value === "string"))) {
      var name = vars.format.locale.value.ui[key]
               ? vars.format.value(vars.format.locale.value.ui[key])
               : vars.format.value(key),
          h = tooltip_highlights.indexOf(key) >= 0

      if ( value instanceof Array ) {
        value.forEach(function(v){
          v = vars.format.value(v, {"key": key, "vars": vars, "data": id})
        })
      }
      else {
        value = vars.format.value(value, {"key": key, "vars": vars, "data": id})
      }

      var obj = {"name": name, "value": value, "highlight": h, "group": group}

      if ( vars.descs.value ) {

        if ( typeof vars.descs.value === "function" ) {
          var descReturn = vars.descs.value( key )
          if ( typeof descReturn === "string" ) {
            obj.desc = descReturn
          }
        }
        else if ( key in vars.descs.value ) {
          obj.desc = vars.descs.value[key]
        }

      }

      tooltip_data.push(obj)

    }

  }

  var tooltip_data = []
  if (a.constructor === Array) a = {"": a};

  if (vars.id.nesting.length && depth < vars.id.nesting.length-1) {
    var a = copy(a)
    vars.id.nesting.forEach(function(n,i){
      if (i > depth && a[n]) delete a[n]
    })
  }

  for (var group in a) {
    if (a[group].constructor !== Array) a[group] = [a[group]]
    for (var i = extras.length; i > 0; i--) {
      if (a[group].indexOf(extras[i-1]) >= 0) {
        extras.splice(i-1, 1);
      }
    }
  }

  if (vars.tooltip.value.long && typeof vars.tooltip.value.long == "object") {
    var placed = []

    for (var group in vars.tooltip.value.long) {

      for (var i = extras.length; i > 0; i--) {
        var e = extras[i-1];
        if (vars.tooltip.value.long[group].indexOf(e) >= 0) {
          if (!a[group]) a[group] = [];
          a[group].push(e);
          extras.splice(i-1, 1);
        }
      }

    }

  }

  if (extras.length) {
    if (!a[""]) a[""] = []
    a[""] = a[""].concat(extras);
  }

  for (var group in a) {
    a[group].forEach(function(t){
      format_key(t, group);
    });
  }

  if ( children ) {

    var title  = vars.format.locale.value.ui.including
      , colors = children.d3plus_colors

    children.values.forEach(function(child) {
      var name = d3.keys(child)[0];
      tooltip_data.push({
        "group": vars.format.value(title),
        "highlight": colors && colors[name] ? colors[name] : false,
        "name": name,
        "value": child[name]
      })
    });

    if (children.d3plusMore) {

      tooltip_data.push({
        "group": vars.format.value(title),
        "highlight": true,
        "name": stringFormat(vars.format.locale.value.ui.more, children.d3plusMore),
        "value": ""
      })

    }

  }

  if ( vars.tooltip.connections.value && length === "long" ) {

    var connections = vars.edges.connections( id[vars.id.value] , vars.id.value , true )

    if ( connections.length ) {
      connections.forEach(function(conn){

        var c = vars.data.viz.filter(function(d){
          return d[vars.id.value] === conn[vars.id.value]
        })

        var c = c.length ? c[0] : conn

        var name = fetchText(vars,c)[0],
            color = fetchColor(vars,c),
            size = vars.tooltip.font.size,
            radius = vars.shape.value == "square" ? 0 : size
            styles = [
              "background-color: "+color,
              "border-color: "+legible(color),
              "border-style: solid",
              "border-width: "+vars.data.stroke.width+"px",
              "display: inline-block",
              "height: "+size+"px",
              "left: 0px",
              "position: absolute",
              "width: "+size+"px",
              "top: 0px",
              prefix()+"border-radius: "+radius+"px",
            ]
            node = "<div style='"+styles.join("; ")+";'></div>"

        var nodeClick = function() {
          vars.self.focus([c[vars.id.value]]).draw()
        }

        tooltip_data.push({
          "group": vars.format.value(vars.format.locale.value.ui.primary),
          "highlight": false,
          "link": nodeClick,
          "name": "<div id='d3plustooltipfocuslink_"+c[vars.id.value]+"' class='d3plus_tooltip_focus_link' style='position:relative;padding-left:"+size*1.5+"px;'>"+node+name+"</div>"
        })

      })
    }

  }

  return tooltip_data

}
