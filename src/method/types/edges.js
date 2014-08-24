d3plus.method.edges = {
  "accepted"    : [ false , Array , Function , String ],
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
  "delimiter" : {
    "accepted" : [ String ],
    "value"    : "|"
  },
  "filetype"    : {
    "accepted" : [ false , "json" , "xml" ,"html"
                 , "csv" , "dsv" , "tsv" , "txt" ],
    "value"    : false
  },
  "interpolate" : {
    "accepted"   : ["basis", "cardinal", "linear", "monotone", "step"],
    "value"      : "basis"
  },
  "label"       : false,
  "limit"       : {
    "accepted" : [false, Function, Number],
    "value"    : false
  },
  "process"     : d3plus.method.processData,
  "size"        : false,
  "source"      : "source",
  "strength"    : {
    "accepted" : [false, Function, Number, String],
    "value"    : false
  },
  "target"      : "target",
  "value"       : false
}
