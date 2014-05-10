//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Recursive function that applies a click event to all parent windows that
// will close the dropdown if it is open.
//------------------------------------------------------------------------------
d3plus.input.drop.window = function ( vars , elem ) {

  var self = this

  if ( elem === undefined ) {
    var elem = window
  }

  d3.select(elem).on("click."+vars.container.id,function(){

    var element = d3.event.target || d3.event.toElement

    if (!d3plus.util.child(vars.container.value,element) && vars.open.value) {
      self.toggle( vars )
    }

  })

  try {
    var same_origin = window.parent.location.host === window.location.host;
  }
  catch (e) {
    var same_origin = false
  }

  if (same_origin) {
    if (elem.self !== window.top) {
      self.window( vars , elem.parent )
    }
  }

}
