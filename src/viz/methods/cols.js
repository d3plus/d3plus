module.exports = {
  "accepted": [Array, Function, String],
  "index": {
    "accepted": [Boolean],
    "value": true
  },
  "process": function(value, vars) {
    if (typeof value === "string") value = [value]
    return value
  },
  "value": false
}
