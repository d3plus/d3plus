fetchValue  = require "../../core/fetch/value.coffee"
ie          = require "../../client/ie.js"
stringStrip = require "../../string/strip.js"

module.exports =
  accepted:  [undefined, true, Array, String]
  chainable: false
  data:      []
  process:   (value, vars) ->

    return [] if vars.returned is undefined

    value = value or vars.cols.value

    if value instanceof Array
      columns = value
    else if typeof value is "string"
      columns = [value]

    csv_to_return = []
    titles        = []

    if vars.title.value
      title = vars.title.value
      title = title(vars.self) if typeof title is "function"
      title = stringStrip title
      max_filename_len = 250
      title = title.substr(0, max_filename_len)
    else
      title = "D3plus Visualization Data"

    if value is true
      columns = d3.keys vars.data.keys
      csv_to_return.push columns
      for d in vars.data.value
        row = []
        for c in columns
          val = d[c]
          val = '"'+val+'"' if vars.data.keys[c] is "string"
          row.push val
        csv_to_return.push row
    else
      unless columns
        columns = [vars.id.value]
        columns.push vars.time.value if vars.time.value
        columns.push vars.size.value if vars.size.value
        columns.push vars.text.value if vars.text.value

      for c in columns
        titles.push vars.format.value(c)

      csv_to_return.push titles
      for node in vars.returned.nodes
        if node.values? and node.values instanceof Array
          for val in node.values
            row = []
            for col in columns
              val = fetchValue(vars, val, col)
              val = '"'+val+'"' if typeof val is "string"
              row.push val
            csv_to_return.push row
        else
          row = []
          for col in columns
            row.push fetchValue(vars, node, col)
          csv_to_return.push row

    csv_data = "data:text/csv;charset=utf-8,"
    for c, i in csv_to_return
      dataString = c.join(",")
      csv_data += (if i < csv_to_return.length then dataString + "\n" else dataString)

    if ie
      blob = new Blob [csv_data], {type: "text/csv;charset=utf-8;"}
      navigator.msSaveBlob blob, title + ".csv"
    else
      encodedUri = encodeURI(csv_data)
      link       = document.createElement("a")
      link.setAttribute "href", encodedUri
      link.setAttribute "download", title + ".csv"
      link.click()

    @data = csv_to_return
    columns

  value: undefined
