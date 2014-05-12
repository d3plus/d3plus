//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws a UI drawer, if defined.
//------------------------------------------------------------------------------
d3plus.ui.drawer = function( vars ) {

  var enabled = vars.ui.value && vars.ui.value.length
    , position = vars.ui.position.value

  var drawer = vars.container.value.selectAll("div#d3plus_drawer")
    .data(["d3plus_drawer"])

  drawer.enter().append("div")
    .attr("id","d3plus_drawer")

  var positionStyles = {}
  vars.ui.position.accepted.forEach(function(p){
    positionStyles[p] = p == position ? "0px" : "auto"
  })

  drawer
    .style("text-align",vars.ui.align.value)
    .style("position","absolute")
    .style("width",vars.width.value-(vars.ui.padding*2)+"px")
    .style("padding",enabled ? vars.ui.padding+"px" : "0px")
    .style(positionStyles)

  var ui = drawer.selectAll("div.d3plus_drawer_ui")
    .data(enabled ? vars.ui.value : [], function(d){
      return d.method || false
    })

  ui.enter().append("div")
    .attr("class","d3plus_drawer_ui")
    .each(function(d){

      var data = []
        , container = d3.select(this)
      d.value.forEach(function(o){

        var obj = {
          "id": o,
          "text": vars.format.value(o)
        }
        data.push(obj)

      })

      d3plus.form()
        .container(container)
        .data(data)
        .focus(vars[d.method].value,function(value){
          if ( value !== vars[d.method].value ) {
            vars.self[d.method](value).draw()
          }
        })
        .id("id")
        .text("text")
        .title(vars.format.value(d.method))
        .type("auto")
        .width(d.width || false)
        .draw()

    })

  ui.exit().remove()
  
  vars.margin[position] += drawer.node().offsetHeight-vars.ui.padding

}
