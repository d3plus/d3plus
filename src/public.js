d3plus.public = {}

d3plus.public.active = {
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  },
  "spotlight": {
    "accepted": [Boolean],
    "value": false,
    "deprecates": ["spotlight"]
  },
  "value": null
}

d3plus.public.aggs = {
  "deprecated": ["nesting_aggs"],
  "value": {}
}

d3plus.public.axes = {
  "mirror": {
    "accepted": [Boolean],
    "deprecates": ["mirror_axis","mirror_axes"],
    "value": false
  },
  "values": ["x","y"]
}

d3plus.public.attrs = {
  "value": {}
}

d3plus.public.color = {
  "deprecates": ["color_var"],
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  },
  "value": null
}

d3plus.public.container = {
  "value": null
}

d3plus.public.coords = {
  "center": [0,0],
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
  "threshold": 0.1,
  "value": null
}

d3plus.public.data = {
  "large": 400,
  "value": []
}

d3plus.public.depth = {
  "value": 0
}

d3plus.public.descs = {
  "value": {}
}

d3plus.public.dev = {
  "accepted": [Boolean],
  "value": false
}

d3plus.public.edges = {
  "arrows": {
    "accepted": [Boolean],
    "direction": {
      "accepted": ["source","target"],
      "value": "target"
    },
    "value": false
  },
  "deprecates": ["edges"],
  "label": false,
  "large": 100,
  "limit": false,
  "size": false,
  "source": "source",
  "target": "target",
  "value": null
}

d3plus.public.error = {
  "value": false
}

d3plus.public.focus = {
  "deprecates": ["highlight"],
  "tooltip": {
    "accepted": [Boolean],
    "value": true
  },
  "value": null
}

d3plus.public.footer = {
  "link": null,
  "value": false
}

d3plus.public.height = {
  "small": 300,
  "value": null
}

d3plus.public.history = {
  "accepted": [Boolean],
  "states": [],
  "value": true
}

d3plus.public.html = {
  "deprecates": ["click_function"],
  "value": null
}

d3plus.public.icon = {
  "deprecates": ["icon_var"],
  "style": {
    "deprecates": ["icon_style"],
    "object": true,
    "value": "default"
  },
  "value": "icon"
}

d3plus.public.id = {
  "data_filter": true,
  "deprecates": ["id_var","nesting"],
  "mute": {
    "value": [],
    "deprecates": ["filter"]
  },
  "nesting": ["id"],
  "solo": {
    "value": [],
    "deprecates": ["solo"]
  },
  "value": "id"
}

d3plus.public.labels = {
  "accepted": [Boolean],
  "resize": {
    "accepted": [Boolean],
    "value": true
  },
  "value": true
}

d3plus.public.legend = {
  "accepted": [Boolean],
  "label": null,
  "order": {
    "accepted": ["color","id","size","text"],
    "sort": {
      "accepted": ["asc","desc"],
      "value": "asc"
    },
    "value": "color"
  },
  "value": true
}

d3plus.public.messages = {
  "accepted": [Boolean,String],
  "value": true
}

d3plus.public.nodes = {
  "value": null
}

d3plus.public.number_format = {
  "value": function(number,key,vars) {

    var time = vars && vars.time.value ? [vars.time.value] : ["year","date"]

    if (key && time.indexOf(key.toLowerCase()) >= 0) {
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
  "sort": {
    "accepted": ["asc","desc"],
    "value": "asc",
    "deprecates": ["sort"]
  },
  "value": null
}

d3plus.public.shape = {
  "accepted": ["circle","donut","line","square","area","coordinates"],
  "interpolate": {
    "accepted": ["linear","step","step-before","step-after","basis","basis-open","cardinal","cardinal-open","monotone"],
    "value": "linear",
    "deprecates": ["stack_type"]
  },
  "value": null
}

d3plus.public.size = {
  "data_filter": true,
  "deprecates": ["value"],
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
  "threshold": true,
  "value": null
}

d3plus.public.temp = {
  "deprecates": ["else_var","else"],
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  },
  "value": null
}

d3plus.public.text = {
  "deprecates": ["name_array","text_var"],
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  },
  "value": null
}

d3plus.public.text_format = {
  "value": function(text,key,vars) {
    if (!text) return "";
    var smalls = ["a","and","of","to"]
    return text.replace(/\w\S*/g, function(txt,i){
      if (smalls.indexOf(txt) >= 0 && i != 0) return txt
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}

d3plus.public.time = {
  "data_filter": true,
  "deprecates": ["year","year_var"],
  "fixed": {
    "accepted": [Boolean],
    "value": true,
    "deprecates": ["static_axis","static_axes"]
  },
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  },
  "value": null
}

d3plus.public.timeline = {
  "accepted": [Boolean],
  "handles": {
    "accepted": [Boolean],
    "value": true
  },
  "label": null,
  "value": true
}

d3plus.public.title = {
  "link": null,
  "sub": {
    "link": null,
    "value": null,
    "deprecates": ["sub_title"]
  },
  "total": {
    "link": null,
    "value": false,
    "deprecates": ["total_bar"],
    "object": true
  },
  "value": null
}

d3plus.public.tooltip = {
  "deprecates": ["tooltip_info"],
  "object": true,
  "value": []
}

d3plus.public.total = {
  "deprecates": ["total_var"],
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  },
  "value": null
}

d3plus.public.type = {
  "mode": {
    "accepted": ["squarify","slice","dice","slice-dice"],
    "value": "squarify"
  },
  "value": "tree_map"
}

d3plus.public.width = {
  "small": 400,
  "value": null
}

d3plus.public.x = {
  "data_filter": true,
  "deprecates": ["xaxis","xaxis_val","xaxis_var"],
  "domain": null,
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
  "solo": {
    "value": []
  },
  "stacked": {
    "accepted": [Boolean],
    "value": false
  },
  "value": null,
  "zerofill": {
    "accepted": [Boolean],
    "value": false
  }
}

d3plus.public.y = {
  "data_filter": true,
  "deprecates": ["yaxis","yaxis_val","yaxis_var"],
  "domain": null,
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
  "solo": {
    "value": []
  },
  "stacked": {
    "accepted": [Boolean],
    "value": false
  },
  "value": null,
  "zerofill": {
    "accepted": [Boolean],
    "value": false
  }
}

d3plus.public.zoom = {
  "accepted": [Boolean],
  "click": {
    "accepted": [Boolean],
    "value": true
  },
  "pan": {
    "accepted": [Boolean],
    "value": true
  },
  "scroll": {
    "accepted": [Boolean],
    "value": true,
    "deprecates": ["scroll_zoom"]
  },
  "value": true
}
