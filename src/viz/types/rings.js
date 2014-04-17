d3plus.visualization.rings = function(vars) {

  var radius = d3.min([vars.app_height,vars.app_width])/2
    , ring_width = vars.small || !vars.labels.value
                 ? (radius-vars.style.labels.padding*2)/2 : radius/3
    , primaryRing = vars.small || !vars.labels.value
                  ? ring_width*1.4 : ring_width
    , secondaryRing = ring_width*2
    , edges = []
    , nodes = []

  var center = vars.data.app.filter(function(d){
    return d[vars.id.value] == vars.focus.value
  })[0]

  if (!center) {
    center = {"d3plus": {}}
    center[vars.id.value] = vars.focus.value
  }
  center.d3plus.x = vars.app_width/2
  center.d3plus.y = vars.app_height/2
  center.d3plus.r = primaryRing*.65

  var primaries = [], claimed = [vars.focus.value]
  vars.edges.connections(vars.focus.value,vars.id.value).forEach(function(edge){

    var c = edge[vars.edges.source][vars.id.value] == vars.focus.value ? edge[vars.edges.target] : edge[vars.edges.source]
    var n = vars.data.app.filter(function(d){
      return d[vars.id.value] == c[vars.id.value]
    })[0]
    if (!n) {
      n = {"d3plus": {}}
      n[vars.id.value] = c[vars.id.value]
    }
    n.d3plus.edges = vars.edges.connections(n[vars.id.value],vars.id.value).filter(function(c){
      return c[vars.edges.source][vars.id.value] != vars.focus.value && c[vars.edges.target][vars.id.value] != vars.focus.value
    })
    n.d3plus.edge = edge
    claimed.push(n[vars.id.value])
    primaries.push(n)

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sort primary nodes by children (smallest to largest) and then by sort
  // order.
  //--------------------------------------------------------------------------
  var sort = null
  if (vars.order.value) {
    sort = vars.order.value
  }
  else if (vars.color.value) {
    sort = vars.color.value
  }
  else if (vars.size.value) {
    sort = vars.size.value
  }
  else {
    sort = vars.id.value
  }

  function sort_function(a,b){

    a_value = d3plus.variable.value(vars,a,sort)
    b_value = d3plus.variable.value(vars,b,sort)

    if (vars.color.value && sort == vars.color.value) {

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

    var primaryId = p[vars.id.value]

    p.d3plus.edges = p.d3plus.edges.filter(function(c){

      var source = c[vars.edges.source][vars.id.value]
        , target = c[vars.edges.target][vars.id.value]
      return (claimed.indexOf(source) < 0 && target == primaryId)
          || (claimed.indexOf(target) < 0 && source == primaryId)

    })

    total += p.d3plus.edges.length || 1

    p.d3plus.edges.forEach(function(c){

      var source = c[vars.edges.source]
        , target = c[vars.edges.target]
      var claim = target[vars.id.value] == primaryId ? source : target
      claimed.push(claim[vars.id.value])

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

      var a = a[vars.edges.source][vars.id.value] == p[vars.id.value]
            ? a[vars.edges.target] : a[vars.edges.source]
        , b = b[vars.edges.source][vars.id.value] == p[vars.id.value]
            ? b[vars.edges.target] : b[vars.edges.source]

      return sort_function(a,b)

    })

    p.d3plus.edges.forEach(function(edge,i){

      var c = edge[vars.edges.source][vars.id.value] == p[vars.id.value]
          ? edge[vars.edges.target] : edge[vars.edges.source]
        , s = radian/total

      var d = vars.data.app.filter(function(a){
        return a[vars.id.value] == c[vars.id.value]
      })[0]

      if (!d) {
        d = {"d3plus": {}}
        d[vars.id.value] = c[vars.id.value]
      }

      a = (angle-(s*children/2)+(s/2))+((s)*i)
      d.d3plus.radians = a
      d.d3plus.x = vars.app_width/2 + ((secondaryRing) * Math.cos(a))
      d.d3plus.y = vars.app_height/2 + ((secondaryRing) * Math.sin(a))
      secondaries.push(d)
    })

  })

  var primaryDistance = d3.min(d3plus.util.distances(primaries,function(n){
        return [n.d3plus.x,n.d3plus.y]
      }))
    , secondaryDistance = d3.min(d3plus.util.distances(secondaries,function(n){
        return [n.d3plus.x,n.d3plus.y]
      }))

  if (!primaryDistance) {
    primaryDistance = ring_width/2
  }

  if (!secondaryDistance) {
    secondaryDistance = ring_width/4
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

  if (primaryMax > secondaryMax*1.5) {
    primaryMax = secondaryMax*1.5
  }

  primaryMax = Math.floor(primaryMax)
  secondaryMax = Math.floor(secondaryMax)

  var ids = d3plus.util.uniques(primaries,vars.id.value)
  ids = ids.concat(d3plus.util.uniques(secondaries,vars.id.value))
  ids.push(vars.focus.value)

  var data = vars.data.app.filter(function(d){
    return ids.indexOf(d[vars.id.value]) >= 0
  })

  if (vars.size.value) {

    var domain = d3.extent(data,function(d){
      return d3plus.variable.value(vars,d,vars.size.value)
    })

    if (domain[0] == domain[1]) {
      domain[0] = 0
    }

    var radius = d3.scale.linear()
      .domain(domain)
      .rangeRound([3,d3.min([primaryMax,secondaryMax])])

    var val = d3plus.variable.value(vars,center,vars.size.value)
    center.d3plus.r = radius(val)

  }
  else {

    var radius = d3.scale.linear()
      .domain([1,2])
      .rangeRound([primaryMax,secondaryMax])


    if (vars.edges.label) {
      center.d3plus.r = radius(1)*1.5
    }

  }

  secondaries.forEach(function(s){
    s.d3plus.ring = 2
    var val = vars.size.value ? d3plus.variable.value(vars,s,vars.size.value) : 2
    s.d3plus.r = radius(val)
  })

  primaries.forEach(function(p,i){

    p.d3plus.ring = 1
    var val = vars.size.value ? d3plus.variable.value(vars,p,vars.size.value) : 1
    p.d3plus.r = radius(val)

    var check = [vars.edges.source,vars.edges.target]

    check.forEach(function(node){
      if (p.d3plus.edge[node][vars.id.value] == center[vars.id.value]) {

        p.d3plus.edge[node].d3plus = {
          "x": center.d3plus.x,
          "y": center.d3plus.y,
          "r": center.d3plus.r
        }

      }
      else {

        p.d3plus.edge[node].d3plus = {
          "x": p.d3plus.x,
          "y": p.d3plus.y,
          "r": p.d3plus.r
        }

      }
    })

    delete p.d3plus.edge.d3plus
    edges.push(p.d3plus.edge)

    vars.edges.connections(p[vars.id.value],vars.id.value).forEach(function(edge){

      var c = edge[vars.edges.source][vars.id.value] == p[vars.id.value]
            ? edge[vars.edges.target] : edge[vars.edges.source]

      if (c[vars.id.value] != center[vars.id.value]) {

        var target = secondaries.filter(function(s){
          return s[vars.id.value] == c[vars.id.value]
        })[0]

        if (!target) {
          var r = primaryRing
          target = primaries.filter(function(s){
            return s[vars.id.value] == c[vars.id.value]
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
            if (edge[node][vars.id.value] == p[vars.id.value]) {

              edge[node].d3plus = {
                "a": p.d3plus.radians,
                "r": primaryRing+p.d3plus.r,
                "depth": 1
              }

            }
            else {

              edge[node].d3plus = {
                "a": target.d3plus.radians,
                "r": r-target.d3plus.r,
                "depth": 2
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

    if (!vars.small && vars.labels.value) {

      if (n[vars.id.value] != vars.focus.value) {

        n.d3plus.rotate = n.d3plus.radians*(180/Math.PI)

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
          "color": d3plus.color.legible(d3plus.variable.color(vars,n[vars.id.value])),
          "resize": [8,vars.style.labels.font.size],
          "background": background,
          "mouse": true
        }

      }
      else if (vars.size.value || vars.edges.label) {

        var height = primaryRing-n.d3plus.r*2-vars.style.labels.padding*2

        n.d3plus.label = {
          "x": 0,
          "y": n.d3plus.r+height/2,
          "w": primaryRing,
          "h": height,
          "color": d3plus.color.legible(d3plus.variable.color(vars,n[vars.id.value])),
          "resize": [10,40],
          "background": true,
          "mouse": true
        }

      }
      else {
        delete n.d3plus.rotate
        delete n.d3plus.label
      }

    }
    else {
      delete n.d3plus.rotate
      delete n.d3plus.label
    }

  })

  vars.mouse[d3plus.evt.click] = function(d) {
    if (d[vars.id.value] != vars.focus.value) {
      d3plus.tooltip.remove(vars.type.value)
      vars.viz.focus(d[vars.id.value]).draw()
    }
  }

  return {"edges": edges, "nodes": nodes, "data": data}

};

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
d3plus.visualization.rings.requirements = ["edges","focus"];
d3plus.visualization.rings.tooltip = "static"
d3plus.visualization.rings.shapes = ["circle","square","donut"];
d3plus.visualization.rings.scale = 1
d3plus.visualization.rings.nesting = false
d3plus.visualization.rings.filter = function(vars,data) {

  var primaries = vars.edges.connections(vars.focus.value,vars.id.value,true)
    , secondaries = []

  primaries.forEach(function(p){
    secondaries = secondaries.concat(vars.edges.connections(p[vars.id.value],vars.id.value,true))
  })

  var connections = primaries.concat(secondaries)
    , ids = d3plus.util.uniques(connections,vars.id.value)

  if (data === undefined) {
    return ids
  }

  return data.filter(function(d){

    return ids.indexOf(d[vars.id.value]) >= 0

  })

}
