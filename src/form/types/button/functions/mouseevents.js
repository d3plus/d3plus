var events = require("../../../../client/pointer.coffee"),
    ie = require("../../../../client/ie.js")

module.exports = function ( elem , vars , color ) {

  elem
    .on(events.over,function(d,i){

      vars.self.hover(d[vars.id.value])

      if ( ie || !vars.draw.timing ) {

        d3.select(this).style("cursor","pointer")
          .call( color , vars )

      }
      else {

        d3.select(this).style("cursor","pointer")
          .transition().duration(vars.timing.mouseevents)
          .call( color , vars )
      }

    })
    .on(events.out,function(d){

      vars.self.hover(false)

      if ( ie || !vars.draw.timing ) {
        d3.select(this).style("cursor","auto")
          .call( color , vars )
      }
      else {
        d3.select(this).style("cursor","auto")
          .transition().duration(vars.timing.mouseevents)
          .call( color , vars )
      }

    })
    .on(events.click,function(d){

      if ( vars.id.value in d ) {

        vars.self.focus(d[vars.id.value]).draw()

      }

    })

}
