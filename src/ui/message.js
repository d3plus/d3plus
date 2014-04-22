//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Centered Server Message
//------------------------------------------------------------------------------
d3plus.ui.message = function(vars,message) {

  var message = vars.messages.value ? message : null,
      size = message == vars.internal_error ? "large" : vars.messages.style

  if (size == "large") {
    var font = vars.messages,
        position = "center"
  }
  else {

    if (vars.footer.value) {
      var font = vars.footer
    }
    else if (vars.title.value) {
      var font = vars.title
    }
    else if (vars.title.sub.value) {
      var font = vars.title.sub
    }
    else if (vars.title.total.value) {
      var font = vars.title.total
    }
    else {
      var font = vars.title.sub
    }

    var position = font.position

  }

  var font = {
    "color": font.font.color,
    "font-family": font.font.family.value,
    "font-weight": font.font.weight,
    "font-size": font.font.size+"px",
    "padding": font.padding+"px"
  }

  var background = vars.background.value != "none" ? vars.background.value : "white"

  function style(elem) {

    elem
      .style(font)
      .style("position","absolute")
      .style("background",background)
      .style("text-align","center")
      .style("left",function(){
        return position == "center" ? "50%" : "0px"
      })
      .style("width",function(){
        return position == "center" ? "auto" : vars.width.value+"px"
      })
      .style("margin-left",function(){
        var offset = vars.width.value-vars.app_width
        return position == "center" ? -(this.offsetWidth/2+offset/2)+"px" : "0px"
      })
      .style("top",function(){
        if (position == "center") {
          return "50%";
        }
        else if (position == "top") {
          return "0px"
        }
        else {
          return "auto"
        }
      })
      .style("bottom",function(){
        if (position == "bottom") {
          return "0px"
        }
        else {
          return "auto"
        }
      })
      .style("margin-top",function(){
        if (size == "large") {
          var height = this.offsetHeight
          return -height/2+"px"
        }
        return "0px"
      })

  }

  // Enter Message Group
  vars.g.message = vars.parent.selectAll("div#d3plus_message")
    .data(["message"])

  vars.g.message.enter().append("div")
    .attr("id","d3plus_message")
    .attr("opacity",0)

  var opacity = message ? 1 : 0,
      text = message ? message : vars.g.message.text(),
      display = message ? "inline-block" : "none"

  vars.g.message
    .text(text)
    .call(style)
    // .transition().duration(vars.timing.mouseevents)
    .style("opacity",opacity)
    .style("display",display)

}
