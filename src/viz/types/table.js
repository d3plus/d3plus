var fetchValue = require("../../core/fetch/value.coffee");
var uniques    = require("../../util/uniques.coffee");
var copy       = require("../../util/copy.coffee");
var rand_col   = require("../../color/random.coffee");

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Table
//------------------------------------------------------------------------------

var table = function(vars) {

  // get unique IDs and columns
  var ids = uniques(vars.data.viz, vars.id.value, fetchValue, vars);
  var cols = uniques(vars.cols.value);

  // if user wants to show the row labels (default behavior) add this as a col
  if (cols.indexOf("label") < 0 && vars.cols.index.value){
    cols.unshift("label");
  }

  // width/height are a function of number of IDs and columns
  var item_height = vars.height.viz / (ids.length+1); // add 1 for header offset
  var item_width = vars.width.viz / cols.length;

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Setup background
  //----------------------------------------------------------------------------
  vars.group.selectAll("rect").data([0]).enter()
    .append("rect")
    .attr("class", "background")
    .attr("height", vars.height.viz)
    .attr("width", vars.width.viz)
    .style("fill", vars.color.missing)
  // draw line separater w/ enter/update/exit
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
  // draw line separater w/ enter/update/exit
  var lines_vert = vars.group.selectAll("line.vert").data(cols);
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

  // doing 2 things here, first we add our column headers to our ret array as
  // items dor d3plus to draw. We also compute the color scales for each column
  cols.forEach(function(col, col_i){
    // add columns
    var header = {"d3plus":{
      "x": (item_width * col_i) + item_width/2,
      "y": item_height/2,
      "width": item_width,
      "height": item_height,
      "id": "d3p_header_"+col.toString().replace(/ /g,"_"),
      "shape": "square",
      "color": "#fff",
      "text": vars.format.value(col)
    }}
    if(col == vars.id.value){
      header.d3plus.color = "#fff";
    }
    if(col == "label"){
      header.d3plus.label = false;
      header.d3plus.color = "#fff";
      header.d3plus.stroke = "#fff";
    }
    ret.push(header)

    // set up color scales
    if(vars.data.keys[col] == "number"){
      var domain_extent = d3.extent(vars.data.viz, function(d){ return d[col]; })
      if(domain_extent[0] == domain_extent[1]){
        domain_extent = [domain_extent[0]-1, domain_extent[1]]
      }
      colors[col] = d3.scale.linear().domain(domain_extent).range([vars.color.missing,rand_col(col)])
    }
    else if(vars.data.keys[col] == "boolean"){
      colors[col] = function(bool){
        return bool ? rand_col(col) : vars.color.missing;
      }
    }
  })

  vars.data.viz.forEach(function(d, row_i){
    // offset for column headers
    row_i += 1;

    // loop through each user defined column to create new "object" to draw
    cols.forEach(function(col, col_i){

      // need to clone data since we'll be dupliating it for each column
      var d_clone = copy(d);

      // set unique ID otherwise it'd be the same in each column
      d_clone.d3plus.id = "d3p_"+d_clone[vars.id.value].toString().replace(/ /g,"_")+"_"+col;
      d_clone.d3plus.x = (item_width * col_i) + item_width/2;
      d_clone.d3plus.y = (item_height * row_i) + item_height/2;
      d_clone.d3plus.width = item_width;
      d_clone.d3plus.height = item_height;

      if(col == "label"){
        d_clone.d3plus.shape = "square";
        d_clone.d3plus.color = "#fff";
        // special case for top left corner
        ret.push(d_clone)
      }

      // be sure that this column is actually in this data item
      if(d3.keys(d).indexOf(col) >= 0 && col in d){
        if(colors[col]){
          d_clone.d3plus.color = colors[col](d_clone[col]);
        }
        d_clone.d3plus.text = vars.format.value(d_clone[col]);
        if(vars.data.keys[col] == "boolean"){
          d_clone.d3plus.label = false;
        }
        else if(vars.data.keys[col] == "string"){
          d_clone.d3plus.color = vars.color.missing;
          d_clone.d3plus.stroke = "#fff";
          d_clone.d3plus.shape = "square";
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
