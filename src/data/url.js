//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Load Data using JSON
//------------------------------------------------------------------------------
d3plus.data.url = function( vars , key , next ) {

  var url = vars[key].url || vars[key].value

  vars[key].url = url
  vars[key].value = []

  d3.json( url , function( error , data ) {

    if (!error && data) {

      if (typeof vars[key].callback === "function") {

        var ret = vars[key].callback(data)

        if (ret) {
          if ( d3plus.object.validate(ret) && key in ret) {
            for (k in ret) {
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

      vars[key].changed = true
      vars[key].loaded = true

    }
    else {

      vars.internal_error = "Could not load data from: \""+url+"\""

    }

    next()

  })

}
