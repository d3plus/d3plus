d3plus.form.data = function(vars) {

  if (vars.data.data) {

    if (!vars.data.array || (("replace" in vars.data && vars.data.replace === true) || !("replace" in vars.data))) {
      vars.data.array = []
    }

    var defaults = ["value","alt","keywords","image","style","color","selected","text"],
        vals = vars.data.map || {}

    defaults.forEach(function(d){
      if (!(d in vals)) {
        vals[d] = d
      }
    })

    vars.data.data.forEach(function(d){
      var obj = {}
      for (key in vals) {
        if (vals[key] in d) {
          obj[key] = d[vals[key]]
        }
      }
      vars.data.array.push(obj)
    })

    var sort = "sort" in vars.data ? vars.data.sort : "text"
    if (sort) {

      vars.data.array.sort(function(a,b){

        a = a[sort]
        b = b[sort]

        if (sort == "color") {

          a = d3.rgb(a_value).hsl()
          b = d3.rgb(b_value).hsl()

          if (a.s == 0) a = 361
          else a = a.h
          if (b.s == 0) b = 361
          else b = b.h

        }

        if(a < b) return -1;
        if(a > b) return 1;

      })

    }

  }

  vars.data.changed = true
  vars.loading = false

}
