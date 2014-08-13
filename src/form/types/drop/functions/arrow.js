//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Toggles the state of the dropdown menu.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  if ( vars.dev.value ) d3plus.console.time("rotating arrow")

  var offset = vars.icon.drop.value === "&#x276f;" ? 90 : 0

  if (vars.open.value != vars.open.flipped.value) {
    var rotate = 180 + offset
  }
  else {
    var rotate = offset
  }

  vars.container.button
    .icon({
      "select": {
        "opacity": vars.open.value ? 0.5 : 1,
        "rotate": rotate
      }
    })
    .draw()

  if ( vars.dev.value ) d3plus.console.timeEnd("rotating arrow")

}
