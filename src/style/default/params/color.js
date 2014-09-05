d3plus.style.default.color = {
  "heatmap"   : [ "#282F6B" , "#419391" , "#AFD5E8"
                , "#EACE3F" , "#B35C1E" , "#B22200" ],
  "focus"     : "#444444",
  "missing"   : "#eeeeee",
  "primary"   : "#d74b03",
  "range"     : [ "#B22200" , "#FFEE8D" , "#759143" ],
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
