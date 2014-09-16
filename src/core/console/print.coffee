wiki = require "./wiki.coffee"
# Custom styling and behavior for browser console statements.
print = (type, message, style) ->
  style = style or ""
  if d3plus.ie or typeof InstallTrigger isnt 'undefined'
    console.log "[ D3plus ] " + message
  else if type is "groupCollapsed"
    if window.chrome and navigator.onLine
      console[type] "%c%c " + message, "padding:3px 10px;line-height:25px;background-size:20px;background-position:top left;background-image:url('http://d3plus.org/assets/img/favicon.ico');", "font-weight:200;" + style
    else
      console[type] "%cD3plus%c " + message, "line-height:25px;font-weight:800;color:#b35c1e;margin-left:0px;", "font-weight:200;" + style
  else
    console[type] "%c" + message, style + "font-weight:200;"
  return

print.comment = (message) ->
  this "log", message, "color:#aaa;"
  return

print.error = (message, url) ->
  this "groupCollapsed", "ERROR: " + message, "font-weight:800;color:#D74B03;"
  @stack()
  @wiki url
  @groupEnd()
  return

print.group = (message) ->
  this "group", message, "color:#888;"
  return

print.groupCollapsed = (message) ->
  this "groupCollapsed", message, "color:#888;"
  return

print.groupEnd = ->
  console.groupEnd()  unless d3plus.ie
  return

print.log = (message) ->
  this "log", message, "color:#444444;"
  return

print.stack = ->
  unless d3plus.ie
    err = new Error()
    if err.stack
      stack = err.stack.split("\n")
      stack = stack.filter((e) ->
        e.indexOf("Error") isnt 0 and e.indexOf("d3plus.js:") < 0 and e.indexOf("d3plus.min.js:") < 0
      )
      if stack.length and stack[0].length
        splitter = (if window.chrome then "at " else "@")
        url = stack[0].split(splitter)[1]
        stack = url.split(":")
        stack.pop()  if stack.length is 3
        line = stack.pop()
        page = stack.join(":").split("/")
        page = page[page.length - 1]
        message = "line " + line + " of " + page + ": " + url
        this "log", message, "color:#D74B03;"
  return

print.time = (message) ->
  console.time message unless d3plus.ie
  return

print.timeEnd = (message) ->
  console.timeEnd message unless d3plus.ie
  return

print.warning = (message, url) ->
  this "groupCollapsed", message, "color:#888;"
  @stack()
  @wiki url
  @groupEnd()
  return

print.wiki = (url) ->
  if url
    if url of wiki
      url = d3plus.repo + "wiki/" + wiki[url]
    this "log", "documentation: " + url, "color:#aaa;"
  return

module.exports = print
