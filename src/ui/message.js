//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Centered Server Message
//------------------------------------------------------------------------------
d3plus.ui.message = function(vars,message) {

  var message = vars.messages.value ? message : null

  if (vars.messages.style == "large") {
    var font = vars.style.message,
        position = "center"
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

    var position = font.position

  }

  var font = {
    "color": font["font-color"],
    "font-family": font["font-family"],
    "font-weight": font["font-weight"],
    "font-size": font["font-size"]+"px",
    "padding": font.padding+"px"
  }

  var background = vars.style.background != "none" ? vars.style.background : "white"

  function style(elem) {

    elem
      .text(text)
      .style(font)
      .style("position","absolute")
      .style("background",background)
      .style("left","50%")
      .style("text-align","center")
      .style("width",function(){
        return position == "center" ? "auto" : vars.width.value+"px"
      })
      .style("margin-left",function(){
        var width = this.offsetWidth
        return -width/2+"px"
      })
      .style("top",function(){
        if (position == "center") {
          return "50%";
        }
        else if (position == "top") {
          return "0px"
        }
        else {
          return (vars.margin.top+vars.app_height)+"px"
        }
      })
      .style("margin-top",function(){
        if (vars.messages.style == "large") {
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
    .call(style)

  var opacity = message ? 1 : 0,
      text = message ? message : vars.g.message.text(),
      display = message ? "inline-block" : "none"

  vars.g.message
    .text(text)
    .call(style)
    // .transition().duration(vars.style.timing.mouseevents)
    .style("opacity",opacity)
    .style("display",display)

}
