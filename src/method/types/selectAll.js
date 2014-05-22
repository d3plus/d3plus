d3plus.method.selectAll = {
  "accepted"  : [ String ],
  "chainable" : false,
  "process"   : function ( value ) {

    var vars = this.getVars()

    return vars.container.value && value
         ? vars.container.value.selectAll(value)
         : value

  },
  "value"     : undefined
}
