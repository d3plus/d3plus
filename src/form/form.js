//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Form Element shell
//------------------------------------------------------------------------------
d3plus.form = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialize the global variable object.
  //----------------------------------------------------------------------------
  var vars = { "shell": "form" }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create the main drawing function.
  //----------------------------------------------------------------------------
  vars.self = function( selection ) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set timing to 0 if it's the first time running this function or if the
    // data length is longer than the "large" limit
    //--------------------------------------------------------------------------
    var large = vars.data.value instanceof Array
                && vars.data.value.length > vars.data.large

    vars.draw.timing = vars.draw.first || large || d3plus.ie
                     ? 0 : vars.timing.ui

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create/update the UI element
    //--------------------------------------------------------------------------
    if ( vars.data.value instanceof Array ) {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Sort the data, if needed.
      //------------------------------------------------------------------------
      if ( vars.order.value && (vars.data.changed || vars.order.changed || vars.order.sort.changed) ) {

        var sort = vars.order.value || vars.id.value
          , order = vars.order.sort.value

        vars.data.value.sort(function(a,b){

          a = a[sort]
          b = b[sort]

          if (sort === vars.color.value) {

            a = d3.rgb(a_value).hsl()
            b = d3.rgb(b_value).hsl()

            if (a.s == 0) a = 361
            else a = a.h
            if (b.s == 0) b = 361
            else b = b.h

          }

          if (typeof a === "string") {
            a = a.toLowerCase()
          }

          if (typeof b === "string") {
            b = b.toLowerCase()
          }

          if(a < b) return order === "asc" ? -1 : 1;
          if(a > b) return order === "asc" ? 1 : -1;

        })

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Set first element in data as focus if there is no focus set.
      //------------------------------------------------------------------------
      if ( !vars.focus.value && vars.data.value.length ) {

        vars.focus.value = vars.data.value[0][vars.id.value]
        if (vars.dev.value) d3plus.console.log("\"value\" set to \""+vars.focus+"\"")

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Run these things if the data has changed.
      //------------------------------------------------------------------------
      if ( vars.data.changed ) {

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Determine if search box is needed.
        //----------------------------------------------------------------------
        if ( vars.search.value === "auto" ) {

          if (vars.data.value.length > 10) {
            vars.search.enabled = true
            if (vars.dev.value) d3plus.console.log("Search enabled.")
          }
          else {
            vars.search.enabled = false
            if (vars.dev.value) d3plus.console.log("Search disabled.")
          }

        }
        else {

          vars.search.enabled = vars.search.value

        }

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Update OPTION elements with the new data.
        //----------------------------------------------------------------------
        var elementTag = vars.data.element
                       ? vars.data.element.node().tagName.toLowerCase() : ""
        if ( vars.data.element && elementTag === "select" ) {

          options = vars.data.element.selectAll("option")
            .data(vars.data.value,function(d){
              return d ? d[vars.id.value] : false
            })

          options.exit().remove()

          options.enter().append("option")

          options
            .each(function(d){

              for (k in d) {
                if ( k === vars.text.value ) {
                  d3.select(this).html(d[k])
                }
                if ( ["alt","value"].indexOf(k) >= 0 ) {
                  d3.select(this).attr(k,d[k])
                }
                else {
                  d3.select(this).attr("data-"+k,d[k])
                }
              }

              if (d[vars.id.value] === vars.focus.value) {
                this.selected = true
              }
              else {
                this.selected = false
              }

            })

        }

      }

      if (vars.draw.first) {

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Select container DIV for UI element
        //----------------------------------------------------------------------
        vars.container.ui = vars.container.value
          .selectAll("div#d3plus_"+vars.type.value+"_"+vars.container.id)
          .data(["container"])

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Create container DIV for UI element
        //----------------------------------------------------------------------
        var before = vars.data.element ? vars.data.element[0][0] : null

        if ( before ) {

          if ( before.id ) {
            before = "#"+before.id
          }
          else {

            var id = before.getAttribute(vars.id.value)
                   ? vars.id.value : "data-"+vars.id.value

            if ( before.getAttribute(id) ) {
              before = "["+id+"="+before.getAttribute(id)+"]"
            }
            else {
              before = null
            }

          }

        }

        vars.container.ui.enter()
          .insert("div",before)
          .attr("id","d3plus_"+vars.type.value+"_"+vars.container.id)
          .style("position","relative")
          .style("overflow","visible")
          .style("vertical-align","top")

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update Container
      //------------------------------------------------------------------------
      vars.container.ui.transition().duration(vars.draw.timing)
        .style("display",vars.ui.display.value)
        .style("margin",vars.ui.margin+"px")

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Create title, if available.
      //------------------------------------------------------------------------
      var title = vars.container.ui.selectAll("div.d3plus_title")
        .data(vars.title.value ? [vars.title.value] : [])

      title.enter().insert("div","#d3plus_"+vars.type.value+"_"+vars.container.id)
        .attr("class","d3plus_title")

      title.transition().duration(vars.draw.timing)
        .style("display",vars.ui.display.value)
        .style("color",vars.font.color)
        .style("font-family",vars.font.family.value)
        .style("font-size",vars.font.size+"px")
        .style("font-weight",vars.font.weight)
        .style("padding",vars.ui.padding+"px")
        .style("border-color","transparent")
        .style("border-style","solid")
        .style("border-width",vars.ui.border+"px")
        .text(String)

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Call specific UI element type, if there is data.
      //------------------------------------------------------------------------
      if ( vars.data.value.length ) {

        if (vars.dev.value) d3plus.console.group("drawing \""+vars.type.value+"\"")
        d3plus.input[vars.type.value]( vars )
        if (vars.dev.value) d3plus.console.groupEnd()

      }
      else if ( vars.data.url && (!vars.data.loaded || vars.data.stream) ) {

        d3plus.data.json( vars , "data" , vars.self.draw )

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Initialization complete
      //------------------------------------------------------------------------
      d3plus.data.reset( vars )

    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define methods and expose public variables.
  //----------------------------------------------------------------------------
  var methods = [ "alt" , "color" , "container" , "dev" , "data" , "draw"
                , "focus" , "format" , "height" , "hover" , "icon" , "id"
                , "keywords" , "open" , "order" , "remove" , "search"
                , "select" , "selectAll" , "text" , "title" , "type" , "width" ]
    , styles  = [ "font" , "icon" , "timing" , "title" , "ui" ]

  d3plus.method( vars , methods , styles )

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Finally, return the main UI function to the user
  //----------------------------------------------------------------------------
  return vars.self

}
