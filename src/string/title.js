//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats numbers to look "pretty"
//------------------------------------------------------------------------------
d3plus.string.title = function( text , key , vars ) {

  if (!text) {
    return ""
  }

  if ( "locale" in this ) {
    var locale = this.locale.value
    if ( typeof locale === "string" ) {
      locale = locale in d3plus.locale
             ? d3plus.locale[locale] : d3plus.locale.en
    }
  }
  else {
    var locale = d3plus.locale.en
  }

  if ( text.charAt(text.length-1) === "." ) {
    return txt.charAt(1).toUpperCase() + txt.substr(1)
  }

  var smalls = locale.lowercase,
      bigs   = locale.uppercase

  return text.replace(/\w\S*/g, function(txt,i){

    if ( bigs.indexOf(txt.toLowerCase()) >= 0 ) {
      return txt.toUpperCase()
    }
    else if ( smalls.indexOf(txt.toLowerCase()) >= 0
              && i !== 0 && i !== text.length-1 ) {
      return txt.toLowerCase()
    }

    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()

  })

}
