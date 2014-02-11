d3plus.apps.rings = {}
d3plus.apps.rings.data = "object";
d3plus.apps.rings.requirements = ["links","focus"];
d3plus.apps.rings.tooltip = "static"
d3plus.apps.rings.shapes = ["circle","square","donut"];
d3plus.apps.rings.scale = 1

d3plus.apps.rings.draw = function(vars) {
      
  var radius = d3.min([vars.app_height,vars.app_width])/2,
      ring_width = vars.small || !vars.labels.value ? radius/2.25 : radius/3,
      links = [],
      nodes = []
  
  if (vars.data.app) {
    
    var center = vars.data.app[vars.focus.value]
    if (!center) {
      center = {"d3plus": {}}
      center[vars.id.key] = vars.focus.value
    }
    center.d3plus.x = vars.app_width/2
    center.d3plus.y = vars.app_height/2
    center.d3plus.r = ring_width/2
    
    var primaries = [], claimed = []
    vars.connections[vars.focus.value].forEach(function(c){
      var n = vars.data.app[c[vars.id.key]]
      if (!n) {
        n = {"d3plus": {}}
        n[vars.id.key] = c[vars.id.key]
      }
      n.d3plus.children = vars.connections[n[vars.id.key]].filter(function(c){
        return c[vars.id.key] != vars.focus.value
      })
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
      
      var lengthdiff = a.d3plus.children.length - b.d3plus.children.length
      
      if (lengthdiff) {
        
        return lengthdiff
        
      }
      else {
        
        return sort_function(a,b)
      
      }
      
    })
    
    if (typeof vars.links.limit == "number") {
      primaries = primaries.slice(0,vars.links.limit)
    }
    else if (typeof vars.links.limit == "function") {
      primaries = vars.links.limit(primaries)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Check for similar children and give preference to nodes with less
    // overall children.
    //--------------------------------------------------------------------------
    var secondaries = [], total = 0
    primaries.forEach(function(p){
      p.d3plus.children = p.d3plus.children.filter(function(c){
        return claimed.indexOf(c[vars.id.key]) < 0
      })
      total += p.d3plus.children.length || 1
      p.d3plus.children.forEach(function(c){
        claimed.push(c[vars.id.key])
      })
    })
    
    primaries.sort(sort)
    
    var offset = 0, radian = Math.PI*2, start = 0
    primaries.forEach(function(p,i){
      
      var children = p.d3plus.children.length || 1,
          space = (radian/total)*children
          
      if (i == 0) {
        start = angle
        offset -= space/2
      }
      
      var angle = offset+(space/2)
          
      // Rotate everything by 90 degrees so that the first is at 12:00
      angle -= radian/4
      
      p.d3plus.radians = angle
      p.d3plus.x = vars.app_width/2 + (ring_width * Math.cos(angle))
      p.d3plus.y = vars.app_height/2 + (ring_width * Math.sin(angle))
      p.d3plus.r = 8
      
      var link = {"source": {}, "target": {}}
      link.source[vars.id.key] = center[vars.id.key]
      link.source.d3plus = {
        "x": vars.app_width/2,
        "y": vars.app_height/2
      }
      link.target[vars.id.key] = p[vars.id.key]
      link.target.d3plus = {
        "x": p.d3plus.x,
        "y": p.d3plus.y
      }
      links.push(link)
      
      offset += space
      p.d3plus.children.sort(sort)
      
      p.d3plus.children.forEach(function(c,i){
        var d = vars.data.app[c[vars.id.key]],
            s = radian/total
            
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

      vars.connections[p[vars.id.key]].forEach(function(c){
        
        if (c[vars.id.key] != center[vars.id.key]) {
          
          var target = secondaries.filter(function(s){
            return s[vars.id.key] == c[vars.id.key]
          })[0]
          if (!target) {
            r = ring_width
            target = primaries.filter(function(s){
              return s[vars.id.key] == c[vars.id.key]
            })[0]
          }
          if (target) {

            var link = {"source": {}, "target": {}}
            link.d3plus = {
              "spline": true,
              "translate": {
                "x": vars.app_width/2,
                "y": vars.app_height/2
              }
            }
            link.source[vars.id.key] = p[vars.id.key]
            link.source.d3plus = {
              "a": p.d3plus.radians,
              "r": ring_width
            }
            var r = ring_width*2
            
            link.target[vars.id.key] = c[vars.id.key]
            link.target.d3plus = {
              "a": target.d3plus.radians,
              "r": r
            }
          
            links.push(link)
            
          }
          
        }
        
      })
      
    })

    nodes = [center].concat(primaries).concat(secondaries)
    
    nodes.forEach(function(n) {
      
      if (n[vars.id.key] != vars.focus.value) {
        
        if (vars.labels.value) {
          var angle = n.d3plus.radians*(180/Math.PI),
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
          
          n.d3plus.label = {
            "x": buffer,
            "y": 0,
            "w": width,
            "h": 30,
            "angle": angle,
            "anchor": anchor,
            "valign": "center",
            "color": d3plus.color.legible(d3plus.variable.color(vars,n[vars.id.key])),
            "resize": false
          }
          
        }
        
      }
      else {
        n.d3plus.label = {
          "w": n.d3plus.r*1.75,
          "h": n.d3plus.r*1.75,
          "x": 0,
          "y": 0
        }
      }
      
    })
    
  }
  
  vars.mouse[d3plus.evt.click] = function(d) {
    d3plus.tooltip.remove(vars.type.value)
    vars.viz.focus(d[vars.id.key])
    if (!vars.autodraw) {
      vars.viz.draw()
    }
  }
  
  return {"links": links, "nodes": nodes}
  
};
