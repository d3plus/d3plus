process = require "../../core/methods/process/data.coffee"

module.exports =
  accepted:  [false, Array, Object, String]
  delimiter:
    accepted: String
    value:    "|"
  filetype:
    accepted: [false, "json", "xml", "html", "csv", "dsv", "tsv", "txt"]
    value:    false
  keys: {}
  process: process
  value:   false
