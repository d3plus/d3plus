d3plus.method.nodes = {
  "accepted" : [ false , Array , Function , String ],
  "delimiter" : {
    "accepted" : [ String ],
    "value"    : "|"
  },
  "filetype" : {
    "accepted" : [ false , "json" , "xml" ,"html"
                 , "csv" , "dsv" , "tsv" , "txt" ],
    "value"    : false
  },
  "process"  : d3plus.method.processData,
  "value"    : false
}
