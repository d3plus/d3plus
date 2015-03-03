//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculates the height and orientation of the dropdown list, based on
// available screen space.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  var button = vars.container.button.container().node().getBoundingClientRect();

  vars.height.secondary = window.innerHeight - button.bottom -
                          vars.ui.margin.top - vars.ui.margin.bottom -
                          vars.ui.padding.top - vars.ui.padding.bottom -
                          vars.ui.border * 2;

  if ( vars.height.secondary < button.height*3 ) {
    vars.height.secondary = button.top-10;
    vars.self.open({"flipped": true});
  }
  else {
    vars.self.open({"flipped": false});
  }

  var scrolling = false;
  if (vars.height.secondary > vars.height.max) {
    vars.height.secondary = vars.height.max;
  }

};
