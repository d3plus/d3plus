d3plus.method.search = {
  "accepted" : [ "auto" , Boolean ],
  "process"  : function(value) {

    if (typeof value == "Boolean") {
      this.enabled = value
    }

    return value

  },
  "value"    : "auto"
}
