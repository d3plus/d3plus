d3plus.method.data = {
  "accepted" : [ false , Array , Function , String ],
  "delimiter" : {
    "accepted" : [ String ],
    "value"    : "|"
  },
  "process"  : function( value ) {

    var vars = this.getVars()

    if ( vars.container.id === "default" && value.length ) {
      vars.self.container({"id": "default"+value.length})
    }

    return d3plus.method.processData( value , this )
  },
  "type"     : {
    "accepted" : [ false , "json" , "xml" ,"html"
                 , "csv" , "dsv" , "tsv" , "txt" ],
    "value"    : false
  },
  "value"    : false
}
