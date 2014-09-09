# Creates a Base-64 Data URL from and Image URL
module.exports = (url, callback) ->

  img = new Image()
  img.src = url
  img.crossOrigin = "Anonymous"
  img.onload = ->
    canvas = document.createElement("canvas")
    canvas.width = @width
    canvas.height = @height
    context = canvas.getContext("2d")
    context.drawImage this, 0, 0
    callback.call this, canvas.toDataURL("image/png")
    canvas = null
    return

  return
