var uniques = require("../../util/uniques.coffee")
var copy    = require("../../util/copy.coffee")
var rand_col= require("../../color/random.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Table
//------------------------------------------------------------------------------

var table = function(vars) {

  if (!("dummy" in vars.data.viz[0])){
    vars.data.viz.unshift({"dummy":true, "d3plus":{}})
  }
  if (vars.cols.value[0] != "label"){
    vars.cols.value.unshift("label")
  }

  var ids = uniques(vars.data.viz, vars.id.value);
  var item_height = vars.height.viz / (ids.length+1);
  var item_width = vars.width.viz / vars.cols.value.length;

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Setup background
  //----------------------------------------------------------------------------
  vars.group.selectAll("rect").data([0]).enter()
    .append("rect")
    .attr("class", "background")
    .attr("height", vars.height.viz)
    .attr("width", vars.width.viz)
    .style("fill", vars.color.missing)

  // draw line separater
  var lines_horiz = vars.group.selectAll("line.horiz").data(vars.data.viz);
  lines_horiz.enter().append("line").attr("class", "horiz")
  lines_horiz
    .attr("x1", 0)
    .attr("y1", function(d, row_i){ return (item_height * row_i) + item_height })
    .attr("x2", vars.width.viz)
    .attr("y2", function(d, row_i){ return (item_height * row_i) + item_height })
    .style("fill", "#fff")
    .style("stroke", "#fff")
  lines_horiz.exit().remove()
  // draw line separater
  var lines_vert = vars.group.selectAll("line.vert").data(vars.cols.value);
  lines_vert.enter().append("line").attr("class", "vert")
  lines_vert
    .attr("x1", function(d, col_i){ return (item_width * col_i) + item_width })
    .attr("y1", 0)
    .attr("x2", function(d, col_i){ return (item_width * col_i) + item_width })
    .attr("y2", vars.height.viz)
    .style("fill", "#fff")
    .style("stroke", "#fff")
  lines_vert.exit().remove()

  var ret = []
  var colors = {}

  // set up color scales
  vars.cols.value.forEach(function(col){
    if(vars.data.keys[col] == "number"){
      var domain_extent = d3.extent(vars.data.viz, function(d){ return d[col]; })
      colors[col] = d3.scale.linear().domain(domain_extent).range([vars.color.missing,rand_col(col)])
    }
    else if(vars.data.keys[col] == "boolean"){
      colors[col] = function(bool){
        return bool ? rand_col(col) : vars.color.missing;
      }
    }
  })

  // support for strings

  vars.data.viz.forEach(function(d, row_i){
    console.log(d)

    // loop through each user defined column to create new "object" to draw
    vars.cols.value.forEach(function(col, col_i){

      // need to clone data since we'll be dupliating it for each column
      var d_clone = copy(d);

      // set unique ID otherwise it'd be the same in each column
      d_clone.d3plus.id = "d3p_"+d_clone[vars.id.value]+"_"+col;

      d_clone.d3plus.x = (item_width * col_i) + item_width/2;
      d_clone.d3plus.y = (item_height * row_i) + item_height/2;
      d_clone.d3plus.width = item_width;
      d_clone.d3plus.height = item_height;

      // these are the column headers
      if(d.dummy){
        d_clone.d3plus.shape = "square";
        d_clone.d3plus.color = rand_col(col);
        d_clone.d3plus.stroke = "#fff";
        d_clone.d3plus.text = col;
        if(col == "label"){
          d_clone.d3plus.label = false
        }
        ret.push(d_clone)
      }

      if(col == "label"){
        d_clone.d3plus.shape = "square";
        d_clone.d3plus.color = "#fff";
        // special case for top left corner
        if(!d_clone.dummy){
          ret.push(d_clone)
        }
      }

      // be sure that this column is actually in this data item
      if(d3.keys(d).indexOf(col) >= 0 && col in d){
        if(colors[col]){
          d_clone.d3plus.color = colors[col](d_clone[col]);
        }
        d_clone.d3plus.text = d_clone[col];
        if(vars.data.keys[col] == "boolean"){
          d_clone.d3plus.label = false;
        }
        ret.push(d_clone)
      }
    })

  })

  return ret

};

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
table.shapes = ["check", "cross", "diamond", "square", "triangle", "triangle_up", "triangle_down"]
table.requirements = ["data", "cols"]

module.exports = table
