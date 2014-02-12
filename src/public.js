d3plus.public = {}

d3plus.public.active = {
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  },
  "spotlight": {
    "accepted": [true,false],
    "value": false,
    "deprecates": ["spotlight"]
  }
}

d3plus.public.aggs = {
  "value": {},
  "deprecated": ["nesting_aggs"]
}

d3plus.public.axes = {
  "mirror": {
    "accepted": [true,false],
    "value": false,
    "deprecates": ["mirror_axis","mirror_axes"]
  },
  "values": ["x","y"]
}

d3plus.public.attrs = {
  "value": {}
}

d3plus.public.color = {
  "deprecates": ["color_var"],
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.container = {
  "value": null
}

d3plus.public.coords = {
  "fit": {
    "accepted": ["auto","height","width"],
    "value": "auto"
  },
  "mute": {
    "value": []
  },
  "padding": 20,
  "projection": {
    "accepted": ["mercator","equirectangular"],
    "value": "mercator"
  },
  "solo": {
    "value": []
  },
  "value": null
}

d3plus.public.data = {
  "value": []
}

d3plus.public.depth = {
  "value": 0
}

d3plus.public.descs = {
  "value": {}
}

d3plus.public.dev = {
  "accepted": [true,false],
  "value": false
}

d3plus.public.error = {
  "value": false
}

d3plus.public.focus = {
  "value": null,
  "deprecates": ["highlight"]
}

d3plus.public.footer = {
  "value": false
}

d3plus.public.height = {
  "value": null
}

d3plus.public.html = {
  "deprecates": ["click_function"],
  "value": null
}

d3plus.public.icon = {
  "deprecates": ["icon_var"],
  "key": "icon"
}

d3plus.public.id = {
  "data_filter": true,
  "deprecates": ["id_var","nesting"],
  "key": "id",
  "mute": {
    "value": [],
    "deprecates": ["filter"]
  },
  "nesting": ["id"],
  "solo": {
    "value": [],
    "deprecates": ["solo"]
  }
}

d3plus.public.labels = {
  "accepted": [true,false],
  "value": true
}

d3plus.public.legend = {
  "accepted": [true,false],
  "value": true,
  "label": null
}

d3plus.public.links = {
  "deprecates": ["edges"],
  "limit": false,
  "value": null
}

d3plus.public.nodes = {
  "value": null
}

d3plus.public.number_format = {
  "value": function(number,key,vars) {
  
    if (vars && key == vars.time.key) {
      return number
    }
    else if (number < 10 && number > -10) {
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
}

d3plus.public.order = {
  "key": null,
  "sort": {
    "accepted": ["asc","desc"],
    "value": "asc",
    "deprecates": ["sort"]
  }
}

d3plus.public.shape = {
  "accepted": ["circle","donut","line","square","area","coordinates"],
  "value": null,
  "interpolate": {
    "accepted": ["linear","step","step-before","step-after","basis","basis-open","cardinal","cardinal-open","monotone"],
    "value": "linear",
    "deprecates": ["stack_type"]
  }
}

d3plus.public.size = {
  "data_filter": true,
  "deprecates": ["value"],
  "key": null,
  "mute": {
    "value": []
  },
  "scale": {
    "accepted": ["sqrt","linear","log"],
    "deprecates": ["size_scale"],
    "value": "sqrt"
  },
  "solo": {
    "value": []
  },
  "threshold": 0.03
}

d3plus.public.temp = {
  "deprecates": ["else_var","else"],
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.text = {
  "deprecates": ["name_array","text_var"],
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.text_format = {
  "value": function(text,key,vars) {
    if (!text) return ""
    return text.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }
}

d3plus.public.time = {
  "data_filter": true,
  "deprecates": ["year","year_var"],
  "fixed": {
    "accepted": [true,false],
    "value": true,
    "deprecates": ["static_axis","static_axes"]
  },
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.timeline = {
  "accepted": [true,false],
  "value": true,
  "label": null
}

d3plus.public.title = {
  "value": null,
  "sub": {
    "value": null,
    "deprecates": ["sub_title"]
  },
  "total": {
    "value": false,
    "deprecates": ["total_bar"],
    "object": true
  }
}

d3plus.public.tooltip = {
  "deprecates": ["tooltip_info"],
  "value": [],
  "object": true
}

d3plus.public.total = {
  "deprecates": ["total_var"],
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.type = {
  "value": "tree_map"
}

d3plus.public.width = {
  "value": null
}

d3plus.public.x = {
  "data_filter": true,
  "deprecates": ["xaxis","xaxis_val","xaxis_var"],
  "domain": null,
  "key": null,
  "lines": [],
  "mute": {
    "value": []
  },
  "reset": ["x_range"],
  "scale": {
    "accepted": ["linear","log","continuous","share"],
    "value": "linear",
    "deprecates": ["layout","unique_axis","xaxis_scale"]
  },
  "stacked": {
    "accepted": [true,false],
    "value": false
  },
  "solo": {
    "value": []
  },
  "zerofill": {
    "accepted": [true,false],
    "value": false
  }
}

d3plus.public.y = {
  "data_filter": true,
  "deprecates": ["yaxis","yaxis_val","yaxis_var"],
  "domain": null,
  "key": null,
  "lines": [],
  "mute": {
    "value": []
  },
  "reset": ["y_range"],
  "scale": {
    "accepted": ["linear","log","continuous","share"],
    "value": "linear",
    "deprecates": ["layout","unique_axis","yaxis_scale"]
  },
  "stacked": {
    "accepted": [true,false],
    "value": false
  },
  "solo": {
    "value": []
  },
  "zerofill": {
    "accepted": [true,false],
    "value": false
  }
}

d3plus.public.zoom = {
  "scroll": {
    "accepted": [true,false],
    "value": false,
    "deprecates": ["scroll_zoom"]
  }
}
