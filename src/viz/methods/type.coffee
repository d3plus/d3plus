module.exports =
  accepted: (vars) -> d3.keys vars.types
  mode:
    accepted: (vars) -> vars.types[vars.type.value].modes or [false]
    value:    false
  value:    "tree_map"
