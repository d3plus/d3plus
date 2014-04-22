d3plus.method.csv = {
  "accepted": [ undefined , Array , String ],
  "chainable": false,
  "process": function ( value ) {

    var vars = this.getVars()

    if ( vars.returned === undefined ) {
      return []
    }

    if ( value instanceof Array ) {
      var columns = value
    }
    else if ( typeof value === "string" ) {
      var columns = [value]
    }

    var csv_to_return = [],
        titles = [],
        title = vars.title.value || "My D3plus App Data"

    title = d3plus.util.strip(title)

    if (!columns) {
      var columns = [vars.id.value]
      if (vars.time.value) columns.push(vars.time.value)
      if (vars.size.value) columns.push(vars.size.value)
      if (vars.text.value) columns.push(vars.text.value)
    }

    columns.forEach(function(c){
      titles.push(vars.format.value(c))
    })

    csv_to_return.push(titles);

    vars.returned.nodes.forEach(function(n){
      var arr = []
      columns.forEach(function(c){
        arr.push(d3plus.variable.value(vars,n,c))
      })
      csv_to_return.push(arr)
    })

    var csv_data = "data:text/csv;charset=utf-8,"
    csv_to_return.forEach(function(c,i){
      dataString = c.join(",")
      csv_data += i < csv_to_return.length ? dataString + "\n" : dataString
    })

    if (d3plus.ie) {

      var blob = new Blob([csv_data],{
        type: "text/csv;charset=utf-8;",
      })
      navigator.msSaveBlob(blob,title+".csv")

    }
    else {

      var encodedUri = encodeURI(csv_data)
      var link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download",title+".csv")
      link.click()

    }

    return csv_to_return

  },
  "value": []
}
