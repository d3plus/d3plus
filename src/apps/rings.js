d3plus.apps.rings = {}
d3plus.apps.rings.requirements = ["edges","focus"];
d3plus.apps.rings.tooltip = "static"
d3plus.apps.rings.shapes = ["circle","square","donut"];
d3plus.apps.rings.scale = 1
d3plus.apps.rings.nesting = false

d3plus.apps.rings.draw = function(vars) {

  var radius = d3.min([vars.app_height,vars.app_width])/2,
      ring_width = vars.small || !vars.labels.value ? radius/2.25 : radius/3,
      edges = [],
      nodes = []

  var center = vars.data.app.filter(function(d){
    return d[vars.id.key] == vars.focus.value
  })[0]

  if (!center) {
    center = {"d3plus": {}}
    center[vars.id.key] = vars.focus.value
  }
  center.d3plus.x = vars.app_width/2
  center.d3plus.y = vars.app_height/2
  center.d3plus.r = ring_width/2

  var primaries = [], claimed = []
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

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check for similar children and give preference to nodes with less
  // overall children.
  //--------------------------------------------------------------------------
  var secondaries = [], total = 0
  primaries.forEach(function(p){
    p.d3plus.edges = p.d3plus.edges.filter(function(c){
      return (claimed.indexOf(c[vars.edges.source][vars.id.key]) < 0 && c[vars.edges.target][vars.id.key] == p[vars.id.key])
          || (claimed.indexOf(c[vars.edges.target][vars.id.key]) < 0 && c[vars.edges.source][vars.id.key] == p[vars.id.key])
    })
    total += p.d3plus.edges.length || 1
    p.d3plus.edges.forEach(function(c){
      var claim = c[vars.edges.target][vars.id.key] == p[vars.id.key] ? c[vars.edges.source] : c[vars.edges.target]
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
    p.d3plus.x = vars.app_width/2 + (ring_width * Math.cos(angle))
    p.d3plus.y = vars.app_height/2 + (ring_width * Math.sin(angle))
    p.d3plus.r = 8

    var check = [vars.edges.source,vars.edges.target]

    check.forEach(function(node){
      if (p.d3plus.edge[node][vars.id.key] == center[vars.id.key]) {

        p.d3plus.edge[node].d3plus = {
          "x": center.d3plus.x,
          "y": center.d3plus.y
        }

        var offset = d3plus.utils.offset(angle,center.d3plus.r,vars.shape.value)

        p.d3plus.edge[node].d3plus.x += offset.x
        p.d3plus.edge[node].d3plus.y += offset.y

      }
      else {

        p.d3plus.edge[node].d3plus = {
          "x": p.d3plus.x-(p.d3plus.r * Math.cos(angle)),
          "y": p.d3plus.y-(p.d3plus.r * Math.sin(angle))
        }

      }
    })

    delete p.d3plus.edge.d3plus
    edges.push(p.d3plus.edge)

    offset += space
    p.d3plus.edges.sort(function(a,b){

      var a = a[vars.edges.source][vars.id.key] == p[vars.id.key] ? a[vars.edges.target] : a[vars.edges.source],
          b = b[vars.edges.source][vars.id.key] == p[vars.id.key] ? b[vars.edges.target] : b[vars.edges.source]

      return sort_function(a,b)

    })

    p.d3plus.edges.forEach(function(edge,i){

      var c = edge[vars.edges.source][vars.id.key] == p[vars.id.key] ? edge[vars.edges.target] : edge[vars.edges.source],
          s = radian/total

      var d = vars.data.app.filter(function(a){
        return a[vars.id.key] == c[vars.id.key]
      })[0]

      if (!d) {
        d = {"d3plus": {}}
        d[vars.id.key] = c[vars.id.key]
      }

      a = (angle-(s*children/2)+(s/2))+((s)*i)
      d.d3plus.radians = a
      d.d3plus.x = vars.app_width/2 + ((ring_width*2) * Math.cos(a))
      d.d3plus.y = vars.app_height/2 + ((ring_width*2) * Math.sin(a))
      d.d3plus.r = 4
      secondaries.push(d)
    })

  })

  primaries.forEach(function(p,i){

    vars.connections(p[vars.id.key]).forEach(function(edge){

      var c = edge[vars.edges.source][vars.id.key] == p[vars.id.key] ? edge[vars.edges.target] : edge[vars.edges.source]

      if (c[vars.id.key] != center[vars.id.key]) {

        var target = secondaries.filter(function(s){
          return s[vars.id.key] == c[vars.id.key]
        })[0]

        if (!target) {
          var r = ring_width
          target = primaries.filter(function(s){
            return s[vars.id.key] == c[vars.id.key]
          })[0]
        }
        else {
          var r = ring_width*2
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
                "r": ring_width+p.d3plus.r
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

    if (n[vars.id.key] != vars.focus.value) {

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

        n.d3plus.label = {
          "x": buffer,
          "y": 0,
          "w": width,
          "h": 30,
          "angle": angle,
          "anchor": anchor,
          "valign": "center",
          "color": d3plus.color.legible(d3plus.variable.color(vars,n[vars.id.key])),
          "resize": false,
          "background": background
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

  return {"edges": edges, "nodes": nodes}

};
