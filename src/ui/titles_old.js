//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats Raw Data
//------------------------------------------------------------------------------
d3plus.ui.titles_old = function(vars) {




  function make_title(t,type){



    if (title) {
      var title_data = title_position
      title_data.title = title
      title_data = [title_data]
    }
    else {
      var title_data = []
    }

    var total = vars.g.titles.selectAll("g.d3plus_"+type).data(title_data)

    d3plus.ui.title_update(vars)

    // Exit
    total.exit().transition().duration(vars.style.timing.transitions)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }

  function update_footer(footer_text) {

    if (footer_text && footer_text.value) {
      if (footer_text.value.indexOf("<a href=") == 0) {
        var div = document.createElement("div")
        div.innerHTML = footer_text.value
        var t = footer_text.value.split("href=")[1]
        var link = t.split(t.charAt(0))[1]
        if (link.charAt(0) != "h" && link.charAt(0) != "/") {
          link = "http://"+link
        }
        var d = [div.getElementsByTagName("a")[0].innerHTML]
      }
      else {
        var d = [footer_text.value]
      }
    }
    else var d = []

    var source = vars.g.footer.selectAll("text.d3plus_source").data(d)
    var padding = 3

    source.enter().append("text")
      .attr("class","d3plus_source")
      .attr("opacity",0)
      .attr("x",vars.width.value/2+"px")
      .attr("y",padding-1+"px")
      .attr("font-size",vars.style.footer["font-size"])
      .attr("fill",vars.style.footer["font-color"])
      .attr("text-anchor", vars.style.footer["font-align"])
      .attr("font-family", vars.style.footer["font-family"])
      .style("font-weight", vars.style.footer["font-weight"])
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.width.value-20,
          "height": vars.height.value/8,
          "resize": false
        })
      })
      .on(d3plus.evt.over,function(){
        if (link) {
          d3.select(this)
            .style("text-decoration","underline")
            .style("cursor","pointer")
            .style("fill","#000")
        }
      })
      .on(d3plus.evt.out,function(){
        if (link) {
          d3.select(this)
            .style("text-decoration","none")
            .style("cursor","auto")
            .style("fill","#333")
        }
      })
      .on(d3plus.evt.click,function(){
        if (link) {
          if (link.charAt(0) != "/") var target = "_blank"
          else var target = "_self"
          window.open(link,target)
        }
      })

    source
      .attr("opacity",1)
      .attr("x",(vars.width.value/2)+"px")
      .attr("font-family", vars.style.font.family)
      .style("font-weight", vars.style.font.weight)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.width.value-20,
          "height": vars.height.value/8,
          "resize": false
        })
      })

    source.exit().transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()

    if (d.length) {
      var height = source.node().getBBox().height
      vars.margin.bottom = height+padding*2
    }
    else {
      vars.margin.bottom = 0
    }

    vars.g.footer.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")

  }
}

d3plus.ui.title_update = function(vars) {

  vars.g.titles.selectAll("g").select("text")
    .transition().duration(vars.style.timing.transitions)
      .attr("x",function(d) { return d.x; })
      .attr("y",function(d) { return d.y; })
      .each(function(d){
        var width = vars.style.title.width || vars.width.value
        d3plus.utils.wordwrap({
          "text": d.title,
          "parent": this,
          "width": width,
          "height": vars.height.value/8,
          "resize": false
        })
      })
      .selectAll("tspan")
        .attr("x",function(d) { return d.x; })

}
