vizwhiz.error = function(vars) {
  
  var error = d3.select("g.parent").selectAll("g.vizwhiz-error")
    .data([vars.error])
    
  error.enter().append("g")
    .attr("class","vizwhiz-error")
    .attr("opacity",0)
    .append("text")
      .attr("x",vars.svg_width/2)
      .attr("font-size","30px")
      .attr("fill","#888")
      .attr("text-anchor", "middle")
      .attr("font-family", vars.font)
      .style("font-weight", vars.font_weight)
      .each(function(d){
        vizwhiz.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.svg_width-20,
          "height": vars.svg_height-20,
          "resize": false
        })
      })
      .attr("y",function(){
        var height = d3.select(this).node().offsetHeight
        return vars.svg_height/2-height/2
      })
      
  error.transition().duration(vizwhiz.timing)
    .attr("opacity",1)
      
  error.select("text").transition().duration(vizwhiz.timing)
    .attr("x",vars.svg_width/2)
    .each(function(d){
      vizwhiz.utils.wordwrap({
        "text": d,
        "parent": this,
        "width": vars.svg_width-20,
        "height": vars.svg_height-20,
        "resize": false
      })
    })
    .attr("y",function(){
      var height = d3.select(this).node().offsetHeight
      return vars.svg_height/2-height/2
    })
      
  error.exit().transition().duration(vizwhiz.timing)
    .attr("opacity",0)
    .remove()
      
  // var error = d3.select(this).append("div")
  //   .attr("id","error")
  //   
  // error.append("div")
  //   .attr("id","title")
  //   .html(title)
  //   
  // error.append("div")
  //   .attr("id","sub_title")
  //   .html("Please modify your search filters")
  // 
  // 

// #error {
//   color: #888;
//   position: absolute;
//   width: 100%;
//   text-align: center;
//   top: 50%;
//   margin-top: -30px;
// }
// 
// #error #title {
//   color: #888;
//   font-size: 30px;
//   margin-bottom: 10px;
// }
  
}
