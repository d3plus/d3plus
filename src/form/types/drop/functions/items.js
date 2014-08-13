//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Populates item list based on filtered data.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  var active = require("./active.js")

  if (vars.open.value) {

    if ( vars.dev.value ) d3plus.console.time("updating list items")

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
      , deepest = vars.depth.value === vars.id.nesting.length-1

    order.value = vars.text.solo.value.length && vars.text.solo.value[0] !== ""
                ? "d3plus_order" : vars.order.value

    if ( vars.focus.changed || !vars.container.items.focus().length ) {

      vars.container.items
        .focus( vars.focus.value[0] , function(value){

          value = value[0]

          var change = value !== vars.focus.value[0]
          if ( change && vars.active.value ) {

            change = active(vars,value)

          }

          if ( change ) {

            vars.self.focus( value )

          }

          var data = vars.data.filtered.filter(function(f){
            return f[vars.id.value] === value
          })[0]

          if ( vars.depth.value < vars.id.nesting.length - 1 && vars.id.nesting[vars.depth.value+1] in data ) {

            var depth = vars.depth.value
              , solo  = vars.id.solo.value

            vars.history.states.push(function(){

              vars.self
                .depth( depth )
                .id({ "solo" : solo })
                .draw()

            })

            vars.self
              .depth( vars.depth.value + 1 )
              .id({ "solo" : [value] })
              .draw()

          }
          else if ( !vars.depth.changed ) {

            vars.self.open(false).draw()

          }
          else if ( change ) {
            vars.self.draw()
          }

        })

    }

    vars.container.items
      .active( vars.active.value )
      .data({
        "large": large,
        "value": vars.data.filtered
      })
      .draw({
        "update": vars.draw.update
      })
      .font( vars.font.secondary )
      .id( vars.id.value )
      .icon({
        "button": deepest ? false : vars.icon.next,
        "select": deepest ? vars.icon.select : false
      })
      .order( order )
      .text( vars.text.secondary.value || vars.text.value )
      .timing({
        "ui": vars.draw.timing
      })
      .ui({
        "color": {
          "primary": vars.id.nesting.length === 1 ? vars.ui.color.primary.value : vars.ui.color.secondary.value,
          "secondary": vars.ui.color.secondary.value
        },
        "padding": vars.ui.padding
      })
      .draw()

    if ( vars.dev.value ) d3plus.console.timeEnd("updating list items")

  }

}
