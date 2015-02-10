var stringFormat = require("../../../../string/format.js"),
    stringStrip = require("../../../../string/strip.js");

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and populates the dropdown list of items.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  if ( vars.data.url && !vars.data.loaded ) {
    var loadingObject = {};
    loadingObject[vars.text.value || vars.id.value] = vars.format.value(vars.format.locale.value.ui.loading);
    vars.data.filtered = [loadingObject];
    vars.data.changed = vars.data.lastFilter !== "loading";
    vars.data.lastFilter = "loading";
  }
  else if (vars.open.value) {

    if (!vars.search.term) {
      vars.data.filtered = vars.data.viz;
      vars.data.changed = vars.data.lastFilter !== "viz";
      vars.data.lastFilter = "viz";
      if (vars.id.nesting.length > 1 && vars.depth.value < vars.id.nesting.length-1) {
        vars.data.filtered = vars.data.filtered.filter(function(d){
          if ("endPoint" in d.d3plus && d.d3plus.endPoint === vars.depth.value) {
            d.d3plus.icon = false;
          }
          return true;
        });
        vars.data.changed = vars.data.lastFilter !== "depth";
        vars.data.lastFilter = "depth";
      }
    }
    else {

      var searchWords = stringStrip(vars.search.term).split("_"),
          searchKeys  = [vars.id.value, vars.text.value, vars.alt.value, vars.keywords.value ];

      searchKeys = searchKeys.filter(function(t){ return t; });
      searchWords = searchWords.filter(function(t){ return t !== ""; });

      var startMatches = [],
          exactMatches = [],
          softMatches  = [],
          searchData   = [];

      vars.id.nesting.forEach(function(n){
        searchData = searchData.concat(vars.data.nested.all[n]);
      });

      searchData.forEach(function(d){

        var match = false;

        searchKeys.forEach(function(key){

          if ( !match && key in d && typeof d[key] === "string" ) {

            var text = d[key].toLowerCase();

            if ( [vars.text.value,vars.id.value].indexOf(key) >= 0 && text.indexOf(vars.search.term) === 0 ) {
              startMatches.push(d);
              match = true;
            }
            else if ( text.indexOf(vars.search.term) >= 0 ) {
              exactMatches.push(d);
              match = true;
            }
            else {

              var texts = stringStrip(text).split("_");

              for (var t in texts) {

                if ( !match ) {

                  for (var s in searchWords) {
                    if (texts[t].indexOf(searchWords[s]) === 0) {
                      softMatches.push(d);
                      match = true;
                      break;
                    }
                  }

                }
                else {
                  break;
                }

              }

            }
          }

        });

      });

      vars.data.filtered = d3.merge([ startMatches , exactMatches , softMatches ]);

      vars.data.filtered.forEach(function(d,i){
        d.d3plus_order = i;
      });

      vars.data.changed = true;
      vars.data.lastFilter = "search";

      if ( vars.data.filtered.length === 0 ) {

        var noData = {}, str = vars.format.value(vars.format.locale.value.ui.noResults);
        noData[vars.text.value || vars.id.value] = stringFormat(str,"\""+vars.search.term+"\"");
        vars.data.filtered = [ noData ];

      }

    }

  }
  else {
    vars.data.filtered = [];
  }

};
