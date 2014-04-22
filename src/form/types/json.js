d3plus.form.json = function(vars) {
  
  if (vars.dev) d3plus.console.time("loading data from \""+vars.data.fetch+"\"")
  vars.loading = true
  
  d3.json(vars.data.fetch,function(d){
    
    if (d && d3.keys(d).length == 1) {
      vars.data.data = d[d3.keys(d)[0]]
    }
    else if (d && vars.data.key && d[key]) {
      vars.data.data = d[key]
    }
    else {
      vars.data.data = []
    }
    
    if (typeof vars.data.callback == "function") {
      vars.data.data = vars.data.callback(vars.data.data)
    }
    
    vars.data.loaded = true
    vars.data.changed = true
    if (vars.dev) d3plus.console.timeEnd("loading data from \""+vars.data.fetch+"\"")
    
    d3plus.form.data(vars)
    
    setTimeout(function(){
      vars.self.draw()
    },vars.timing.transitions*1.5)
    
  })
  
}
