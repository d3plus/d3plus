//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merges data underneath the size threshold
//-------------------------------------------------------------------
d3plus.data.threshold = function(vars,split) {

  if (!vars.size.threshold) {
    var threshold = 0
  }
  else if (typeof vars.size.threshold === "number") {
    var threshold = vars.size.threshold
  }
  else if (typeof d3plus.visualization[vars.type.value].threshold === "number") {
    var threshold = d3plus.visualization[vars.type.value].threshold
  }
  else {
    var threshold = 0.02
  }

  if (typeof threshold == "number" && threshold > 0) {

    var allowed = [],
        cutoff = vars.depth.value == 0 ? 0 : {},
        removed = [],
        largest = {}

    var nest = d3.nest()

    if (split) {
      nest
        .key(function(d){
          return d3plus.variable.value(vars,d,split)
        })
    }

    nest
      .rollup(function(leaves){
        var total = leaves.length
        if (vars.aggs[vars.size.value]) {
          if (typeof vars.aggs[vars.size.value] == "function") {
            total = vars.aggs[vars.size.value](leaves)
          }
          else if (typeof vars.aggs[vars.size.value] == "string") {
            total = d3[vars.aggs[vars.size.value]](leaves,function(l){
              return d3plus.variable.value(vars,l,vars.size.value)
            })
          }
        }
        else {
          total = d3.sum(leaves,function(l){
            return d3plus.variable.value(vars,l,vars.size.value)
          })
        }
        var x = split ? d3plus.variable.value(vars,leaves[0],split) : "all"
        largest[x] = total
        return total
      })
      .entries(vars.data.app)

    vars.data.app = vars.data.app.filter(function(d){

      var id = d3plus.variable.value(vars,d,vars.id.value),
          val = d3plus.variable.value(vars,d,vars.size.value),
          x = split ? d3plus.variable.value(vars,d,split) : "all"

      if (allowed.indexOf(id) < 0) {
        if (val/largest[x] >= threshold) {
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
    var nesting = levels.concat([vars.x.value])
    var merged = d3plus.data.nest(vars,removed,nesting,true).filter(function(d){
      return d3plus.variable.value(vars,d,vars.size.value) > 0
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

      if (vars.color.value && vars.color.type == "string") {
        if (vars.depth.value == 0) {
          m[vars.color.value] = vars.color.missing
        }
        else {
          m[vars.color.value] = d3plus.variable.color(vars,m[parent],parent)
        }
      }

      if (vars.icon.value && vars.depth.value != 0) {
        m[vars.icon.value] = d3plus.variable.value(vars,m[parent],vars.icon.value,parent)
        m.d3plus.depth = vars.id.nesting.indexOf(parent)
      }

      if (vars.text.value) {
        if (vars.depth.value == 0) {
          m[vars.text.value] = vars.format.value("Values")
          m[vars.text.value] += " < "+vars.format.value(cutoff)
        }
        else {
          var name = d3plus.variable.value(vars,m,vars.text.value,parent)
          m[vars.text.value] = name
          m[vars.text.value] += " < "+vars.format.value(cutoff[m[parent]],vars.size.value)
        }
        m[vars.text.value] += " ("+vars.format.value(threshold*100)+"%)"

        m.d3plus.threshold = cutoff
        if (parent) {
          m.d3plus.merged = []
          removed.forEach(function(r){
            if (m[parent] == r[parent]) {
              m.d3plus.merged.push(r[vars.id.value])
            }
          })
        }
        else {
          m.d3plus.merged = d3plus.util.uniques(removed,vars.id.value)
        }

      }

    })

    vars.data.app = vars.data.app.concat(merged)

  }

}
