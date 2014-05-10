//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and populates the dropdown list of items.
//------------------------------------------------------------------------------
d3plus.input.drop.data = function ( vars ) {
  
  if ( vars.data.url && !vars.data.loaded ) {
    var loadingObject = {}
    loadingObject[vars.text.value] = vars.format.value("Loading...")
    vars.data.filtered = [loadingObject]
  }
  else if (vars.open.value) {

    var searchText  = vars.text.solo.value.length ? vars.text.solo.value[0] : ""
      , searchWords = d3plus.util.strip(searchText.toLowerCase()).split("_")
      , searchKeys  = [ vars.id.value
                      , vars.text.value
                      , vars.alt.value
                      , vars.keywords.value ]

    searchWords = searchWords.filter(function(t){ return t != ""; })

    if (!vars.text.solo.value.length || vars.text.solo.value[0] === "") {
      vars.data.filtered = vars.data.value
    }
    else {

      vars.data.filtered = vars.data.value.filter(function(d){

        var match = false

        searchKeys.forEach(function(key){

          if (key in d && d[key]) {

            var text = d3plus.util.strip(d[key].toLowerCase()).split("_")

            for (t in text) {
              for (s in searchWords) {
                if (text[t].indexOf(searchWords[s]) === 0) {
                  match = true
                  break
                }
              }
            }
          }

        })

        return match

      })

    }

    if ( vars.data.filtered.length === 0 ) {

      var noData = {}
      noData[vars.text.value] = vars.format.value("No results match")+" \""+searchText+"\""
      vars.data.filtered = [ noData ]

    }

  }
  else {
    vars.data.filtered = []
  }

}
