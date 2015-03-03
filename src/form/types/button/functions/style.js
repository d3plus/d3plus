//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//
//------------------------------------------------------------------------------
module.exports = function ( elem , vars ) {

  elem
    .style("position","relative")
    .style("margin",vars.ui.margin.css)
    .style("display",vars.ui.display.value)
    .style("border-style","solid")
    .style("border-width",vars.ui.border+"px")
    .style("font-family",vars.font.family.value)
    .style("font-size",vars.font.size+"px")
    .style("font-weight",vars.font.weight)
    .style("letter-spacing",vars.font.spacing+"px")

}
