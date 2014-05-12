//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// If no widths are defined, then this calculates the width needed to fit the
// longest entry in the list.
//------------------------------------------------------------------------------
d3plus.input.drop.width = function ( vars ) {

  function getWidth( type ) {

    var key  = type === "primary" ? "value" : type
      , icon = key === "value" ? vars.icon.drop.value
             : vars.icon.select.value || vars.icon.drop.value
      , text = key === "value" ? vars.text.value
             : vars.text.secondary.value || vars.text.value

    if (vars.dev.value) d3plus.console.time("calculating "+type+" width")

    var button = d3plus.form()
      .container(d3plus.font.tester())
      .data({
        "large": 9999,
        "value": vars.data.value
      })
      .draw({ "update": false })
      .icon({ "button": icon, "value": vars.icon.value })
      .id(vars.id.value)
      .timing({
        "ui": 0
      })
      .text( text )
      .type( "button" )
      .ui({
        "border": "none",
        "display": "inline-block",
        "margin": 0
      })
      .width(false)
      .draw()

    var w = []
    button.selectAll("div.d3plus_node").each(function(o){
      w.push(this.offsetWidth)
    }).remove()

    var dropWidth = {}
    dropWidth[key] = d3.max(w) + vars.ui.border*2

    vars.self.width( dropWidth )

    if (vars.dev.value) d3plus.console.timeEnd("calculating "+type+" width")

  }

  if ( typeof vars.width.secondary !== "number" ) {

    if ( typeof vars.width.value === "number" ) {
      vars.self.width({"secondary": vars.width.value})
    }
    else {
      getWidth( "secondary" )
    }

  }

  if ( typeof vars.width.value !== "number" ) {

    if ( vars.text.value === vars.text.secondary ) {
      vars.self.width(vars.width.secondary)
    }
    else {
      getWidth( "primary" )
    }
  }

}
