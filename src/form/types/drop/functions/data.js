//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and populates the dropdown list of items.
//------------------------------------------------------------------------------
d3plus.input.drop.data = function ( vars ) {

  if ( vars.data.url && !vars.data.loaded ) {
    var loadingObject = {}
    loadingObject[vars.text.value] = vars.format.value(vars.format.locale.value.ui.loading)
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

      var exactMatches = []
        , softMatches  = []

      vars.data.value.forEach(function(d){

        var match = false

        searchKeys.forEach(function(key){

          if ( !match && key in d && typeof d[key] === "string" ) {

            var text = d[key].toLowerCase()

            if ( text.indexOf(searchText) >= 0 ) {
              exactMatches.push(d)
              match = true
            }
            else {

              var texts = d3plus.util.strip(text).split("_")

              for (t in texts) {

                if ( !match ) {

                  for (s in searchWords) {
                    if (texts[t].indexOf(searchWords[s]) === 0) {
                      softMatches.push(d)
                      match = true
                      break
                    }
                  }

                }
                else {
                  break
                }

              }

            }
          }

        })

      })

      vars.data.filtered = exactMatches.concat(softMatches)

    }

    if ( vars.data.filtered.length === 0 ) {

      var noData = {}
        , str = vars.format.value(vars.format.locale.value.ui.noResults)
      noData[vars.text.value] = d3plus.util.format(str,searchText)
      vars.data.filtered = [ noData ]

    }

  }
  else {
    vars.data.filtered = []
  }

}
