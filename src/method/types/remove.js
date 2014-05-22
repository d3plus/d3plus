d3plus.method.remove = {
  "accepted" : undefined,
  "process"  : function ( value ) {

    if ( this.initialized ) {
      var vars = this.getVars()
      vars.container.value.remove()
    }
    else {
      return value
    }


  },
  "value"    : undefined
}
