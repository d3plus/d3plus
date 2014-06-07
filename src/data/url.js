//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Load Data using JSON
//------------------------------------------------------------------------------
d3plus.data.url = function( vars , key , next ) {

  if ( vars.dev.value ) d3plus.console.time( "loading " + key )

  var url = vars[key].url

  if ( !vars[key].type.value ) {

    var fileType = url.slice(url.length-5).split(".")
    if ( fileType.length > 1 ) {
      fileType = fileType[1]
    }
    else {
      fileType = false
    }

    if ( fileType ) {

      if ( fileType === "txt" ) {
        fileType = "text"
      }
      if ( vars[key].type.accepted.indexOf(fileType) < 0 ) {
        fileType = "json"
      }

    }
    else {
      fileType = "json"
    }

  }
  else {
    var fileType = vars[key].type.value
  }

  if ( fileType === "dsv" ) {
    var parser = d3.dsv( vars[key].delimiter.value , "text/plain" )
  }
  else {
    var parser = d3[fileType]
  }

  parser( url , function( error , data ) {

    if (!error && data) {

      if (typeof vars[key].callback === "function") {

        var ret = vars[key].callback(data)

        if (ret) {
          if ( d3plus.object.validate(ret) && key in ret) {
            for ( var k in ret ) {
              if (k in vars) {
                vars[k].value = ret[k]
              }
            }
          }
          else {
            vars[key].value = ret
          }
        }

      }
      else {

        vars[key].value = data

      }

      if ( fileType !== "json" ) {

        vars[key].value.forEach(function(d){

          for ( var k in d ) {

            if      ( d[k].toLowerCase() === "false" ) d[k] = false
            else if ( d[k].toLowerCase() === "true" ) d[k] = true
            else if ( d[k].toLowerCase() === "null" ) d[k] = null
            else if ( d[k].toLowerCase() === "undefined" ) d[k] = undefined

          }


        })

      }

      vars[key].changed = true
      vars[key].loaded = true

    }
    else {

      vars.internal_error = "Could not load data from: \""+url+"\""

    }

    if ( vars.dev.value ) d3plus.console.time( "loading " + key )
    next()

  })

}
