//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//
//------------------------------------------------------------------------------
d3plus.input.button.icons = function ( elem , vars ) {

  var reversed = (vars.font.align.value === "right" && !d3plus.rtl)
                 || (d3plus.rtl && vars.font.align.value === "right")

  elem
    .text(function(d){
      return d[vars.text.value]
    })
    .each(function(d,i){

      var children = []

      if (d[vars.icon.value] && vars.data.value.length <= vars.data.large) {
        children.push(vars.icon.value)
      }

      var iconGraphic = vars.icon.button.value
      if ( d[vars.id.value] === vars.focus.value && vars.icon.select.value ) {
        iconGraphic = vars.icon.select.value
        children.push("selected")
      }
      else if ( vars.icon.button.value ) {
        children.push("selected")
      }

      var buffer = 0

      var items = d3.select(this).selectAll("div.d3plus_button_element")
        .data(children,function(c,i){
          return c
        })

      items.enter().append("div")
        .style("display","absolute")
        .attr("class",function(c){
          var extra = ""
          if ( c === "selected" && iconGraphic.indexOf("fa-") === 0 ) {
            extra = " fa "+vars.icon.select.value
          }
          return "d3plus_button_element d3plus_button_" + c + extra
        })

      items.order()
        .html(function(c){
          if ( c == "selected" && iconGraphic.indexOf("fa-") < 0 ) {
            return iconGraphic
          }
          else {
            return ""
          }
        })
        .style("background-image",function(c){
          if (c == vars.icon.value) {
            return "url('"+d[vars.icon.value]+"')"
          }
          return "none"
        })
        .style("background-color",function(c){
          if (c === vars.icon.value && d.style === "knockout") {
            return d[vars.color.value] || vars.ui.color.primary.value
          }
          return "transparent"
        })
        .style("background-size","100%")
        .style("text-align","center")
        .style("position",function(c){
          return c == "text" ? "static" : "absolute"
        })
        .style("width",function(c){

          if (vars.height.value) {
            buffer = (vars.height.value-(vars.ui.padding*2)-(vars.ui.border*2))
          }
          else {
            buffer = vars.font.size+vars.ui.padding+vars.ui.border
          }
          return buffer+"px"
        })
        .style("height",function(c){
          if ( c === vars.icon.value ) {
            return buffer+"px"
          }
          return "auto"
        })
        .style("margin-top",function(c){
          if (this.offsetHeight) {
            var h = this.offsetHeight
          }
          else if ( c === "selected" ) {
            var h = vars.font.size
          }
          else {
            var h = buffer
          }
          return -h/2+"px"
        })
        .style("top","50%")
        .style("left",function(c){
          if ((c == vars.icon.value && !reversed) || (c === "selected" && reversed)) {
            return vars.ui.padding+"px"
          }
          return "auto"
        })
        .style("right",function(c){
          if ((c == vars.icon.value && reversed) || (c === "selected" && !reversed)) {
            return vars.ui.padding+"px"
          }
          return "auto"
        })
        .style(d3plus.prefix()+"transition",function(c){
          return c === "selected" ? (vars.draw.timing/1000)+"s" : "none"
        })
        .style(d3plus.prefix()+"transform",function(c){
          var degree = c === "selected" ? vars.icon.select.rotate : "none"
          return "rotate("+degree+"deg)"
        })
        .style("opacity",function(c){
          return c === "selected" ? vars.icon.select.opacity : 1
        })


      items.exit().remove()

      if (buffer > 0) {

        buffer += vars.ui.padding*2

        var p = vars.ui.padding

        if (children.length === 2) {
          var padding = p+"px "+buffer+"px"
        }
        else if ((children[0] === vars.icon.value && !d3plus.rtl) || (children[0] == "selected" && d3plus.rtl)) {
          var padding = p+"px "+p+"px "+p+"px "+buffer+"px"
        }
        else {
          var padding = p+"px "+buffer+"px "+p+"px "+p+"px"
        }

        d3.select(this).style("padding",padding)

      }
      else {
        d3.select(this).style("padding",vars.ui.padding+"px")
      }

      if (typeof vars.width.value === "number") {
        var width = vars.width.value
        width -= parseFloat(d3.select(this).style("padding-left"),10)
        width -= parseFloat(d3.select(this).style("padding-right"),10)
        width -= vars.ui.border*2
        width += "px"
      }
      else {
        var width = "auto"
      }

      d3.select(this).style("width",width)

    })

}
