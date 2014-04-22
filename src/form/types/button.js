//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a Button
//------------------------------------------------------------------------------
d3plus.form.button = function(vars,styles,timing) {

  if (vars.dev) d3plus.console.time("calculating borders and padding")
  if (styles.border == "all") {
    var border_width = styles.stroke+"px",
        padding = styles.padding+"px"
  }
  else {
    var sides = ["top","right","bottom","left"]
    var border_width = "", padding = ""
    sides.forEach(function(s,i){
      if (styles.border.indexOf(s) >= 0) {
        border_width += styles.stroke+"px"
        padding += styles.padding+"px"
      }
      else {
        border_width += "0px"
        padding += (styles.padding+styles.stroke)+"px"
      }
      if (i < sides.length-1) {
        border_width += " "
        padding += " "
      }
    })
  }

  var reversed = (styles["font-align"] == "right" && !d3plus.rtl) || (d3plus.rtl && styles["font-align"] == "right")
  if (vars.dev) d3plus.console.timeEnd("calculating borders and padding")

  var color = function(elem) {

    elem
      .style("background-color",function(d){

        if (vars.highlight != d.value) {
          if (vars.hover == d.value) {
            if (vars.highlight) {
              d.bg = d3plus.color.darker(styles.secondary,.05)
            }
            else {
              d.bg = d3plus.color.darker(styles.secondary,.05)
            }
          }
          else {
            d.bg = styles.secondary
          }
        }
        else {
          if (vars.hover == d.value && vars.enabled) {
            d.bg = d3plus.color.darker(styles.color,.025)
          }
          else {
            d.bg = styles.color
          }
        }

        return d.bg
      })
      .style("color",function(d){

        var text_color = d3plus.color.text(d.bg),
            image = d.image && button.size() < vars.large

        if (text_color != "#f7f7f7" && vars.selected == d.value && d.color && !image) {
          return d3plus.color.legible(d.color)
        }

        return text_color

      })
      .style("border-color",styles.secondary)
      .style("opacity",function(d){
        if ([vars.selected,vars.highlight].indexOf(d.value) < 0) {
          return 0.75
        }
        return 1
      })

  }

  var style = function(elem) {

    elem
      .style("position","relative")
      .style("margin",styles.margin+"px")
      .style("display",styles.display)
      .style("border-style","solid")
      .style("border-width",border_width)
      .style("font-family",styles["font-family"])
      .style("font-size",styles["font-size"]+"px")
      .style("font-weight",styles["font-weight"])
      .style("text-align",styles["font-align"])
      .style("letter-spacing",styles["font-spacing"]+"px")

  }

  var icons = function(elem) {

    elem
      .text(function(d){
        return d[vars.text]
      })
      .each(function(d,i){

        var children = []

        if (d.image && button.size() < vars.large) {
          children.push("image")
        }

        if (styles.icon) {
          d.icon = d3plus.util.copy(styles.icon)
          children.push("icon")
        }
        else if (d.value === vars.selected) {
          if (d3plus.font.awesome) {
            d.icon = {
              "class": "fa fa-check",
              "content": ""
            }
          }
          else {
            d.icon = {
              "class": "",
              "content": "&#x2713;"
            }
          }
          children.push("icon")
        }

        var buffer = 0

        var items = d3.select(this).selectAll("div.d3plus_button_element")
          .data(children,function(c,i){
            return c
          })

        items.enter().append("div")
          .style("display","absolute")
          .attr("id",function(c){
            return "d3plus_button_element_"+vars.id+"_"+c
          })
          .attr("class",function(c){
            var extra = ""
            if (c == "icon" && d.icon.class) {
              extra = " "+d[c].class
            }
            return "d3plus_button_element" + extra
          })

        items.order()
          .html(function(c){
            if (c == "icon") {
              return d.icon.content
            }
            else {
              return ""
            }
          })
          .style("background-image",function(c){
            if (c == "image") {
              return "url('"+d.image+"')"
            }
            return "none"
          })
          .style("background-color",function(c){
            if (c == "image" && d.style == "knockout") {
              return d.color || vars.color
            }
            return "transparent"
          })
          .style("background-size","100%")
          .style("text-align","center")
          .style("position",function(c){
            return c == "text" ? "static" : "absolute"
          })
          .style("width",function(c){

            if (styles.height) {
              buffer = (styles.height-(styles.padding*2)-(styles.stroke*2))
            }
            else {
              buffer = styles["font-size"]+styles.padding+styles.stroke
            }
            return buffer+"px"
          })
          .style("height",function(c){
            if (c == "image") {
              return buffer+"px"
            }
            return "auto"
          })
          .style("margin-top",function(c){
            if (this.offsetHeight) {
              var h = this.offsetHeight
            }
            else {
              var h = buffer
              if (c == "icon") h -= 3
            }
            return -h/2+"px"
          })
          .style("top","50%")
          .style("left",function(c){
            if ((c == "image" && !reversed) || (c == "icon" && reversed)) {
              return styles.padding+"px"
            }
            return "auto"
          })
          .style("right",function(c){
            if ((c == "image" && reversed) || (c == "icon" && !reversed)) {
              return styles.padding+"px"
            }
            return "auto"
          })

        items.exit().remove()

        if (buffer > 0) {

          buffer += styles.padding*2

          var p = styles.padding

          if (children.length == 2) {
            var padding = p+"px "+buffer+"px"
          }
          else if ((children[0] == "image" && !d3plus.rtl) || (children[0] == "icon" && d3plus.rtl)) {
            var padding = p+"px "+p+"px "+p+"px "+buffer+"px"
          }
          else {
            var padding = p+"px "+buffer+"px "+p+"px "+p+"px"
          }

          d3.select(this).style("padding",padding)

        }
        else {
          d3.select(this).style("padding",styles.padding+"px")
        }

        if (typeof styles.width == "number") {
          var width = styles.width
          width -= parseFloat(d3.select(this).style("padding-left"),10)
          width -= parseFloat(d3.select(this).style("padding-right"),10)
          width -= styles.stroke*2
          width += "px"
        }
        else {
          var width = "auto"
        }

        d3.select(this).style("width",width)

      })

  }

  function mouseevents(elem) {

    elem
      .on(d3plus.evt.over,function(d,i){

        vars.hover = d.value

        if (vars.data.array.length == 1 || d.value != vars.highlight) {

          if (d3plus.ie || vars.timing.transitions == 0) {

            d3.select(this).style("cursor","pointer")
              .call(color)

          }
          else {

            d3.select(this).style("cursor","pointer")
              .transition().duration(100)
              .call(color)
          }

        }
        else {
          d3.select(this).style("cursor","auto")
        }

      })
      .on(d3plus.evt.out,function(d){

        vars.hover = false

        if (d3plus.ie || button.size() >= vars.large) {
          d3.select(this).style("cursor","auto")
            .call(color)
        }
        else {
          d3.select(this).style("cursor","auto")
            .transition().duration(100)
            .call(color)
        }

      })
      .on("click",function(d){

        if (!vars.propagation) {
          d3.event.stopPropagation()
        }

        if (vars.callback && d.value) {

          vars.callback(d)

        }

      })

  }

  var button = vars.container.selectAll("div.d3plus_node")
    .data(vars.data.array,function(d){
      return d.id || d.value
    })

  if (vars.dev) d3plus.console.time("enter")
  button.enter().append("div")
    .attr("id","d3plus_button_"+vars.id)
    .attr("class","d3plus_node")
    .call(color)
    .call(style)
    .call(icons)
    .call(mouseevents)
  if (vars.dev) d3plus.console.timeEnd("enter")

  if (vars.draw.update || button.size() < vars.large) {

    if (vars.dev) d3plus.console.time("ordering")
    button.order()
    if (vars.dev) d3plus.console.timeEnd("ordering")

    var updates = button

  }
  else {

    var checks = [
      vars.previous,
      vars.selected,
      vars.highlight,
      vars.hover,
      vars.hover_previous
    ].filter(function(c){
        return c
      })

    var updates = button.filter(function(b){
      return checks.indexOf(b.value) >= 0
    })

  }

  if (vars.dev) d3plus.console.time("update")
  if (vars.timing.transitions) {
    updates
      .transition().duration(vars.timing.transitions)
      .call(color)
      .call(style)
  }
  else {
    updates
      .call(color)
      .call(style)
  }
  updates.call(icons).call(mouseevents)
  if (vars.dev) d3plus.console.timeEnd("update")

  button.exit().remove()

}
