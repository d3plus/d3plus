# Destroy Tooltips
module.exports = (id) ->

  # If an ID is specified, only remove that tooltip
  if id

    # First remove the background curtain, if the tooltip has one
    d3.selectAll("div#d3plus_tooltip_curtain_" + id).remove()

    # Finally, remove the tooltip itself
    d3.selectAll("div#d3plus_tooltip_id_" + id).remove()

  # If no ID is given, remove ALL d3plus tooltips
  else

    # First remove all background curtains on the page
    d3.selectAll("div.d3plus_tooltip_curtain").remove()

    # Finally, remove all tooltip
    d3.selectAll("div.d3plus_tooltip").remove()
