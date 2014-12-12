var process = require("../../core/methods/process/data.coffee");

module.exports = {
  "accepted": [false, Array, Function, String],
  "arrows":   {
    "accepted":  [ Boolean , Number ],
    "direction": {
      "accepted": [ "source" , "target" ],
      "value":    "target"
    },
    "value": false
  },
  "color":       "#d0d0d0",
  "connections": function(focus,id,objects) {

    var self = this

    if (!self.value) {
      return []
    }

    if (!id) var id = "id"

    var edges = self.restricted || self.value,
        targets = []

    if (!focus) {
      return edges
    }

    var connections = edges.filter(function(edge){

      var match = false

      if (edge[self.source][id] == focus) {
        match = true
        if (objects) {
          targets.push(edge[self.target])
        }
      }
      else if (edge[self.target][id] == focus) {
        match = true
        if (objects) {
          targets.push(edge[self.source])
        }
      }

      return match

    })

    return objects ? targets : connections

  },
  "delimiter": {
    "accepted": [ String ],
    "value":    "|"
  },
  "filetype": {
    "accepted": [false, "json", "xml","html", "csv", "dsv", "tsv", "txt"],
    "value":    false
  },
  "interpolate": {
    "accepted": ["basis", "cardinal", "linear", "monotone", "step"],
    "value":    "basis"
  },
  "label": false,
  "large": 100,
  "limit": {
    "accepted": [false, Function, Number],
    "value":    false
  },
  "opacity": {
    "accepted": [Function, Number, String],
    "min": {
      "accepted": [Number],
      "value": 0.25
    },
    "scale": {
      "accepted": [Function],
      "value": d3.scale.linear()
    },
    "value": 1
  },
  "process":  process,
  "size": {
    "accepted": [false, Number, String],
    "min": 1,
    "scale": 0.5,
    "value": false
  },
  "source":   "source",
  "strength": {
    "accepted": [false, Function, Number, String],
    "value":    false
  },
  "target": "target",
  "value":  false
};
