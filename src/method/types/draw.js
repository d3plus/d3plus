d3plus.method.draw = {
  "accepted": [ undefined ],
  "first": true,
  "frozen": false,
  "update": true,
  "value": function ( vars ) {

    if ( !vars.container.value ) {

      var str = vars.format.locale.value.warning.setContainer
      d3plus.console.warning(str)

    }
    else if ( d3.select(vars.container.value).empty() ) {

      var str = vars.format.locale.value.warning.noContainer
      d3plus.console.warning(d3plus.util.format(str,vars.container))

    }
    else {

      d3.select(vars.container.value).call(vars.self)

    }

  }
}
