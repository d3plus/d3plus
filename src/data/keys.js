//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get Key Types from Data
//-------------------------------------------------------------------
d3plus.data.keys = function(vars,type) {

  vars[type].keys = {}

  function get_keys(arr,add) {
    if (arr instanceof Array) {
      arr.forEach(function(d){
        get_keys(d)
      })
    }
    else if ( d3plus.object.validate(arr) ) {
      for (var d in arr) {
        if ( d3plus.object.validate(arr[d]) ) {
          get_keys(arr[d])
        }
        else if (!(d in vars[type].keys) && arr[d]) {
          vars[type].keys[d] = typeof arr[d]
        }
      }
      if (add) {
        arr.d3plus = {}
      }
    }
  }

  if (d3plus.object.validate(vars[type].value)) {
    for (a in vars[type].value) {
      get_keys(vars[type].value[a],type == "data")
    }
  }
  else {
    get_keys(vars[type].value,type == "data")
  }

}
