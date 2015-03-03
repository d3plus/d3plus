var items = require("./items.coffee"),
    height     = require("./height.js"),
    print      = require("../../../../core/console/print.coffee"),
    scrolllist = require("./scroll.js"),
    arrow      = require("./arrow.js")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Redraws only the drop down list.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If the menu is open, set the container element's z-index to '9999'.
  //----------------------------------------------------------------------------
  if ( vars.draw.timing ) {

    vars.container.ui.transition().duration(vars.draw.timing)
      .each("start",function(){
        if (vars.open.value) {
          d3.select(this).style("z-index",9999)
        }
      })
      .style("margin",vars.ui.margin.css)
      .each("end",function(){
        if (!vars.open.value) {
          d3.select(this).style("z-index","auto")
        }
      })

  }
  else {

    vars.container.ui
      .style("margin",vars.ui.margin.css)
      .style("z-index",function(){
        if (vars.open.value) {
          return 9999
        }
        else {
          return "auto"
        }
      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update list items based on filtered data.
  //----------------------------------------------------------------------------
  items( vars )

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate the height and orientation of the dropdown list.
  //----------------------------------------------------------------------------
  height( vars )

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate scroll position of dropdown menu.
  //----------------------------------------------------------------------------
  scrolllist( vars )

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Rotate the dropdown button arrow appropriately.
  //----------------------------------------------------------------------------
  arrow( vars )

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update List
  //----------------------------------------------------------------------------
  if ( vars.dev.value ) print.time("drawing list")

  function position(elem) {
    var flipped = vars.open.flipped.value
    elem
      .style("top",function(){
        return flipped ? "auto" : vars.margin.top-vars.ui.border+"px";
      })
      .style("bottom",function(){
        return flipped ? vars.margin.top+vars.ui.border+"px" : "auto";
      });
  }

  function update(elem) {

    elem
      .style("left",function(){
        if (vars.font.align.value === "left") {
          return vars.margin.left+"px";
        }
        else if (vars.font.align.value === "center") {
          return vars.margin.left-((vars.width.secondary-vars.width.value)/2)+"px";
        }
        else {
          return "auto";
        }
      })
      .style("right",function(){
        return vars.font.align.value === "right" ? "0px" : "auto";
      })
      .style("height",vars.container.listHeight+"px")
      .style("padding",vars.ui.border+"px")
      .style("background-color",vars.ui.color.secondary.value)
      .style("z-index",function(){
        return vars.open.value ? "9999" : "-1";
      })
      .style("width",(vars.width.secondary-(vars.ui.border*2))+"px")
      .style("opacity",vars.open.value ? 1 : 0)
      .call(position);

  }

  function finish(elem) {

    elem.style("display", vars.open.value ? null : "none")
      .call(position);


    if (vars.search.enabled && vars.open.value) {
      vars.container.selector.select("div.d3plus_drop_search input").node().focus()
    }

  }

  var max_height = vars.open.value ? vars.height.secondary - vars.margin.title: 0;

  if (!vars.draw.timing) {

    vars.container.selector.call(update).call(finish)

    vars.container.list
      .style("width",vars.width.secondary-vars.ui.border*2+"px")
      .style("max-height", max_height + "px")
      .property("scrollTop",vars.container.listScroll);

  }
  else {
    vars.container.selector.transition().duration(vars.draw.timing)
      .each("start",function(){
        d3.select(this)
          .style("display",vars.open.value ? "block" : null)
      })
      .call(update)
      .each("end",function(){

        d3.select(this).transition().duration(vars.draw.timing)
          .call(finish)

      })

    function scrollTopTween(scrollTop) {
        return function() {
            var i = d3.interpolateNumber(this.scrollTop, scrollTop);
            return function(t) { this.scrollTop = i(t); };
        };
    }

    vars.container.list.transition().duration(vars.draw.timing)
      .style("width",vars.width.secondary-vars.ui.border*2+"px")
      .style("max-height",max_height+"px")
      .tween("scroll",scrollTopTween(vars.container.listScroll))
  }

  if ( vars.dev.value ) print.timeEnd("drawing list")

}
