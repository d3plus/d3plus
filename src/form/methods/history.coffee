module.exports =
  back:     ->
    @states.pop()() if @states.length
    return
  chain:    []
  states:   []
