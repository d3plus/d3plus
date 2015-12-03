var events = require("../../../client/pointer.coffee"),
    textColor = require("../../../color/text.coffee");

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Centered Server Message
//------------------------------------------------------------------------------
module.exports = function(vars,message) {

  message = vars.messages.value ? message : null;

  var size = vars.messages.style.value || (message === vars.error.internal ?
             "large" : vars.messages.style.backup);

  if (size === "large") {
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

  var bg = vars.messages.background.value;
  if (!bg) {
    bg = vars.background.value;
    if (bg === "none" || bg === "transparent") {
      bg = textColor(font.color);
    }
  }

  function style(elem) {

    elem
      .style(font)
      .style("position", "absolute")
      .style("background-color", bg)
      .style("text-align", "center")
      .style("left",function(){
        return position == "center" ? "50%" : "0px"
      })
      .style("width",function(){
        return position == "center" ? "auto" : vars.width.value+"px"
      })
      .style("margin-left",function(){
        return position == "center" ? -(this.offsetWidth/2)+"px" : "0px";
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
          var height = this.offsetHeight || this.getBoundingClientRect().height
          return -height/2+"px"
        }
        return "0px"
      })

  }

  // Enter Message Group
  vars.g.message = vars.container.value.selectAll("div#d3plus_message")
    .data(["message"])

  var enter = vars.g.message.enter().append("div")
    .attr("id","d3plus_message")
    .attr("opacity",0);

  enter.append("div")
    .attr("class", "d3plus_message_text")
    .style("display", "block");

  vars.g.message.select(".d3plus_message_text")
    .text(message ? message : vars.g.message.text())

  var online = navigator.onLine, square = 75;

  var branding = vars.g.message.selectAll(".d3plus_message_branding")
    .data(vars.messages.branding.value && position === "center" ? [0] : []);

  branding.enter().append("div")
    .attr("class", "d3plus_message_branding")
    .style("margin-top", "15px")
    .style("padding-top", "0px")
    .style("display", "block")
    .style("font-size", "11px")
    .style("background-size", square + "px")
    .style("background-position", "center 10px")
    .style("background-repeat", "no-repeat")
    .style("cursor", "pointer")
    .on(events.click, function(){
      window.open("http://www.d3plus.org/", "_blank");
    });

  var logo = d3.hsl(bg).l < 0.5 ? vars.messages.branding.image.dark : vars.messages.branding.image.light;

  branding
    .text(online ? "Powered by:" : "Powered by D3plus")
    .style("background-color", online ? bg : "transparent")
    .style("background-image", online ? "url('" + logo + "')" : "none")
    .style("min-width", online ? square + "px" : "auto")
    .style("height", online ? square + "px" : "auto");

  branding.exit().remove();

  vars.g.message
    .style("display", message ? "inline-block" : "none")
    .call(style).style("opacity", message ? 1 : 0)

}
