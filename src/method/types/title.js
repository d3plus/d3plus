d3plus.method.title = {
  "accepted" : [ false , Function , String ],
  "link"     : false,
  "sub"      : {
    "accepted"   : [ false , String ],
    "deprecates" : "sub_title",
    "link"       : false,
    "value"      : false,
  },
  "total"    : {
    "accepted"   : [ Boolean , Object ],
    "deprecates" : "total_bar",
    "link"       : false,
    "value"      : false
  },
  "process"  : function ( value ) {

    var vars = this.getVars()

    if ( vars.container.id.indexOf("default") === 0 && value ) {
      var id = d3plus.string.strip(value).toLowerCase()
      vars.self.container({"id": id})
    }

    return value

  },
  "value"    : false
}
