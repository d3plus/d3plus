//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merges data underneath the size threshold
//-------------------------------------------------------------------
d3plus.data.threshold = function( vars , rawData , split ) {

  if ( vars.size.threshold === false ) {
    var threshold = 0
  }
  else if (typeof vars.size.threshold === "number") {
    var threshold = vars.size.threshold
  }
  else if (typeof vars.types[vars.type.value].threshold === "number") {
    var threshold = vars.types[vars.type.value].threshold
  }
  else if (typeof vars.types[vars.type.value].threshold === "function") {
    var threshold = vars.types[vars.type.value].threshold(vars)
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
      .entries(rawData)

    var filteredData = rawData.filter(function(d){

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

    if ( removed.length > 1 ) {

      removed = d3plus.array.sort( removed , vars.size.value , "desc" , [] , vars )

      var levels = vars.id.nesting.slice(0,vars.depth.value)
      var merged = d3plus.data.nest(vars,removed,levels).filter(function(d){
        return d3plus.variable.value( vars , d , vars.size.value ) > 0
      })

      merged.forEach(function(m){

        var parent = vars.id.nesting[vars.depth.value-1]

        vars.id.nesting.forEach(function(d,i){

          if (vars.depth.value == i) {
            var prev = m[vars.id.nesting[i-1]]
            if ( typeof prev === "string" ) {
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

        if (vars.color.value && vars.color.type === "string") {
          if (vars.depth.value == 0) {
            m[vars.color.value] = vars.color.missing
          }
          else {
            m[vars.color.value] = d3plus.variable.color(vars,m[parent],parent)
          }
        }

        if (vars.icon.value) {
          m[vars.icon.value] = d3plus.variable.value(vars,m[parent],vars.icon.value,parent)
        }

        if (m[parent]) {
          m.d3plus.depth = vars.depth.value
        }

        if (vars.depth.value == 0) {
          var textLabel = vars.format.value(vars.format.locale.value.ui.values)
          textLabel += " < "+vars.format.value(cutoff)
        }
        else {
          var textLabel = d3plus.variable.text(vars,m,vars.depth.value-1)[0]
          textLabel = textLabel.split(" < ")[0]
          textLabel += " < "+vars.format.value(cutoff[m[parent]],vars.size.value)
        }
        textLabel += " ("+vars.format.value(threshold*100)+"%)"

        m.d3plus.threshold = cutoff
        if (parent) {
          m.d3plus.merged = []
          removed.forEach(function(r){
            if (m[parent] == r[parent]) {
              m.d3plus.merged.push(r)
            }
          })
        }
        else {
          m.d3plus.merged = removed
        }

        if (vars.text.value) {
          m[vars.text.value] = textLabel
        }
        else {
          m.d3plus.text = textLabel
        }

      })

    }
    else {
      merged = removed
    }

    return filteredData.concat(merged)

  }

  return rawData

}
