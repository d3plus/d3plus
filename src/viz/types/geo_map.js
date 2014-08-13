//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Geo Map
//------------------------------------------------------------------------------
var geo_map = function(vars) {

  topojson.presimplify(vars.coords.value)

  var coords = vars.coords.value
    , key = d3.keys(coords.objects)[0]
    , topo = topojson.feature(coords, coords.objects[key])
    , features = topo.features

  var features = features.filter(function(f){

    f[vars.id.value] = f.id

    if (vars.coords.solo.value.length) {

      return vars.coords.solo.value.indexOf(f.id) >= 0

    }
    else if (vars.coords.mute.value.length) {

      return vars.coords.mute.value.indexOf(f.id) < 0

    }

    return true

  })

  return features

};

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
geo_map.libs         = [ "topojson" ];
geo_map.nesting      = false
geo_map.requirements = [ "color" , "coords" ];
geo_map.scale        = 1
geo_map.shapes       = [ "coordinates" ];
geo_map.tooltip      = "follow"
geo_map.zoom         = true

module.exports = geo_map
