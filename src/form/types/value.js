d3plus.form.value = function(obj,arr) {
  
  if (typeof obj == "object" && arr) {
    var ret = false
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] in obj) {
        ret = obj[arr[i]]
        break;
      }
    }
    if (ret) {
      return ret
    }
  }
  else if (typeof obj != "object") {
    return obj
  }
  else {
    return false
  }
  
}