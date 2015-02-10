# Creates Dropdown Menu
module.exports = (vars) ->

  element     = require "./functions/element.coffee"
  keyboard    = require "./functions/keyboard.coffee"
  windowevent = require "./functions/window.js"
  width       = require "./functions/width.js"
  button      = require "./functions/button.js"
  selector    = require "./functions/selector.js"
  title       = require "./functions/title.js"
  search      = require "./functions/search.js"
  list        = require "./functions/list.js"
  data        = require "./functions/data.js"
  update      = require "./functions/update.js"

  vars.margin.top   = 0
  vars.margin.title = 0

  # Hijack events of original element, if applicable.
  element vars

  # Capture keyboard events
  keyboard vars

  # Apply click function to all parent windows to close dropdown.
  windowevent vars

  # Check to make sure we have both a button and list width.
  width vars

  # Create main button, if it does not already exist.
  button vars

  # Create "selector" to hold the search box and search vars.container.list.
  selector vars

  # Create and style the title box, if applicable.
  title vars

  # Create and style the search box, if applicable.
  search vars

  # Create and style the item list.
  list vars

  # Filter data based off search term, if applicable.
  data vars

  # Updates all divs
  update vars
