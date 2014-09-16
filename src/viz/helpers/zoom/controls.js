var events = require("../../../client/pointer.coffee")

module.exports = function() {

  d3.select("#d3plus.utilsts.zoom_controls").remove()

  if (!vars.small) {
    // Create Zoom Controls
    var zoom_enter = vars.container.value.append("div")
      .attr("id","d3plus.utilsts.zoom_controls")
      .style("top",(vars.margin.top+5)+"px")

    zoom_enter.append("div")
      .attr("id","zoom_in")
      .attr("unselectable","on")
      .on(events.click,function(){ vars.zoom("in") })
      .text("+")

    zoom_enter.append("div")
      .attr("id","zoom_out")
      .attr("unselectable","on")
      .on(events.click,function(){ vars.zoom("out") })
      .text("-")

    zoom_enter.append("div")
      .attr("id","zoom_reset")
      .attr("unselectable","on")
      .on(events.click,function(){
        vars.zoom("reset")
        vars.draw.update()
      })
      .html("\&#8634;")
  }

  /* Old Styles

  #zoom_controls {
    position: absolute;
    top: 5px;
    left: 5px;
    z-index: 50;
  }

  #zoom_in, #zoom_out, #zoom_reset {
    background-color: #ffffff;
    background-position: 50% 50%;
    background-repeat: no-repeat;
    -webkit-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
       -moz-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    color: #333333;
    display: block;
    height: 18px;
    margin-bottom: 5px;
    opacity: 0.75;
    text-align: center;
    width: 18px;
    -webkit-text-size-adjust: none;
         -webkit-user-select: none;
            -moz-user-select: none;
  }

  #zoom_in:hover, #zoom_out:hover, #zoom_reset:hover {
    opacity: 1;
  }

  #zoom_in {
    cursor: pointer;
    font: normal 18px/20px Arial, Helvetica, sans-serif;
  }

  #zoom_out {
    cursor: pointer;
    font: normal 22px/16px Tahoma, Verdana, sans-serif;
  }

  #zoom_reset {
    cursor: pointer;
    font: bold 15px/19px Arial, Helvetica, sans-serif;
  }

  */

}
