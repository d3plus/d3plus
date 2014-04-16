d3plus.method.text_format = {
  "value": function(text,key,vars) {

    if (!text) {
      return ""
    }

    var smalls = ["a","and","of","to"]

    return text.replace(/\w\S*/g, function(txt,i){

      if (smalls.indexOf(txt) >= 0 && i != 0) {
        return txt
      }

      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()

    })

  }
}
