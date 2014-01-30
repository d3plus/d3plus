//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates correctly formatted tooltip for Apps
//-------------------------------------------------------------------
d3plus.tooltip.app = function(params) {
  
  var vars = params.vars,
      d = params.data,
      ex = params.ex,
      mouse = params.mouseevents ? params.mouseevents : false,
      arrow = params.arrow ? params.arrow : true
      
  if (d3.event.type == "click" && (vars.html.value || vars.tooltip.value.long)) {
    var fullscreen = true,
        arrow = false,
        mouse = true,
        length = "long",
        footer = vars.footer.value
      
    vars.covered = true
  }
  else {
    var fullscreen = false,
        align = vars.style.tooltip.anchor,
        length = "short",
        footer = vars.footer_text()
  }
  
  if (params.x) {
    var x = params.x
  }
  else if (d3plus.apps[vars.type.value].tooltip == "follow") {
    var x = d3.event.clientX
  }
  else {
    var x = d.d3plus.x
  }
  
  if (params.y) {
    var y = params.y
  }
  else if (d3plus.apps[vars.type.value].tooltip == "follow") {
    var y = d3.event.clientY
  }
  else {
    var y = d.d3plus.y
  }
  
  if (params.offset) {
    var offset = params.offset
  }
  else if (d3plus.apps[vars.type.value].tooltip == "follow") {
    var offset = 3
  }
  else {
    var offset = d.d3plus.r ? d.d3plus.r : d.d3plus.height/2
  }
  
  function make_tooltip(html) {

    var active = vars.active.key ? d3plus.variable.value(vars,d,vars.active.key) : d.d3plus.active,
        total = vars.total.key ? d3plus.variable.value(vars,d,vars.total.key) : d.d3plus.total
      
    if (active > 1 && active != total) {
      if (!ex) ex = {}
      ex.fill = active+"/"+total+" ("+vars.format((active/total)*100,"share")+"%)"
    }
    else if (d.d3plus.share) {
      if (!ex) ex = {}
      ex.share = vars.format(d.d3plus.share*100,"share")+"%"
    }
    
    var icon = d3plus.variable.value(vars,d,vars.icon.key),
        title = d3plus.variable.value(vars,d,vars.text.key),
        tooltip_data = d3plus.tooltip.data(vars,d,length,ex),
        id = d3plus.variable.value(vars,d,vars.id.key)
        
    if (!title) {
      title = id
    }
        
    d3plus.tooltip.create({
      "align": align,
      "arrow": arrow,
      "background": vars.style.tooltip.background,
      "fontcolor": vars.style.tooltip.font.color,
      "fontfamily": vars.style.tooltip.font.family,
      "fontweight": vars.style.tooltip.font.weight,
      "data": tooltip_data,
      "color": d3plus.variable.color(vars,d),
      "footer": footer,
      "fullscreen": fullscreen,
      "html": html,
      "icon": icon,
      "id": vars.type.value,
      "mouseevents": mouse,
      "offset": offset,
      "parent": vars.parent,
      "style": vars.style.icon,
      "title": title,
      "x": x,
      "y": y
    })
    
  }
  
  if (fullscreen) {

    if (typeof vars.html.value == "string") {
      make_tooltip(vars.html.value)
    }
    else if (typeof vars.html.value == "function") {
      make_tooltip(vars.html.value(id))
    }
    else if (vars.html.value && typeof vars.html.value == "object" && vars.html.value.url) {
      d3.json(vars.html.value.url,function(data){
        var html = vars.html.value.callback ? vars.html.value.callback(data) : data
        make_tooltip(html)
      })
    }
    else {
      make_tooltip("")
    }
    
  }
  else {
    make_tooltip("")
  }
  
}
