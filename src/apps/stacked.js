d3plus.apps.stacked = {}
d3plus.apps.stacked.data = "grouped";
d3plus.apps.stacked.requirements = ["x","y"];
d3plus.apps.stacked.tooltip = "static";
d3plus.apps.stacked.shapes = ["area"];

d3plus.apps.stacked.setup = function(vars) {

  if (vars.dev.value) d3plus.console.time("setting local variables")
  vars.x.scale.value = "continuous"
  if (vars.dev.value) console.log("\"x\" scale set to \"continuous\"")
  vars.x.zerofill.value = true
  if (vars.dev.value) console.log("\"x\" zerofill set to \"true\"")
  vars.y.stacked.value = true
  vars.size.key = vars.y.key
  if (vars.dev.value) console.log("\"y\" stacked set to \"true\"")
  if (vars.dev.value) d3plus.console.timeEnd("setting local variables")
  
}

d3plus.apps.stacked.draw = function(vars) {
    
  if (typeof vars.size.threshold == "number" && vars.size.threshold > 0) {
    
    var allowed = [],
        cutoff = vars.depth.value == 0 ? 0 : {},
        removed = [],
        largest = {}
      
    d3.nest()
      .key(function(d){
        return d3plus.variable.value(vars,d,vars.x.key)
      })
      .rollup(function(leaves){
        var total = leaves.length
        if (vars.aggs[vars.y.key]) {
          if (typeof vars.aggs[vars.y.key] == "function") {
            total = vars.aggs[vars.y.key](leaves)
          }
          else if (typeof vars.aggs[vars.y.key] == "string") {
            total = d3[vars.aggs[vars.y.key]](leaves,function(l){
              return d3plus.variable.value(vars,l,vars.y.key)
            })
          }
        }
        else {
          total = d3.sum(leaves,function(l){
            return d3plus.variable.value(vars,l,vars.y.key)
          })
        }
        var x = d3plus.variable.value(vars,leaves[0],vars.x.key)
        largest[x] = total
        return total
      })
      .entries(vars.data.app)
      
    vars.data.app = vars.data.app.filter(function(d){
    
      var id = d3plus.variable.value(vars,d,vars.id.key),
          val = d3plus.variable.value(vars,d,vars.y.key),
          x = d3plus.variable.value(vars,d,vars.x.key)
    
      if (allowed.indexOf(id) < 0) {
        if (val/largest[x] >= vars.size.threshold) {
          allowed.push(id)
        }
      
      }
    
      if (allowed.indexOf(id) < 0) {
        if (vars.depth.value == 0) {
          if (val > cutoff) cutoff = val
        }
        else {
          var parent = d[vars.id.nesting[vars.depth.value-1]]
          if (!(parent in cutoff)) cutoff[parent] = 0
          if (val > cutoff[parent]) cutoff[parent] = val
        }
        removed.push(d)
        return false
      }
      else {
        return true
      }
    
    })
  
    var levels = vars.id.nesting.slice(0,vars.depth.value)
    var nesting = levels.concat([vars.x.key])
    var merged = d3plus.data.nest(vars,removed,nesting,true).filter(function(d){
      return d3plus.variable.value(vars,d,vars.y.key) > 0
    })
  
    merged.forEach(function(m){
      
      var parent = vars.id.nesting[vars.depth.value-1]
      
      m.d3plus = {}
      
      vars.id.nesting.forEach(function(d,i){
      
        if (vars.depth.value == i) {
          var prev = m[vars.id.nesting[i-1]]
          if (prev) {
            m[d] = "d3plus_other_"+prev
          }
          else {
            m[d] = "d3plus_other"
          }
        }
        else if (i > vars.depth.value) {
          delete m[d]
        }
      })
    
      if (vars.color.key) {
        if (vars.depth.value == 0) {
          m[vars.color.key] = vars.style.color.missing
        }
        else {
          m[vars.color.key] = d3plus.variable.color(vars,m[parent],parent)
        }
      }
    
      if (vars.icon.key && vars.depth.value != 0) {
        m[vars.icon.key] = d3plus.variable.value(vars,m[parent],vars.icon.key,parent)
        m.d3plus.depth = vars.id.nesting.indexOf(parent)
      }
      
      if (vars.text.key) {
        if (vars.depth.value == 0) {

          if (vars.title.value) {
            m[vars.text.key] = vars.title.value
          }
          else {
            m[vars.text.key] = vars.format("Values")
          }
          m[vars.text.key] += " < "+vars.format(cutoff)
        
        }
        else {
          var name = d3plus.variable.value(vars,m,vars.text.key,parent)
          m[vars.text.key] = name
          m[vars.text.key] += " < "+vars.format(cutoff[m[parent]],vars.y.key)
        }
        m[vars.text.key] += " ("+vars.format(vars.size.threshold*100)+"%)"
      }
    
    })
  
    vars.data.app = vars.data.app.concat(merged)
    
  }
  
  return d3plus.apps.chart.draw(vars)
  
}
