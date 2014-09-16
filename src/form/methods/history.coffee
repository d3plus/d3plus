module.exports =
  accepted: [Boolean]
  back:     ->
    @states.pop()() if @states.length
    return
  chain:    []
  states:   []
  value:    true
