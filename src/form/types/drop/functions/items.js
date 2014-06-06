//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Populates item list based on filtered data.
//------------------------------------------------------------------------------
d3plus.input.drop.items = function ( vars ) {

  var self = this

  if (vars.open.value) {

    if (vars.dev.value) d3plus.console.time("updating list items")

    if ( !("items" in vars.container) ) {

      vars.container.items = d3plus.form()
        .container(vars.container.list)
        .type("button")
        .ui({
          "border": 0,
          "display": "block",
          "margin": 0
        })
        .width(false)

    }

    var large = vars.draw.timing ? vars.data.large : 1
      , order = d3plus.util.copy(vars.order)

    order.value = vars.text.solo.value.length && vars.text.solo.value[0] !== ""
                ? "d3plus_order" : vars.order.value

    vars.container.items
      .data({
        "large": large,
        "value": vars.data.filtered
      })
      .draw({
        "update": vars.draw.update
      })
      .focus(vars.focus.value,function(value){

        if ( value !== vars.focus.value ) {

          vars.self.focus( value )

          var newData = vars.data.filtered.filter(function(d){
            return d[vars.id.value] === value
          })
          vars.container.button
            .data(newData)
            .focus(value)
            .draw()

          self.toggle( vars )

        }

      })
      .font( vars.font.secondary )
      .id( vars.id.value )
      .icon( vars.icon.value )
      .order( order )
      .text( vars.text.secondary.value || vars.text.value )
      .timing({
        "ui": vars.draw.timing
      })
      .ui({
        "color": vars.ui.color,
        "padding": vars.ui.padding
      })
      .draw()

    if (vars.dev.value) d3plus.console.timeEnd("updating list items")

  }

}
