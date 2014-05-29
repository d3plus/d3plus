//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//
//------------------------------------------------------------------------------
d3plus.input.button.color = function ( elem , vars ) {

  elem
    .style("background-color",function(d){

      if ( vars.focus.value !== d[vars.id.value] ) {

        if ( vars.hover.value === d[vars.id.value] ) {
          d.d3plus_background = d3.rgb(vars.ui.color.secondary.value).darker(0.5).toString()
        }
        else {
          d.d3plus_background = vars.ui.color.secondary.value
        }

      }
      else {

        if ( vars.hover.value === d[vars.id.value] ) {
          d.d3plus_background = d3.rgb(vars.ui.color.primary.value).darker(0.5).toString()
        }
        else {
          d.d3plus_background = vars.ui.color.primary.value
        }

      }

      return d.d3plus_background
    })
    .style("color",function(d){

      var text_color = d3plus.color.text(d.d3plus_background),
          image = d[vars.icon.value] && vars.data.value.length < vars.data.large

      if (text_color != "#f7f7f7" && vars.focus.value == d[vars.id.value] && d[vars.color.value] && !image) {
        return d3plus.color.legible(d[vars.color.value])
      }

      return text_color

    })
    .style("border-color",vars.ui.color.secondary.value)
    .style("opacity",function(d){
      if (vars.focus.value !== d[vars.id.value]) {
        return 0.75
      }
      return 1
    })

}
