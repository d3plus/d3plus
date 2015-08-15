var copy = require("../../../../util/copy.coffee"),
    fontTester  = require("../../../../core/font/tester.coffee"),
    form        = require("../../../form.js"),
    print       = require("../../../../core/console/print.coffee"),
    validObject = require("../../../../object/validate.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// If no widths are defined, then this calculates the width needed to fit the
// longest entry in the list.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  var data = [], buffer = 0
  for ( var level in vars.data.nested.all ) {
    var newData = vars.data.nested.all[level]
      , key     = validObject(vars.text.nesting) && level in vars.text.nesting
                ? vars.text.nesting[level][0] : level

    if ( [vars.id.value,vars.text.value].indexOf(key) < 0 ) {
      newData = copy(newData)
      newData.forEach(function(d){
        d[vars.text.value || vars.id.value] = d[key]
      })
    }
    data = data.concat( newData )
  }

  function getWidth( type ) {

    var key  = type === "primary" ? "value" : type
      , icon = key === "value" ? vars.icon.drop.value
             : vars.icon.select.value || vars.icon.drop.value
      , text = key === "value" ? vars.text.value
             : vars.text.secondary.value || vars.text.value
      , font = key === "value" ? vars.font : vars.font.secondary

    if ( vars.dev.value ) print.time("calculating "+type+" width")

    var button = form()
      .container( fontTester() )
      .data({
        "large": 9999,
        "value": data
      })
      .draw({ "update": false })
      .font( font )
      .format(vars.format)
      .icon({ "button": icon, "value": vars.icon.value })
      .id(vars.id.value)
      .timing({
        "ui": 0
      })
      .text( text || vars.id.value )
      .type( "button" )
      .ui({
        "border": type === "primary" ? vars.ui.border : 0,
        "display": "inline-block",
        "margin": 0,
        "padding": vars.ui.padding.css
      })
      .width(false)
      .draw()

    var w = []
    button.selectAll("div.d3plus_node").each(function(o){
      w.push(this.offsetWidth + 1)
    }).remove()

    var dropWidth = {}
    dropWidth[key] = d3.max(w)

    vars.self.width( dropWidth )

    if ( vars.dev.value ) print.timeEnd("calculating "+type+" width")

  }

  if ( typeof vars.width.value !== "number" ) {

    getWidth( "primary" )

  }

  if ( typeof vars.width.secondary !== "number" ) {

    if ( !vars.text.secondary.value || vars.text.value === vars.text.secondary.value ) {
      vars.self.width({"secondary": vars.width.value})
    }
    else {
      getWidth( "secondary" )
    }

  }

}
