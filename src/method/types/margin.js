d3plus.method.margin = {
  "accepted": [ Number , Object , String ],
  "accessible": false,
  "process": function ( value ) {

    var self = this
      , sides = [ "top" , "right" , "bottom" , "left" ]

    if ( value === undefined ) {
      var value = self.value
    }

    var userValue = value

    if ( typeof value === "string" ) {

      value = value.split(" ")

      value.forEach(function(v,i){
        value[i] = parseFloat(v,10)
      })

      if ( value.length === 1 ) {
        value = value[0]
      }
      else if ( value.length === 2 ) {
        value = {
          "top"    : value[0],
          "right"  : value[1],
          "bottom" : value[0],
          "left"   : value[1]
        }
      }
      else if ( value.length === 3 ) {
        value = {
          "top"    : value[0],
          "right"  : value[1],
          "bottom" : value[2],
          "left"   : value[1]
        }
      }
      else if ( value.length === 4 ) {
        value = {
          "top"    : value[0],
          "right"  : value[1],
          "bottom" : value[2],
          "left"   : value[3]
        }
      }
      else {
        value = 0
      }

    }

    if ( typeof value === "number" ) {

      sides.forEach(function(side){
        self[side] = value
      })

    }
    else {

      for ( var side in value ) {

        var sideIndex = sides.indexOf(side)

        if (sideIndex >= 0) {

          sides.splice(sideIndex,1)
          self[side] = value[side]

        }

      }

      sides.forEach(function(k){
        self[k] = 0
      })

    }

    return userValue

  },
  "value": 0
}
