d3plus.apps.geo_map = {}
d3plus.apps.geo_map.libs = ["topojson"];
d3plus.apps.geo_map.requirements = ["color","coords"];
d3plus.apps.geo_map.tooltip = "follow"
d3plus.apps.geo_map.shapes = ["coordinates"];
d3plus.apps.geo_map.scale = 1
d3plus.apps.geo_map.nesting = false
d3plus.apps.geo_map.zoom = true

d3plus.apps.geo_map.draw = function(vars) {

  topojson.presimplify(vars.coords.value)

  var coords = vars.coords.value,
      key = Object.keys(coords.objects)[0]
      topo = topojson.feature(coords, coords.objects[key]),
      features = topo.features

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
