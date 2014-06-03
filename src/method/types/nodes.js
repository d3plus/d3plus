d3plus.method.nodes = {
  "accepted" : [ false , Array , Function , String ],
  "delimiter" : {
    "accepted" : [ String ],
    "value"    : "|"
  },
  "process"  : d3plus.method.processData,
  "type"     : {
    "accepted" : [ false , "json" , "xml" ,"html"
                 , "csv" , "dsv" , "tsv" , "txt" ],
    "value"    : false
  },
  "value"    : false
}
