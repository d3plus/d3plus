d3plus.apps.geo_map = {}
d3plus.apps.geo_map.data = "object";
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
    f[vars.id.key] = f.id
    if (vars.coords.solo.value.length) {
      return vars.coords.solo.value.indexOf(f.id) >= 0
    }
    else if (vars.coords.mute.value.length) {
      return vars.coords.mute.value.indexOf(f.id) < 0
    }
    return true
  })

  vars.mouse[d3plus.evt.click] = function(d) {

    d3plus.tooltip.remove(vars.type.value)

    if (d[vars.id.key] == vars.focus.value) {
      vars.viz.focus(null).draw()
    }
    else {
      vars.viz.focus(d[vars.id.key]).draw()
    }
  }

  return features

};
