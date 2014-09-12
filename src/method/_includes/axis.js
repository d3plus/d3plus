//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create dummy methods to catch deprecates
//--------------------------------------------------------------------------
module.exports = function( axis ) {

  return {
    "accepted"    : [ Array , Boolean , Function , Object , String ],
    "dataFilter"  : true,
    "deprecates"  : [ axis+"axis" , axis+"axis_val" , axis+"axis_var" ],
    "domain"      : {
      "accepted": [false, Array],
      "value": false
    },
    "lines"       : [],
    "mute"        : d3plus.method.filter(true),
    "range"       : false,
    "reset"       : [ "range" ],
    "scale"       : {
      "accepted"   : [ "linear" , "log" , "continuous" , "share" ],
      "deprecates" : [ "layout" , "unique_axis" , axis+"axis_scale" ],
      "process": function(value) {
        var vars = this.getVars();
        ["log","continuous","share"].forEach(function(scale){
          if (scale === value) {
            vars.axes[scale] = axis
          }
          else if (vars.axes[scale] === axis) {
            vars.axes[scale] = false
          }
        })
        if (value === "continuous") {
          vars.axes.opposite = axis === "x" ? "y" : "x"
        }
        return value
      },
      "value"      : "linear"
    },
    "solo"        : d3plus.method.filter(true),
    "stacked"     : {
      "accepted" : [ Boolean ],
      "process": function(value) {
        var vars = this.getVars();
        if (!value && vars.axes.stacked === axis) {
          vars.axes.stacked = false
        }
        else if (value) {
          vars.axes.stacked = axis
        }
        return value
      },
      "value"    : false
    },
    "value"       : false,
    "zerofill"    : {
      "accepted" : [ Boolean ],
      "value"    : false
    }
  }

}
