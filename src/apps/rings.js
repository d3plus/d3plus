d3plus.apps.rings = {}
d3plus.apps.rings.requirements = ["edges","focus"];
d3plus.apps.rings.tooltip = "static"
d3plus.apps.rings.shapes = ["circle","square","donut"];
d3plus.apps.rings.scale = 1
d3plus.apps.rings.nesting = false
d3plus.apps.rings.filter = function(vars,data) {

  var primaries = vars.connections(vars.focus.value,true)
    , secondaries = []
  
  primaries.forEach(function(p){
    secondaries = secondaries.concat(vars.connections(p[vars.id.key],true))
  })

  var connections = primaries.concat(secondaries)
    , ids = d3plus.utils.uniques(connections,vars.id.key)

  return data.filter(function(d){

    return ids.indexOf(d[vars.id.key]) >= 0

  })

}

d3plus.apps.rings.draw = function(vars) {

  var radius = d3.min([vars.app_height,vars.app_width])/2
    , ring_width = vars.small || !vars.labels.value
                 ? (radius-vars.style.labels.padding*2)/2 : radius/3
    , primaryRing = vars.small || !vars.labels.value
                  ? ring_width*1.4 : ring_width
    , secondaryRing = ring_width*2
    , edges = []
    , nodes = []

  var center = vars.data.app.filter(function(d){
    return d[vars.id.key] == vars.focus.value
  })[0]

  if (!center) {
    center = {"d3plus": {}}
    center[vars.id.key] = vars.focus.value
  }
  center.d3plus.x = vars.app_width/2
  center.d3plus.y = vars.app_height/2
  center.d3plus.r = primaryRing*.65

  var primaries = [], claimed = [vars.focus.value]
  vars.connections(vars.focus.value).forEach(function(edge){

    var c = edge[vars.edges.source][vars.id.key] == vars.focus.value ? edge[vars.edges.target] : edge[vars.edges.source]
    var n = vars.data.app.filter(function(d){
      return d[vars.id.key] == c[vars.id.key]
    })[0]
    if (!n) {
      n = {"d3plus": {}}
      n[vars.id.key] = c[vars.id.key]
    }
    n.d3plus.edges = vars.connections(n[vars.id.key]).filter(function(c){
      return c[vars.edges.source][vars.id.key] != vars.focus.value && c[vars.edges.target][vars.id.key] != vars.focus.value
    })
    n.d3plus.edge = edge
    claimed.push(n[vars.id.key])
    primaries.push(n)

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sort primary nodes by children (smallest to largest) and then by sort
  // order.
  //--------------------------------------------------------------------------
  var sort = null
  if (vars.order.key) {
    sort = vars.order.key
  }
  else if (vars.color.key) {
    sort = vars.color.key
  }
  else if (vars.size.key) {
    sort = vars.size.key
  }
  else {
    sort = vars.id.key
  }

  function sort_function(a,b){

    a_value = d3plus.variable.value(vars,a,sort)
    b_value = d3plus.variable.value(vars,b,sort)

    if (vars.color.key && sort == vars.color.key) {

      a_value = d3plus.variable.color(vars,a)
      b_value = d3plus.variable.color(vars,b)

      a_value = d3.rgb(a_value).hsl()
      b_value = d3.rgb(b_value).hsl()

      if (a_value.s == 0) a_value = 361
      else a_value = a_value.h
      if (b_value.s == 0) b_value = 361
      else b_value = b_value.h

    }
    else {
      a_value = d3plus.variable.value(vars,a,sort)
      b_value = d3plus.variable.value(vars,b,sort)
    }

    if(a_value<b_value) return vars.order.sort.value == "desc" ? -1 : 1;
    if(a_value>b_value) return vars.order.sort.value == "desc" ? 1 : -1;

  }

  primaries.sort(function(a,b){

    var lengthdiff = a.d3plus.edges.length - b.d3plus.edges.length

    if (lengthdiff) {

      return lengthdiff

    }
    else {

      return sort_function(a,b)

    }

  })

  if (typeof vars.edges.limit == "number") {
    primaries = primaries.slice(0,vars.edges.limit)
  }
  else if (typeof vars.edges.limit == "function") {
    primaries = vars.edges.limit(primaries)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check for similar children and give preference to nodes with less
  // overall children.
  //----------------------------------------------------------------------------
  var secondaries = [], total = 0
  primaries.forEach(function(p){

    var primaryId = p[vars.id.key]

    p.d3plus.edges = p.d3plus.edges.filter(function(c){

      var source = c[vars.edges.source][vars.id.key]
        , target = c[vars.edges.target][vars.id.key]
      return (claimed.indexOf(source) < 0 && target == primaryId)
          || (claimed.indexOf(target) < 0 && source == primaryId)

    })

    total += p.d3plus.edges.length || 1

    p.d3plus.edges.forEach(function(c){

      var source = c[vars.edges.source]
        , target = c[vars.edges.target]
      var claim = target[vars.id.key] == primaryId ? source : target
      claimed.push(claim[vars.id.key])

    })
  })

  primaries.sort(sort_function)

  var offset = 0,
      radian = Math.PI*2,
      start = 0

  primaries.forEach(function(p,i){

    var children = p.d3plus.edges.length || 1,
        space = (radian/total)*children

    if (i == 0) {
      start = angle
      offset -= space/2
    }

    var angle = offset+(space/2)
    angle -= radian/4

    p.d3plus.radians = angle
    p.d3plus.x = vars.app_width/2 + (primaryRing * Math.cos(angle))
    p.d3plus.y = vars.app_height/2 + (primaryRing * Math.sin(angle))

    offset += space
    p.d3plus.edges.sort(function(a,b){

      var a = a[vars.edges.source][vars.id.key] == p[vars.id.key]
            ? a[vars.edges.target] : a[vars.edges.source]
        , b = b[vars.edges.source][vars.id.key] == p[vars.id.key]
            ? b[vars.edges.target] : b[vars.edges.source]

      return sort_function(a,b)

    })

    p.d3plus.edges.forEach(function(edge,i){

      var c = edge[vars.edges.source][vars.id.key] == p[vars.id.key]
          ? edge[vars.edges.target] : edge[vars.edges.source]
        , s = radian/total

      var d = vars.data.app.filter(function(a){
        return a[vars.id.key] == c[vars.id.key]
      })[0]

      if (!d) {
        d = {"d3plus": {}}
        d[vars.id.key] = c[vars.id.key]
      }

      a = (angle-(s*children/2)+(s/2))+((s)*i)
      d.d3plus.radians = a
      d.d3plus.x = vars.app_width/2 + ((secondaryRing) * Math.cos(a))
      d.d3plus.y = vars.app_height/2 + ((secondaryRing) * Math.sin(a))
      secondaries.push(d)
    })

  })

  var primaryDistance = d3.min(d3plus.utils.distances(primaries,function(n){
        return [n.d3plus.x,n.d3plus.y]
      }))
    , secondaryDistance = d3.min(d3plus.utils.distances(secondaries,function(n){
        return [n.d3plus.x,n.d3plus.y]
      }))

  if (!primaryDistance) {
    primaryDistance = ring_width/2
  }

  if (!secondaryDistance) {
    secondaryDistance = 16
  }

  if (primaryDistance/2 - 4 < 8) {
    var primaryMax = d3.min([primaryDistance/2,8])
  }
  else {
    var primaryMax = primaryDistance/2 - 4
  }

  if (secondaryDistance/2 - 4 < 4) {
    var secondaryMax = d3.min([secondaryDistance/2,4])
  }
  else {
    var secondaryMax = secondaryDistance/2 - 4
  }

  if (secondaryMax > ring_width/10) {
    secondaryMax = ring_width/10
  }

  if (primaryMax > secondaryMax*2) {
    primaryMax = secondaryMax*2
  }

  var ids = d3plus.utils.uniques(primaries,vars.id.key)
  ids = ids.concat(d3plus.utils.uniques(secondaries,vars.id.key))
  ids.push(vars.focus.value)

  var data = vars.data.app.filter(function(d){
    return ids.indexOf(d[vars.id.key]) >= 0
  })

  if (vars.size.key) {

    var domain = d3.extent(data,function(d){
      return d3plus.variable.value(vars,d,vars.size.key)
    })

    if (domain[0] == domain[1]) {
      domain[0] = 0
    }

    var radius = d3.scale.linear()
      .domain(domain)
      .range([3,d3.min([primaryMax,secondaryMax])])

    var val = d3plus.variable.value(vars,center,vars.size.key)
    center.d3plus.r = radius(val)

  }
  else {
    var radius = d3.scale.linear()
      .domain([1,2])
      .range([primaryMax,secondaryMax])
  }

  secondaries.forEach(function(s){
    s.d3plus.ring = 2
    var val = vars.size.key ? d3plus.variable.value(vars,s,vars.size.key) : 2
    s.d3plus.r = radius(val)
  })

  primaries.forEach(function(p,i){

    p.d3plus.ring = 1
    var val = vars.size.key ? d3plus.variable.value(vars,p,vars.size.key) : 1
    p.d3plus.r = radius(val)

    var check = [vars.edges.source,vars.edges.target]

    check.forEach(function(node){
      if (p.d3plus.edge[node][vars.id.key] == center[vars.id.key]) {

        p.d3plus.edge[node].d3plus = {
          "x": center.d3plus.x,
          "y": center.d3plus.y
        }

        var offset = d3plus.utils.offset(p.d3plus.radians,center.d3plus.r,vars.shape.value)

        p.d3plus.edge[node].d3plus.x += offset.x
        p.d3plus.edge[node].d3plus.y += offset.y

      }
      else {

        p.d3plus.edge[node].d3plus = {
          "x": p.d3plus.x-(p.d3plus.r * Math.cos(p.d3plus.radians)),
          "y": p.d3plus.y-(p.d3plus.r * Math.sin(p.d3plus.radians))
        }

      }
    })

    delete p.d3plus.edge.d3plus
    edges.push(p.d3plus.edge)

    vars.connections(p[vars.id.key]).forEach(function(edge){

      var c = edge[vars.edges.source][vars.id.key] == p[vars.id.key]
            ? edge[vars.edges.target] : edge[vars.edges.source]

      if (c[vars.id.key] != center[vars.id.key]) {

        var target = secondaries.filter(function(s){
          return s[vars.id.key] == c[vars.id.key]
        })[0]

        if (!target) {
          var r = primaryRing
          target = primaries.filter(function(s){
            return s[vars.id.key] == c[vars.id.key]
          })[0]
        }
        else {
          var r = secondaryRing
        }

        if (target) {

          edge.d3plus = {
            "spline": true,
            "translate": {
              "x": vars.app_width/2,
              "y": vars.app_height/2
            }
          }

          var check = [vars.edges.source,vars.edges.target]

          check.forEach(function(node){
            if (edge[node][vars.id.key] == p[vars.id.key]) {

              edge[node].d3plus = {
                "a": p.d3plus.radians,
                "r": primaryRing+p.d3plus.r
              }

            }
            else {

              edge[node].d3plus = {
                "a": target.d3plus.radians,
                "r": r-target.d3plus.r
              }

            }
          })

          edges.push(edge)

        }

      }

    })

  })

  nodes = [center].concat(primaries).concat(secondaries)

  nodes.forEach(function(n) {

    if (n[vars.id.key] != vars.focus.value && !vars.small && vars.labels.value) {

      n.d3plus.rotate = n.d3plus.radians*(180/Math.PI)

      if (vars.labels.value) {
        var angle = n.d3plus.rotate,
            width = ring_width-(vars.style.labels.padding*3)-n.d3plus.r

        if (angle < -90 || angle > 90) {
          angle = angle-180
          var buffer = -(n.d3plus.r+width/2+vars.style.labels.padding),
              anchor = "end"
        }
        else {
          var buffer = n.d3plus.r+width/2+vars.style.labels.padding,
              anchor = "start"
        }

        var background = primaries.indexOf(n) >= 0 ? true : false

        var height = n.d3plus.ring == 1 ? primaryDistance : secondaryDistance
        height += vars.style.labels.padding*2

        n.d3plus.label = {
          "x": buffer,
          "y": 0,
          "w": width,
          "h": height,
          "angle": angle,
          "anchor": anchor,
          "valign": "center",
          "color": d3plus.color.legible(d3plus.variable.color(vars,n[vars.id.key])),
          "resize": [8,vars.style.labels.font.size],
          "background": background,
          "mouse": true
        }

      }

    }
    else {
      delete n.d3plus.rotate
      delete n.d3plus.label
    }

  })

  vars.mouse[d3plus.evt.click] = function(d) {
    if (d[vars.id.key] != vars.focus.value) {
      d3plus.tooltip.remove(vars.type.value)
      vars.viz.focus(d[vars.id.key]).draw()
    }
  }

  return {"edges": edges, "nodes": nodes, "data": data}

};
