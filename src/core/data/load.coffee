print       = require "../console/print.coffee"
validObject = require "../../object/validate.coffee"

# Load Data using JSON
module.exports = (vars, key, next) ->

  consoleMessage = vars.dev.value
  print.time "loading " + key if consoleMessage

  url = vars[key].url

  unless vars[key].filetype.value

    fileType = url.slice(url.length - 5).split(".")

    if fileType.length > 1
      fileType = fileType[1]
    else
      fileType = false

    if fileType
      fileType = "text" if fileType is "txt"
      fileType = "json" if vars[key].filetype.accepted.indexOf(fileType) < 0
    else
      fileType = "json"

  else
    fileType = vars[key].filetype.value

  if fileType is "dsv"
    parser = d3.dsv(vars[key].delimiter.value, "text/plain")
  else
    parser = d3[fileType]

  parser url, (error, data) ->

    if not error and data

      if typeof vars[key].callback is "function"
        ret = vars[key].callback(data)
        if ret
          if validObject(ret) and key of ret
            for k of ret
              vars[k].value = ret[k] if k of vars
          else
            vars[key].value = ret
      else
        vars[key].value = data

      if [ "json" ].indexOf(fileType) < 0
        vars[key].value.forEach (d) ->
          for k of d
            unless isNaN(d[k])
              d[k] = parseFloat(d[k])
            else if d[k].toLowerCase() is "false"
              d[k] = false
            else if d[k].toLowerCase() is "true"
              d[k] = true
            else if d[k].toLowerCase() is "null"
              d[k] = null
            else d[k] = undefined if d[k].toLowerCase() is "undefined"

      vars[key].changed = true
      vars[key].loaded = true

    else
      vars.error.internal = "Could not load data from: \"" + url + "\""

    print.timeEnd "loading " + key if consoleMessage
    next()
