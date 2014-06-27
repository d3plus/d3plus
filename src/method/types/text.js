d3plus.method.text = {
  "accepted"   : [ Array , Boolean , Function , Object , String ],
  "deprecates" : [ "name_array" , "text_var" ],
  "html"     : {
    "accepted" : [ Boolean ],
    "value"    : false
  },
  "init"     : function ( vars ) {

    if ( vars.shell === "textwrap" ) {
      var s = this.split
      this.break = new RegExp("[^\\s\\"+s.join("\\")+"]+\\"+s.join("?\\")+"?","g")
    }

    return false

  },
  "nesting"    : true,
  "mute"       : d3plus.method.filter(true),
  "solo"       : d3plus.method.filter(true),
  "secondary"  : {
    "accepted" : [ Array , Boolean , Function , Object , String ],
    "nesting"  : true,
    "value"    : false
  },
  "split"      : [ "-" , "/" , ";" , ":" , "&" ]
}
