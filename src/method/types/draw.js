d3plus.method.draw = {
  "accepted" : [ undefined , Function ],
  "first"    : true,
  "frozen"   : false,
  "process"  : function ( value ) {

    if ( this.initialized === false ) {
      this.initialized = true
      return value
    }

    var vars    = this.getVars()
      , changes = "history" in vars ? vars.history.chain : []

    if ( value === undefined && typeof this.value === "function" ) {
      value = this.value
    }

    if ( vars.container.value === false ) {

      var str = vars.format.locale.value.dev.setContainer
      d3plus.console.warning(str)

    }
    else if ( vars.container.value.empty() ) {

      var str = vars.format.locale.value.dev.noContainer
      d3plus.console.warning(d3plus.string.format(str,"\""+vars.container.value+"\""))

    }
    else {

      if ( vars.dev.value && vars.methodGroup ) {
        vars.methodGroup = "wait"
        d3plus.console.groupEnd("method behavior")
        d3plus.console.time("[d3plus] total draw time")
      }

      vars.container.value.call(vars.self)

    }

    if ( typeof value === "function" && changes.length ) {

      var changesObject = {}
      changes.forEach(function(c){
        var method = c.method
        delete c.method
        changesObject[method] = c
      })

      value(changesObject)

      vars.history.chain = []

    }

    return value

  },
  "update"   : true,
  "value"    : undefined
}
