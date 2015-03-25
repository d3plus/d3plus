//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculates the height and orientation of the dropdown list, based on
// available screen space.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  var height = vars.height.secondary,
      button = vars.container.button.container().node().getBoundingClientRect(),
      available = window.innerHeight - button.bottom - vars.ui.border * 2 -
                  vars.ui.margin.top - vars.ui.margin.bottom -
                  vars.ui.padding.top - vars.ui.padding.bottom;

  if (available < button.height * 3) {
    available = button.top-10;
    vars.self.open({"flipped": true});
  }
  // else {
  //   vars.self.open({"flipped": false});
  // }

  if (typeof height !== "number") {
    height = available;
  }

  if (height > vars.height.max) {
    height = vars.height.max;
  }

  vars.self.height({"secondary": height});

};
