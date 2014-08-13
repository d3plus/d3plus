//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and populates the dropdown list of items.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  if ( vars.data.url && !vars.data.loaded ) {
    var loadingObject = {}
    loadingObject[vars.text.value || vars.id.value] = vars.format.value(vars.format.locale.value.ui.loading)
    vars.data.filtered = [loadingObject]
  }
  else if (vars.open.value) {

    var searchText  = vars.text.solo.value.length
                    ? vars.text.solo.value[0].toLowerCase() : ""
      , searchWords = d3plus.string.strip(searchText).split("_")
      , searchKeys  = [ vars.id.value
                      , vars.text.value
                      , vars.alt.value
                      , vars.keywords.value ]

    searchKeys = searchKeys.filter(function(t){ return t })
    searchWords = searchWords.filter(function(t){ return t != ""; })

    if (!vars.text.solo.value.length || vars.text.solo.value[0] === "") {
      vars.data.filtered = vars.data.app
      if (vars.id.nesting.length > 1 && vars.depth.value < vars.id.nesting.length-1) {
        vars.data.filtered = vars.data.filtered.filter(function(d){
          if ("endPoint" in d.d3plus && d.d3plus.endPoint === vars.depth.value) {
            d.d3plus.icon = false
          }
          return true
        })
      }
    }
    else {

      var startMatches = []
        , exactMatches = []
        , softMatches  = []
        , searchData   = []

      vars.id.nesting.forEach(function(n){
        searchData = searchData.concat(vars.data.nested.all[n])
      })

      searchData.forEach(function(d){

        var match = false

        searchKeys.forEach(function(key){

          if ( !match && key in d && typeof d[key] === "string" ) {

            var text = d[key].toLowerCase()

            if ( [vars.text.value,vars.id.value].indexOf(key) >= 0 && text.indexOf(searchText) == 0 ) {
              startMatches.push(d)
              match = true
            }
            else if ( text.indexOf(searchText) >= 0 ) {
              exactMatches.push(d)
              match = true
            }
            else {

              var texts = d3plus.string.strip(text).split("_")

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

      vars.data.filtered = d3.merge([ startMatches , exactMatches , softMatches ])

      vars.data.filtered.forEach(function(d,i){
        d.d3plus_order = i
      })

    }

    if ( vars.data.filtered.length === 0 ) {

      var noData = {}
        , str = vars.format.value(vars.format.locale.value.ui.noResults)
      noData[vars.text.value || vars.id.value] = d3plus.string.format(str,"\""+searchText+"\"")
      vars.data.filtered = [ noData ]

    }

  }
  else {
    vars.data.filtered = []
  }

}
