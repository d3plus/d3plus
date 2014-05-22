d3plus.method.edges = {
  "accepted"    : [ false , Array , Function , String ],
  "arrows"      : {
    "accepted"  : [ Boolean , Number ],
    "direction" : {
      "accepted" : [ "source" , "target" ],
      "value"    : "target"
    },
    "value"     : false
  },
  "connections" : function(focus,id,objects) {

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
  "label"       : false,
  "large"       : 100,
  "limit"       : false,
  "process"     : d3plus.method.processData,
  "size"        : false,
  "source"      : "source",
  "target"      : "target",
  "value"       : false
}
