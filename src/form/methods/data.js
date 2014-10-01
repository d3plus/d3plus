var d3selection = require("../../util/d3selection.coffee"),
    process = require("../../core/methods/process/data.coffee")

module.exports = {
  "accepted" : [ false , Array , Function , String ],
  "delimiter" : {
    "accepted" : [ String ],
    "value"    : "|"
  },
  "element": {
    "process": function(value, vars) {

      if ( d3selection(value) ) {
        var element = value
      }
      else if (typeof value === "string" && !d3.select(value).empty()) {
        var element = d3.select(value)
      }
      else {
        var element = false
      }

      if (element) {

        vars.self.container(d3.select(element.node().parentNode))

        element
          .style("position","absolute","important")
          .style("clip","rect(1px 1px 1px 1px)","important")
          .style("clip","rect(1px, 1px, 1px, 1px)","important")
          .style("width","1px","important")
          .style("height","1px","important")
          .style("margin","-1px","important")
          .style("padding","0","important")
          .style("border","0","important")
          .style("overflow","hidden","important")

      }

      return element

    },
    "value": false
  },
  "filetype" : {
    "accepted" : [false, "json", "xml", "html", "csv", "dsv", "tsv", "txt"],
    "value"    : false
  },
  "filters"  : [],
  "mute"     : [],
  "process"  : function(value, vars) {

    if ( vars.container.id === "default" && value.length ) {
      vars.self.container({"id": "default"+value.length})
    }

    return process(value, vars, this)
  },
  "solo"     : [],
  "value"    : false
}
