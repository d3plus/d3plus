d3plus.public = {}

d3plus.public.active = {
  "key": null,
  "mute": [],
  "solo": [],
  "spotlight": {
    "accepted": [true,false],
    "default": false,
    "deprecates": ["spotlight"]
  }
}

d3plus.public.aggs = {
  "default": {},
  "deprecated": ["nesting_aggs"]
}

d3plus.public.axes = {
  "mirror": {
    "accepted": [true,false],
    "default": false,
    "deprecates": ["mirror_axis","mirror_axes"]
  },
  "static": {
    "accepted": [true,false],
    "default": true,
    "deprecates": ["static_axis","static_axes"]
  },
  "values": ["x","y"]
}

d3plus.public.attrs = {
  "default": {}
}

d3plus.public.color = {
  "deprecates": ["color_var"],
  "key": null,
  "mute": [],
  "solo": []
}

d3plus.public.container = {
  "default": null
}

d3plus.public.coords = {
  "default": null
}

d3plus.public.data = {
  "default": []
}

d3plus.public.depth = {
  "default": 0
}

d3plus.public.descs = {
  "default": {}
}

d3plus.public.dev = {
  "accepted": [true,false],
  "default": false
}

d3plus.public.error = {
  "default": false
}

d3plus.public.focus = {
  "default": null,
  "deprecates": ["highlight"]
}

d3plus.public.footer = {
  "default": false
}

d3plus.public.height = {
  "default": null
}

d3plus.public.icon = {
  "deprecates": ["icon_var"],
  "key": "icon"
}

d3plus.public.id = {
  "data_refresh": true,
  "deprecates": ["id_var","nesting"],
  "key": "id",
  "mute": {
    "default": [],
    "deprecates": ["filter"]
  },
  "nesting": ["id"],
  "solo": {
    "default": [],
    "deprecates": ["solo"]
  }
}

d3plus.public.labels = {
  "accepted": [true,false],
  "default": true
}

d3plus.public.links = {
  "deprecates": ["edges"],
  "default": null
}

d3plus.public.nodes = {
  "default": null
}

d3plus.public.number_format = function(number,key,vars) {
  
  if (key == vars.time.key) {
    return number
  }
  else if (number < 10) {
    return d3.round(number,2)
  }
  else if (number.toString().split(".")[0].length > 4) {
    var symbol = d3.formatPrefix(number).symbol
    symbol = symbol.replace("G", "B") // d3 uses G for giga
    
    // Format number to precision level using proper scale
    number = d3.formatPrefix(number).scale(number)
    number = parseFloat(d3.format(".3g")(number))
    return number + symbol;
  }
  else if (key == "share") {
    return d3.format(".2f")(number)
  }
  else {
    return d3.format(",f")(number)
  }
  
}

d3plus.public.order = {
  "key": null,
  "sort": {
    "accepted": ["asc","desc"],
    "default": "asc",
    "deprecates": ["sort"]
  }
}

d3plus.public.shape = {
  "accepted": ["circle","donut","line","square","area","coordinates"],
  "default": null,
  "interpolate": {
    "accepted": ["linear","step","step-before","step-after","basis","basis-open","cardinal","cardinal-open","monotone"],
    "default": "linear",
    "deprecates": ["stack_type"]
  }
}

d3plus.public.size = {
  "data_refresh": true,
  "deprecates": ["value"],
  "key": null,
  "mute": [],
  "scale": {
    "accepted": ["sqrt","linear","log"],
    "deprecates": ["size_scale"],
    "default": "sqrt"
  },
  "solo": []
}

d3plus.public.temp = {
  "deprecates": ["else_var","else"],
  "key": null,
  "mute": [],
  "solo": []
}

d3plus.public.text = {
  "deprecates": ["name_array","text_var"],
  "key": null,
  "mute": [],
  "solo": []
}

d3plus.public.text_format = function(text,key,vars) {
  if (!text) return ""
  return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()
  
}

d3plus.public.time = {
  "data_refresh": true,
  "deprecates": ["year","year_var"],
  "key": null,
  "mute": [],
  "solo": []
}

d3plus.public.title = {
  "default": null,
  "sub": {
    "default": null,
    "deprecates": ["sub_title"]
  },
  "total": {
    "default": false,
    "deprecates": ["total_bar"],
    "object": true
  }
}

d3plus.public.tooltip = {
  "deprecates": ["tooltip_info"],
  "default": [],
  "html": null
}

d3plus.public.total = {
  "deprecates": ["total_var"],
  "key": null,
  "mute": [],
  "solo": []
}

d3plus.public.type = {
  "default": "tree_map"
}

d3plus.public.width = {
  "default": null
}

d3plus.public.x = {
  "data_refresh": true,
  "deprecates": ["xaxis","xaxis_val","xaxis_var"],
  "domain": null,
  "key": null,
  "lines": [],
  "mute": [],
  "reset": ["x_range"],
  "scale": {
    "accepted": ["linear","log","continuous","share"],
    "default": "linear",
    "deprecates": ["layout","unique_axis","xaxis_scale"]
  },
  "stacked": {
    "accepted": [true,false],
    "default": false
  },
  "solo": [],
  "zerofill": {
    "accepted": [true,false],
    "default": false
  }
}

d3plus.public.y = {
  "data_refresh": true,
  "deprecates": ["yaxis","yaxis_val","yaxis_var"],
  "domain": null,
  "key": null,
  "lines": [],
  "mute": [],
  "reset": ["y_range"],
  "scale": {
    "accepted": ["linear","log","continuous","share"],
    "default": "linear",
    "deprecates": ["layout","unique_axis","yaxis_scale"]
  },
  "stacked": {
    "accepted": [true,false],
    "default": false
  },
  "solo": [],
  "zerofill": {
    "accepted": [true,false],
    "default": false
  }
}

d3plus.public.zoom = {
  "scroll": {
    "accepted": [true,false],
    "default": false,
    "deprecates": ["scroll_zoom"]
  }
}
