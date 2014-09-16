module.exports =
  accepted:   [false, Array, Function, Number, String]
  html:
    accepted: [Boolean]
    value:    false
  init: (vars) ->
    s = @split
    @break = new RegExp "[^\\s\\" + s.join("\\") + "]+\\" + s.join("?\\") + "?", "g"
    false
  split: ["-", "/", ";", ":", "&"]
