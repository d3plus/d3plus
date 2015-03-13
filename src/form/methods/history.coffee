module.exports =
  back:   -> @states.pop()() if @states.length
  chain:  []
  reset:  -> @states.pop()() while @states.length
  states: []
