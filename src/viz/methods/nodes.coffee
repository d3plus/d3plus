process = require "../../core/methods/process/data.coffee"

module.exports =
  accepted: [false, Array, Function, String]
  delimiter:
    accepted: [String]
    value:    "|"
  filetype:
    accepted: [false, "json", "xml", "html", "csv", "dsv", "tsv", "txt"]
    value:    false
  overlap: 0.6
  process: process
  value:   false
