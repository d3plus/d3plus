fetchValue  = require "../../core/fetch/value.js"
ie          = require "../../client/ie.js"
stringStrip = require "../../string/strip.js"

module.exports =
  accepted:  [undefined, Array, String]
  chainable: false
  data:      []
  process:   (value, vars) ->

    return [] if vars.returned is undefined

    if value instanceof Array
      columns = value
    else columns = [value] if typeof value is "string"

    csv_to_return = []
    titles        = []
    title         = stringStrip vars.title.value or "My D3plus App Data"

    unless columns
      columns = [vars.id.value]
      columns.push vars.time.value if vars.time.value
      columns.push vars.size.value if vars.size.value
      columns.push vars.text.value if vars.text.value

    for c in columns
      titles.push vars.format.value(c)

    csv_to_return.push titles
    for n in vars.returned.nodes.forEach
      arr = []
      for c in columns
        arr.push fetchValue(vars, n, c)
      csv_to_return.push arr

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
