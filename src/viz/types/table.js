var uniques = require("../../util/uniques.coffee")
var copy    = require("../../util/copy.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Table
//------------------------------------------------------------------------------
var table = function(vars) {
  
  var ids = uniques(vars.data.viz, vars.id.value);
  var item_height = vars.height.viz / ids.length;
  var item_width = vars.width.viz / vars.cols.value.length;
  
  var ret = []
  
  vars.data.viz.forEach(function(d, row_i){
    
    // loop through each user defined column to create new "object" to draw
    vars.cols.value.forEach(function(col, col_i){
      
      // be sure that this column is actually in this data item
      if(d3.keys(d).indexOf(col) >= 0 && d[col]){
        
        // need to clone data since we'll be dupliating it for each column
        var d_clone = copy(d);
      
        // set unique ID otherwise it'd be the same in each column
        d_clone.d3plus.id = "d3p_"+d_clone[vars.id.value]+"_"+col;
      
        d_clone.d3plus.x = (item_width * col_i) + item_width/2;
        d_clone.d3plus.width = item_width;
      
        d_clone.d3plus.y = (item_height * row_i) + item_height/2;
        d_clone.d3plus.height = item_height;
      
        ret.push(d_clone)
      }
    })
    
  })
  
  return ret

};

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
table.shapes = ["square"]
table.requirements = ["data", "cols"]

module.exports = table
