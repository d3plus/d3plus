var prefix = require("../../../../client/prefix.coffee"),
    rtl = require("../../../../client/rtl.coffee")

module.exports = function ( elem , vars ) {

  var reversed = (vars.font.align.value === "right" && !rtl)
                 || (rtl && vars.font.align.value === "right")

  elem
    .each(function(d,i){

      var children = ["label"]

      if ( d[vars.icon.value] && vars.data.viz.length <= vars.data.large ) {
        children.push("icon")
      }

      var iconGraphic = vars.icon.button.value
      if ( d[vars.id.value] === vars.focus.value && vars.icon.select.value ) {
        iconGraphic = vars.icon.select.value
        children.push("selected")
      }
      else if ( iconGraphic && d.d3plus.icon !== false ) {
        children.push("selected")
      }

      var buffer = 0

      var items = d3.select(this).selectAll("div.d3plus_button_element")
        .data(children,function(c){
          return c
        })

      items.enter().append("div")
        .style("display",function(c){
          return c === "label" ? "block" : "absolute"
        })

      items.order()
        .attr("class",function(c){
          var extra = ""
          if ( c === "selected" && iconGraphic.indexOf("fa-") === 0 ) {
            extra = " fa "+iconGraphic
          }
          return "d3plus_button_element d3plus_button_" + c + extra
        })
        .html(function(c){
          if ( c === "label" ) {
            var k = vars.text.value && vars.text.value in d && !(d[vars.text.value] instanceof Array)
                  ? vars.text.value : vars.id.value
            return vars.format.value(d[k])
          }
          return c === "selected" && iconGraphic.indexOf("fa-") < 0
                 ? iconGraphic : ""
        })
        .style("background-image",function(c){
          if (c === "icon") {
            return "url('"+d[vars.icon.value]+"')"
          }
          return "none"
        })
        .style("background-color",function(c){
          if (c === "icon" && d.style === "knockout") {
            return d[vars.color.value] || vars.ui.color.primary.value
          }
          return "transparent"
        })
        .style("background-size","100%")
        .style("text-align",function(c){
          return c === "label" ? vars.font.align.value : "center"
        })
        .style("position",function(c){
          return c == "label" ? "static" : "absolute"
        })
        .style("width",function(c){

          if ( c === "label" ) {
            return "auto"
          }

          if (vars.height.value) {
            buffer = (vars.height.value-(vars.ui.padding.top + vars.ui.padding.bottom)-(vars.ui.border*2));
          }
          else {
            buffer = vars.font.size+vars.ui.border;
          }
          return buffer+"px"
        })
        .style("height",function(c){
          if ( c === "icon" ) {
            return buffer+"px"
          }
          return "auto"
        })
        .style("margin-top",function(c){
          if ( c === "label" ) {
            return "0px"
          }
          if (this.offsetHeight || this.getBoundingClientRect().height) {
            var h = this.offsetHeight || this.getBoundingClientRect().height
          }
          else if ( c === "selected" ) {
            var h = vars.font.size
          }
          else {
            var h = buffer
          }
          return -h/2+"px"
        })
        .style("top",function(c){
          return c === "label" ? "auto" : "50%"
        })
        .style("left",function(c){
          if ((c === "icon" && !reversed) || (c === "selected" && reversed)) {
            return vars.ui.padding.left+"px"
          }
          return "auto"
        })
        .style("right",function(c){
          if ((c === "icon" && reversed) || (c === "selected" && !reversed)) {
            return vars.ui.padding.right+"px"
          }
          return "auto"
        })
        .style(prefix()+"transition",function(c){
          return c === "selected" ? (vars.draw.timing/1000)+"s" : "none"
        })
        .style(prefix()+"transform",function(c){
          var degree = c === "selected" ? vars.icon.select.rotate : "none"
          return typeof degree === "string" ? degree : "rotate("+degree+"deg)"
        })
        .style("opacity",function(c){
          return c === "selected" ? vars.icon.select.opacity : 1
        })

      items.exit().remove()

      var text = d3.select(this).selectAll(".d3plus_button_label")

      if (buffer > 0) {

        var p = vars.ui.padding;

        if (children.length === 3) {
          p = p.top+"px "+(p.right*2+buffer)+"px "+p.bottom+"px "+(p.left*2+buffer)+"px";
        }
        else if ((children.indexOf("icon") >= 0 && !rtl) || (children.indexOf("selected") >= 0 && rtl)) {
          p = p.top+"px "+p.right+"px "+p.bottom+"px "+(p.left*2+buffer)+"px";
        }
        else {
          p = p.top+"px "+(p.right*2+buffer)+"px "+p.bottom+"px "+p.left+"px";
        }

        text.style("padding", p)

      }
      else {
        text.style("padding",vars.ui.padding.css)
      }

      if (typeof vars.width.value === "number") {
        var width = vars.width.value
        width -= parseFloat(text.style("padding-left"),10)
        width -= parseFloat(text.style("padding-right"),10)
        width -= vars.ui.border*2
        width += "px"
      }
      else {
        var width = "auto"
      }

      text.style("width",width)

    })

}
