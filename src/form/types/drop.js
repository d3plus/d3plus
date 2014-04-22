//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Dropdown Menu
//------------------------------------------------------------------------------
d3plus.form.drop = function(vars,styles,timing) {

  if (vars.element) {
    vars.element.on("focus."+vars.id,function(){
      vars.self.update(false).hover(true).draw()
    })
    vars.element.on("blur."+vars.id,function(){
      var search = vars.search ? d3.event.relatedTarget != vars.container.select("input").node() : true
      if (search) {
        vars.self.update(false).hover(false).draw()
      }
    })
    vars.element.on("change."+vars.id,function(){
      vars.self.value(vars.data.array[this.selectedIndex])
    })
    vars.element.on("keydown.cancel_"+vars.id,function(){
      // Only let TAB work
      var key = d3.event.keyCode
      if (key != 9) {
        d3.event.preventDefault()
      }
    })
  }

  d3.select(document).on("keydown."+vars.id,function(){

    if (vars.enabled || vars.hover === true) {

      var key = d3.event.keyCode,
          options = list.select("div").selectAll("div.d3plus_node"),
          index = 0

      if (typeof vars.hover == "boolean") {
        options.each(function(d,i){
          if (d.value == vars.focus) {
            index = i
          }
        })
      }
      else {
        options.each(function(d,i){
          if (d.value == vars.hover) {
            index = i
          }
        })
      }

      // Tab
      if ([9].indexOf(key) >= 0 && (!vars.search || (vars.search && !d3.event.shiftKey))) {
        vars.self.update(false).disable()
      }
      // Down Arrow
      else if ([40].indexOf(key) >= 0) {
        if (vars.enabled) {
          if (index >= options.size()-1) {
            index = 0
          }
          else {
            index += 1
          }
        }

        if (typeof vars.hover != "boolean") {
          var hover = options.data()[index].value
        }
        else {
          var hover = vars.focus
        }

        if (vars.enabled) {
          vars.self.update(false).hover(hover).draw(60)
        }
        else {
          vars.self.update(false).hover(hover).enable()
        }

      }
      // Up Arrow
      else if ([38].indexOf(key) >= 0) {
        if (vars.enabled) {
          if (index <= 0) {
            index = options.size()-1
          }
          else {
            index -= 1
          }
        }

        if (typeof vars.hover != "boolean") {
          var hover = options.data()[index].value
        }
        else {
          var hover = vars.focus
        }

        if (vars.enabled) {
          vars.self.update(false).hover(hover).draw(60)
        }
        else {
          vars.self.update(false).hover(hover).enable()
        }

      }
      // Enter/Return
      else if ([13].indexOf(key) >= 0) {
        if (typeof vars.hover != "boolean") {
          vars.self.value(vars.hover).hover(true).draw()
        }
        else {
          vars.self.hover(vars.focus).toggle()
        }
      }
      // Esc
      else if ([27].indexOf(key) >= 0) {
        if (vars.enabled) {
          vars.self.hover(true).disable()
        }
        else if (vars.hover === true) {
          vars.self.hover(false).draw()
        }
      }

    }

  })

  function parent_click(elem) {

    d3.select(elem).on("click."+vars.id,function(){

      var element = d3.event.target || d3.event.toElement
      element = element.id
      var child = "_"+vars.id

      if (element.indexOf(child) < 0 && vars.enabled) {
        vars.self.disable()
      }

    })

    try {
      var same_origin = window.parent.location.host == window.location.host;
    }
    catch (e) {
      var same_origin = false
    }

    if (same_origin) {
      if (elem.self !== window.top) {
        parent_click(elem.parent)
      }
    }

  }

  parent_click(window)

  if (styles.icon) {

    if (styles.icon.indexOf("fa-") == 0) {
      var icon = {
        "class": "d3plus_drop_icon fa "+styles.icon,
        "content": ""
      }
    }
    else {
      var icon = {
        "class": "d3plus_drop_icon",
        "content": styles.icon
      }
    }

  }
  else {
    var icon = false
  }

  var drop_width = d3plus.form.value(styles.width,["drop","button"])
  if (!drop_width || typeof drop_width != "number") {

    if (vars.dev) d3plus.console.time("calculating width")

    var data = d3plus.util.copy(styles)

    if (!icon) {

      if (d3plus.font.awesome) {
        data.icon = {
          "class": "fa fa-check",
          "content": ""
        }
      }
      else {
        data.icon = {
          "class": "",
          "content": "&#x2713;"
        }
      }

    }
    else {
      data.icon = icon
    }

    data.display = "inline-block"
    data.border = "none"
    data.width = false
    data.margin = 0

    var text = d3plus.form.value(vars.text,["drop","button"])
    if (!text) {
     text = "text"
    }

    var button = d3plus.form(data)
      .type("button")
      .text(text)
      .data(vars.data.array)
      .parent(vars.tester)
      .id(vars.id)
      .timing(0)
      .large(9999)
      .draw()

    var w = button.width()
    drop_width = d3.max(w)
    drop_width += styles.stroke*2
    button.remove()

    if (vars.dev) d3plus.console.timeEnd("calculating width")

  }

  if (typeof styles.width != "object") {
    styles.width = {}
  }

  styles.width.drop = drop_width

  var button_width = d3plus.form.value(styles.width,["button","drop"])
  if (!button_width || typeof button_width != "number") {
    button_width = drop_width
  }

  styles.width.button = button_width

  if (vars.dev) d3plus.console.time("creating main button")

  var style = d3plus.util.copy(styles)
  style.icon = icon
  style.width = button_width
  style.margin = 0
  if (vars.enabled) {
    style.shadow = 0
  }
  var text = d3plus.form.value(vars.text,["button","drop"])
  if (!text) {
   text = "text"
  }
  var data = d3plus.util.copy(vars.data.array.filter(function(d){
    return d.value == vars.focus
  })[0])
  data.id = "drop_button"
  var test_data = d3plus.util.copy(data)
  test_data.text = "Test"
  var hover = vars.hover === true ? vars.focus : false

  if (vars.dev) d3plus.console.group("main button")
  var button = d3plus.form(style)
    // .dev(vars.dev)
    .type("button")
    .text(text)
    .parent(vars.container)
    .id(vars.id)
    .timing(timing)
    .hover(hover)
    .data([test_data])
    .callback(vars.self.toggle)
    .highlight(vars.focus)
    .update(vars.draw.update)
    .enable()
    .draw()

  var line_height = button.height()

  button.data([data]).height(line_height).draw()

  if (vars.dev) d3plus.console.groupEnd()

  if (vars.dev) d3plus.console.timeEnd("creating main button")


  if (vars.dev) d3plus.console.time("creating dropdown")

  var selector = vars.container.selectAll("div.d3plus_drop_selector")
    .data(["selector"])

  selector.enter().append("div")
    .attr("class","d3plus_drop_selector")
    .style("position","absolute")
    .style("top","0px")
    .style("padding",styles.stroke+"px")
    .style("z-index","-1")
    .style("overflow","hidden")

  if (vars.dev) d3plus.console.timeEnd("creating dropdown")
  if (vars.dev && vars.search) d3plus.console.time("creating search")

  var search_style = d3plus.util.merge(styles,styles.drop)
  var search_data = vars.search ? ["search"] : []

  var search = selector.selectAll("div.d3plus_drop_search")
    .data(search_data)

  var search_width = styles.width.drop
  search_width -= styles.padding*4
  search_width -= styles.stroke*2

  if (timing) {
    search.transition().duration(timing)
      .style("padding",search_style.padding+"px")
      .style("display","block")
      .style("background-color",search_style.secondary)
  }
  else {
    search
      .style("padding",search_style.padding+"px")
      .style("display","block")
      .style("background-color",search_style.secondary)
  }

  function input_style(elem) {
    elem
      .style("padding",search_style.padding+"px")
      .style("width",search_width+"px")
      .style("border-style","solid")
      .style("border-width","0px")
      .style("font-family",search_style["font-family"])
      .style("font-size",search_style["font-size"]+"px")
      .style("font-weight",search_style["font-weight"])
      .style("text-align",search_style["font-align"])
      .attr("placeholder",vars.format.value("Search"))
      .style("outline","none")
      .style(d3plus.prefix()+"border-radius","0")
  }

  if (timing) {
    search.select("input").transition().duration(timing)
      .call(input_style)
  }
  else {
    search.select("input")
      .call(input_style)
  }

  search.enter().insert("div","#d3plus_drop_list_"+vars.id)
    .attr("class","d3plus_drop_search")
    .attr("id","d3plus_drop_search_"+vars.id)
    .style("padding",search_style.padding+"px")
    .style("display","block")
    .style("background-color",search_style.secondary)
    .append("input")
      .attr("id","d3plus_drop_input_"+vars.id)
      .style("-webkit-appearance","none")
      .call(input_style)

  search.select("input").on("keyup."+vars.id,function(d){
    if (vars.filter != this.value) {
      vars.filter = this.value
      vars.self.draw()
    }
  })

  search.exit().remove()

  if (vars.dev && vars.search) d3plus.console.timeEnd("creating search")
  if (vars.dev) d3plus.console.time("populating list")

  var list = selector.selectAll("div.d3plus_drop_list")
    .data(["list"])

  list.enter().append("div")
    .attr("class","d3plus_drop_list")
    .attr("id","d3plus_drop_list_"+vars.id)
    .style("overflow-y","auto")
    .style("overflow-x","hidden")

  if (vars.loading) {
    var data = [
      {
        "text": vars.format.value("Loading...")
      }
    ]
  }
  else if (vars.enabled) {

    var search_text = d3plus.util.strip(vars.filter.toLowerCase()).split("_"),
        tests = ["value","text","alt","keywords"],
        search_text = search_text.filter(function(t){ return t != ""; })

    if (vars.filter == "") {
      var data = vars.data.array
    }
    else {

      var data = vars.data.array.filter(function(d){

        var match = false

        for (key in tests) {
          if (tests[key] in d && d[tests[key]]) {
            var text = d3plus.util.strip(d[tests[key]].toLowerCase()).split("_")

            for (t in text) {
              for (s in search_text) {
                if (text[t].indexOf(search_text[s]) == 0) {
                  match = true
                  break
                }
              }
            }
          }
        }
        return match
      })

    }

    if (data.length == 0) {
      data = [
        {
          "text": vars.format.value("No results match")+" \""+vars.filter+"\""
        }
      ]
    }

  }

  if (vars.dev) d3plus.console.timeEnd("populating list")

  var position = vars.container.node().getBoundingClientRect()

  var max = window.innerHeight-position.top

  max -= button.height()
  max -= 10
  if (max < button.height()*2) {
    max = position.top-10
    vars.flipped = true
  }
  var scrolling = false
  if (max > vars["max-height"]) {
    max = vars["max-height"]
  }

  if (vars.enabled) {

    if (vars.dev) d3plus.console.time("updating list items")

    if (vars.dev) d3plus.console.group("list buttons")

    var style = d3plus.util.merge(styles,styles.drop)
    style.icon = false
    style.display = "block"
    style.border = "none"
    style.width = "auto"
    style.margin = 0
    var text = d3plus.form.value(vars.text,["drop","button"])
    if (!text) {
     text = "text"
    }

    var large = vars.data.array.length < vars.large ? vars.large : 0

    var buttons = d3plus.form(style)
      .dev(vars.dev)
      .type("button")
      .text(text)
      .data(data)
      // .height(line_height)
      .parent(list)
      .id(vars.id+"_option")
      .timing(timing)
      .callback(vars.self.value)
      .previous(vars.previous)
      .selected(vars.focus)
      .hover(vars.hover)
      .hover_previous(vars.hover_previous)
      .update(vars.draw.update)
      .large(large)
      .draw()

    if (vars.dev) d3plus.console.groupEnd()

    if (vars.dev) d3plus.console.timeEnd("updating list items")
    if (vars.dev) d3plus.console.time("calculating height")

    var hidden = false
    if (selector.style("display") == "none") {
      var hidden = true
    }

    if (hidden) selector.style("display","block")

    var search_height = vars.search ? search[0][0].offsetHeight : 0

    var old_height = selector.style("height"),
        old_scroll = selector.property("scrollTop"),
        list_height = list.style("max-height"),
        list_scroll = list.property("scrollTop")

    selector.style("height","auto")
    list.style("max-height","200000px")

    var height = parseFloat(selector.style("height"),10)

    list
      .style("max-height",list_height)
      .property("scrollTop",list_scroll)
    selector
      .style("height",old_height)
      .property("scrollTop",old_scroll)

    if (height > max) {
      height = max
      scrolling = true
    }

    if (hidden) selector.style("display","none")

    if (vars.dev) d3plus.console.timeEnd("calculating height")

    if (scrolling) {

      if (vars.dev) d3plus.console.time("calculating scroll position")

      var index = 0
      var options = list.select("div").selectAll("div.d3plus_node")
      if (typeof vars.hover == "boolean") {
        options.each(function(d,i){
          if (d.value == vars.focus) {
            index = i
          }
        })
      }
      else {
        options.each(function(d,i){
          if (d.value == vars.hover) {
            index = i
          }
        })
      }

      var hidden = false
      if (selector.style("display") == "none") {
        hidden = true
      }
      var option = options[0][index]
      if (hidden) selector.style("display","block")
      var button_top = option.offsetTop,
          button_height = option.offsetHeight,
          list_top = list.property("scrollTop")

      if (hidden) selector.style("display","none")
      if (hidden || vars.data.changed) {

        var scroll = button_top

      }
      else {

        var scroll = list_top

        if (button_top < list_top) {
          var scroll = button_top
        }
        else if (button_top+button_height > list_top+max-search_height) {
          var scroll = button_top - (max-button_height-search_height)
        }

      }

      if (vars.dev) d3plus.console.timeEnd("calculating scroll position")

    }
    else {
      var scroll = 0
    }

  }
  else {
    var scroll = list.property("scrollTop"),
        height = 0,
        search_height = 0
  }

  if (vars.dev) d3plus.console.time("rotating arrow")

  var offset = icon.content == "&#x27A4;" ? 90 : 0
  if (vars.enabled != vars.flipped) {
    var rotate = "rotate(-"+(180-offset)+"deg)"
  }
  else {
    var rotate = "rotate("+offset+"deg)"
  }

  button.select("div#d3plus_button_element_"+vars.id+"_icon")
    .data(["icon"])
    .style(d3plus.prefix()+"transition",(timing/1000)+"s")
    .style(d3plus.prefix()+"transform",rotate)
    .style("opacity",function(){
      return vars.enabled ? 0.5 : 1
    })

  if (vars.dev) d3plus.console.timeEnd("rotating arrow")

  if (vars.dev) d3plus.console.time("drawing list")

  function update(elem) {

    elem
      .style("left",function(){
        if (styles.align == "left") {
          return "0px"
        }
        else if (styles.align == "center") {
          return -((drop_width-button_width)/2)+"px"
        }
        else {
          return "auto"
        }
      })
      .style("right",function(){
        return styles.align == "right" ? "0px" : "auto"
      })
      .style("height",height+"px")
      .style("padding",styles.stroke+"px")
      .style("background-color",styles.secondary)
      .style("z-index",function(){
        return vars.enabled ? "9999" : "-1";
      })
      .style("width",(drop_width-(styles.stroke*2))+"px")
      .style("top",function(){
        return vars.flipped ? "auto" : button.height()+"px"
      })
      .style("bottom",function(){
        return vars.flipped ? button.height()+"px" : "auto"
      })
      .style("opacity",vars.enabled ? 1 : 0)

  }

  function finish(elem) {

    elem
      .style("top",function(){
        return vars.flipped ? "auto" : button.height()+"px"
      })
      .style("bottom",function(){
        return vars.flipped ? button.height()+"px" : "auto"
      })
      .style("display",!vars.enabled ? "none" : null)

    if (vars.search && vars.enabled) {
      selector.select("div.d3plus_drop_search input").node().focus()
    }

  }

  var max_height = vars.enabled ? max-search_height : 0

  if (!timing) {

    selector.call(update).call(finish)

    list
      .style("width",drop_width-styles.stroke*2+"px")
      .style("max-height",max_height+"px")
      .property("scrollTop",scroll)

  }
  else {
    selector.transition().duration(timing)
      .each("start",function(){
        d3.select(this)
          .style("display",vars.enabled ? "block" : null)
      })
      .call(update)
      .each("end",function(){

        d3.select(this).transition().duration(timing)
          .call(finish)

      })

    function scrollTopTween(scrollTop) {
        return function() {
            var i = d3.interpolateNumber(this.scrollTop, scrollTop);
            return function(t) { this.scrollTop = i(t); };
        };
    }

    list.transition().duration(timing)
      .style("width",drop_width-styles.stroke*2+"px")
      .style("max-height",max_height+"px")
      .tween("scroll",scrollTopTween(scroll))
  }

  if (vars.dev) d3plus.console.timeEnd("drawing list")

}
