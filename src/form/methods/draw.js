var d3selection  = require("../../util/d3selection.coffee"),
    hideElement  = require("../../core/parse/hideElement.js"),
    parseElement = require("../../core/parse/element.js"),
    print        = require("../../core/console/print.coffee"),
    stringFormat = require("../../string/format.js")

module.exports = {
  "accepted" : [ undefined , Function ],
  "first"    : true,
  "frozen"   : false,
  "process"  : function (value, vars) {

    if ( this.initialized === false ) {
      this.initialized = true
      return value
    }

    if (vars.data.value && (!(vars.data.value instanceof Array) || d3selection(vars.data.value))) {
      vars.data.value = parseElement( vars )
    }
    else if (vars.data.element.value) {
      vars.data.element.value.call(hideElement);
    }

    if ( value === undefined && typeof this.value === "function" ) {
      value = this.value
    }

    if ( vars.container.value === false ) {

      var str = vars.format.locale.value.dev.setContainer
      print.warning( str , "container" )

    }
    else if ( vars.container.value.empty() ) {

      var str = vars.format.locale.value.dev.noContainer
      print.warning( stringFormat(str,"\""+vars.container.value+"\"") , "container" )

    }
    else {

      if (vars.dev.value) print.time("total draw time");

      vars.container.value.call(vars.self);

    }

    if ( typeof value === "function" && vars.history.chain.length ) {

      var changesObject = {}
      vars.history.chain.forEach(function(c){
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
