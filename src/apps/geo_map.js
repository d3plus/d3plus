d3plus.apps.geo_map = {}
d3plus.apps.geo_map.data = "object";
d3plus.apps.geo_map.libs = ["topojson"];
d3plus.apps.geo_map.requirements = ["color","coords"];
d3plus.apps.geo_map.tooltip = "follow"
d3plus.apps.geo_map.shapes = ["coordinates"];
d3plus.apps.geo_map.scale = 1

d3plus.apps.geo_map.draw = function(vars) {
  
  topojson.presimplify(vars.coords.default)
  
  var coords = vars.coords.default,
      key = Object.keys(coords.objects)[0]
      topo = topojson.feature(coords, coords.objects[key]),
      features = topo.features
      
  features.forEach(function(f){
    f[vars.id.key] = f.id
  })
  
  return features
  
};
