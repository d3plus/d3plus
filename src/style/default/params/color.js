d3plus.style.default.color = {
  "heatmap"   : [ "#27366c" , "#7b91d3" , "#9ed3e3"
                , "#f3d261" , "#c9853a" , "#d74b03" ],
  "focus"     : "#444444",
  "missing"   : "#eeeeee",
  "primary"   : "#d74b03",
  "range"     : [ "#d74b03" , "#eeeeee" , "#94b153" ],
  "scale"     : {
    "accepted": [ Array, "d3plus", "category10", "category20", "category20b", "category20c" ],
    "process": function(value) {

      if (value instanceof Array) {
        return d3.scale.ordinal().range(value)
      }
      else {
        if (value === "d3plus") {
          return d3plus.color.scale
        }
        else {
          console.log("Here!")
          return d3.scale[value]()
        }
      }

    },
    "value": "d3plus"
  },
  "secondary" : "#e5b3bb"
}
