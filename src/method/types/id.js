d3plus.method.id = {
  "accepted"    : [ Array , String ],
  "dataFilter"  : true,
  "deprecates"  : [ "id_var" , "nesting" ],
  "init"        : function ( vars ) {

    if ( vars.shell === "form" ) {
      this.nesting = [ "value" ]
      return "value"
    }
    else {
      this.nesting = [ "id" ]
      return "id"
    }

  },
  "mute"        : d3plus.method.filter(true),
  "solo"        : d3plus.method.filter(true)
}
