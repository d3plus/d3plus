module.exports =
  accepted:   [false, Array, Number, String]
  html:
    accepted: [Boolean]
    value:    false
  init: (vars) ->
    s = @split.value
    @break = new RegExp "[^\\s\\" + s.join("\\") + "]+\\" + s.join("?\\") + "?", "g"
    false
  split:
    accepted: [Array]
    process: (s) ->
      @break = new RegExp "[^\\s\\" + s.join("\\") + "]+\\" + s.join("?\\") + "?", "g"
      s
    value:    ["-", "/", ";", ":", "&", "."]
