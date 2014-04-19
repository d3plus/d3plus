d3plus.method.edges = {
  "accepted": [ Array , Boolean , Function , String ],
  "arrows": {
    "accepted": [Boolean],
    "direction": {
      "accepted": ["source","target"],
      "value": "target"
    },
    "value": false
  },
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
  "deprecates": ["edges"],
  "label": false,
  "large": 100,
  "limit": false,
  "size": false,
  "source": "source",
  "target": "target",
  "value": false
}
