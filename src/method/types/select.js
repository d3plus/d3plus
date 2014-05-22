d3plus.method.select = {
  "accepted"  : [ String ],
  "chainable" : false,
  "process"   : function ( value ) {

    var vars = this.getVars()

    return vars.container.value && value
         ? vars.container.value.select(value)
         : value

  },
  "value"     : undefined
}
