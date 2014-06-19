d3plus.method.attrs = {
  "accepted" : [ false , Array , Object , String ],
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
