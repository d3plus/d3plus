//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Centered Server Message
//------------------------------------------------------------------------------
d3plus.ui.message = function(vars,message) {

  var message = vars.messages.value ? message : null

  if (vars.messages.style == "large") {
    var font = "message",
        top = "50%"
  }
  else {

    if (vars.title.value) {
      var font = vars.style.title
    }
    else if (vars.title.sub.value) {
      var font = vars.style.title.sub
    }
    else if (vars.title.total.value) {
      var font = vars.style.title.total
    }
    else {
      var font = vars.style.footer
    }

    if (font.position == "top") {
      var top = "0px"
    }
    else {
      var top = (vars.margin.top+vars.app_height)+"px"
    }

  }

  var font = {
    "color": font["font-color"],
    "font-family": font["font-family"],
    "font-weight": font["font-weight"],
    "font-size": font["font-size"]+"px"
  }

  function style(elem) {

    elem
      .text(text)
      .style("position","absolute")
      .style("background",vars.style.message.background)
      .style("padding",vars.style.message.padding+"px")
      .style("left","50%")
      .style("margin-left",function(){
        var width = this.offsetWidth
        return -width/2+"px"
      })
      .style("top",top)
      .style("margin-top",function(){
        if (vars.messages.style == "large") {
          var height = this.offsetHeight
          return -height/2+"px"
        }
        return "0px"
      })
      .style(font)

  }

  // Enter Message Group
  vars.g.message = vars.parent.selectAll("div#d3plus_message")
    .data(["message"])

  vars.g.message.enter().append("div")
    .attr("id","d3plus_message")
    .attr("opacity",0)
    .call(style)

  var opacity = message ? 1 : 0,
      text = message ? message : vars.g.message.text()

  vars.g.message
    .text(text)
    .call(style)
    // .transition().duration(vars.style.timing.mouseevents)
    .style("opacity",opacity)

}
