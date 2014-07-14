d3plus.method.data = {
  "accepted" : [ false , Array , Function , String ],
  "cache"    : {},
  "delimiter" : {
    "accepted" : [ String ],
    "value"    : "|"
  },
  "filetype" : {
    "accepted" : [ false , "json" , "xml" ,"html"
                 , "csv" , "dsv" , "tsv" , "txt" ],
    "value"    : false
  },
  "filters"  : [],
  "mute"     : [],
  "process"  : function( value ) {

    var vars = this.getVars()

    if ( vars.container.id === "default" && value.length ) {
      vars.self.container({"id": "default"+value.length})
    }

    return d3plus.method.processData( value , this )
  },
  "solo"     : [],
  "value"    : false
}
