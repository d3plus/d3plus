var defaultLocale = require("../core/locale/languages/en_US.coffee"),
    events        = require("../client/pointer.coffee"),
    legible       = require("../color/legible.coffee"),
    move          = require("./move.coffee"),
    prefix        = require("../client/prefix.coffee"),
    rtl           = require("../client/rtl.coffee"),
    removeTooltip = require("./remove.coffee"),
    scroll        = require("../client/scroll.js"),
    stringList    = require("../string/list.coffee"),
    textColor     = require("../color/text.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------
module.exports = function(params) {

  var default_width = params.fullscreen ? 250 : 200
    , vendor = prefix()
  params.width = params.width || default_width
  params.max_width = params.max_width || 386
  params.id = params.id || "default"
  params.size = params.fullscreen || params.html ? "large" : "small"
  params.offset = params.offset || 0
  params.arrow_offset = params.arrow ? 8 : 0
  params.x = params.x || 0
  params.y = params.y || 0
  params.parent = params.parent || d3.select("body")
  params.curtain = params.curtain || "#fff"
  params.curtainopacity = params.curtainopacity || 0.8
  params.background = params.background || "#fff"
  params.fontcolor = params.fontcolor || "#444"
  params.fontfamily = params.fontfamily || "sans-serif"
  params.fontweight = params.fontweight || "normal"
  params.fontsize = params.fontsize || "12px"
  params.style = params.style || "default"
  params.zindex = params.size == "small" ? 2000 : 500
  params.locale = params.locale || defaultLocale
  params.stacked = params.stacked || false;


  var parentHeight = params.parent ? params.parent.node().offsetHeight
                  || params.parent.node().getBoundingClientRect().height : 0

  if (!params.iconsize) {
    params.iconsize = params.size == "small" ? 22 : 50
  }

  if (params.parent.node() === document.body) {
    params.limit = [window.innerWidth + scroll.x(), window.innerHeight + scroll.y()];
  }
  else {
    params.limit = [
      parseFloat(params.parent.style("width"),10),
      parseFloat(params.parent.style("height"),10)
    ];
  }

  if ( params.title instanceof Array ) {

    var and = params.locale.ui.and
      , more = params.locale.ui.more

    params.title = stringList( params.title , and , 3 , more )

  }

  removeTooltip(params.id)

  params.anchor = {}
  if (params.fullscreen) {
    params.anchor.x = "center"
    params.anchor.y = "center"
    params.x = params.parent ? params.parent.node().offsetWidth/2 : window.innerWidth/2
    params.y = params.parent ? parentHeight/2 : window.innerHeight/2
  }
  else if (params.align) {
    var a = params.align.split(" ")
    params.anchor.y = a[0]
    if (a[1]) params.anchor.x = a[1]
    else params.anchor.x = "center"
  }
  else {
    params.anchor.x = "center"
    params.anchor.y = "top"
  }

  var title_width = params.width - 30

  if (params.fullscreen) {
    var curtain = params.parent.append("div")
      .attr("id","d3plus_tooltip_curtain_"+params.id)
      .attr("class","d3plus_tooltip_curtain")
      .style("background-color",params.curtain)
      .style("opacity",params.curtainopacity)
      .style("position","absolute")
      .style("z-index",499)
      .style("top","0px")
      .style("right","0px")
      .style("bottom","0px")
      .style("left","0px")
      .on(events.click,function(){
        removeTooltip(params.id)
      })
  }

  var tooltip = params.parent.append("div")
    .datum(params)
    .attr("id","d3plus_tooltip_id_"+params.id)
    .attr("class","d3plus_tooltip d3plus_tooltip_"+params.size)
    .style("color",params.fontcolor)
    .style("font-family",params.fontfamily)
    .style("font-weight",params.fontweight)
    .style("font-size",params.fontsize+"px")
    .style(vendor+"box-shadow","0px 1px 3px rgba(0, 0, 0, 0.25)")
    .style("position","absolute")
    // .style("z-index",params.zindex)
    .on(events.out, close_descriptions)

  if (params.max_height) {
    tooltip.style("max-height",params.max_height+"px")
  }

  if (params.fixed) {
    tooltip.style("z-index",500)
    params.mouseevents = true
  }
  else {
    tooltip.style("z-index",2000)
  }

  var container = tooltip.append("div")
    .datum(params)
    .attr("class","d3plus_tooltip_container")
    .style("background-color",params.background)
    .style("padding","6px")

  if (params.fullscreen && params.html && !params.stacked) {

    w = params.parent ? params.parent.node().offsetWidth*0.75 : window.innerWidth*0.75
    h = params.parent ? parentHeight*0.75 : window.innerHeight*0.75

    container
      .style("width",w+"px")
      .style("height",h+"px")

    var body = container.append("div")
      .attr("class","d3plus_tooltip_body")
      .style("padding-right","6px")
      .style("display","inline-block")
      .style("z-index",1)
      .style("width",params.width+"px")

  }
  else {

    if (params.width == "auto") {
      var w = "auto"
      container.style("max-width",params.max_width+"px")
    }
    else var w = params.width-14+"px"

    var body = container
      .style("width",w)

  }

  if (params.title || params.icon) {
    var header = body.append("div")
      .attr("class","d3plus_tooltip_header")
      .style("position","relative")
      .style("z-index",1)
  }

  if (params.fullscreen) {
    var close = tooltip.append("div")
      .attr("class","d3plus_tooltip_close")
      .style("background-color",params.color)
      .style("color",textColor(params.color))
      .style("position","absolute")
      .style(vendor+"box-shadow","0 1px 3px rgba(0, 0, 0, 0.25)")
      .style("font-size","20px")
      .style("height","18px")
      .style("line-height","14px")
      .style("text-align","center")
      .style("right","16px")
      .style("top","-10px")
      .style("width","18px")
      .style("z-index",10)
      .html("\&times;")
      .on(events.over,function(){
        d3.select(this)
          .style("cursor","pointer")
          .style(vendor+"box-shadow","0 1px 3px rgba(0, 0, 0, 0.5)")
      })
      .on(events.out,function(){
        d3.select(this)
          .style("cursor","auto")
          .style(vendor+"box-shadow","0 1px 3px rgba(0, 0, 0, 0.25)")
      })
      .on(events.click,function(){
        removeTooltip(params.id)
      })

    d3.select("body").on("keydown.esc_" + params.id, function(){
      if (d3.event.keyCode === 27) {
        removeTooltip(params.id);
        d3.select("body").on("keydown.esc_" + params.id, null);
      }
    })

  }

  if (!params.mouseevents) {
    tooltip.style("pointer-events","none")
  }
  else if (params.mouseevents !== true) {

    var oldout = d3.select(params.mouseevents).on(events.out)

    var newout = function() {

      var target = d3.event.toElement || d3.event.relatedTarget
      if (target) {
        var c = typeof target.className == "string" ? target.className : target.className.baseVal
        var istooltip = c.indexOf("d3plus_tooltip") == 0
      }
      else {
        var istooltip = false
      }
      if (!target || (!ischild(tooltip.node(),target) && !ischild(params.mouseevents,target) && !istooltip)) {
        oldout(d3.select(params.mouseevents).datum())
        close_descriptions()
        d3.select(params.mouseevents).on(events.out,oldout)
      }
    }

    var ischild = function(parent, child) {
       var node = child.parentNode;
       while (node !== null) {
         if (node == parent) {
           return true;
         }
         node = node.parentNode;
       }
       return false;
    }

    d3.select(params.mouseevents).on(events.out,newout)
    tooltip.on(events.out,newout)

    var move_event = d3.select(params.mouseevents).on(events.move)
    if (move_event) {
      tooltip.on(events.move,move_event)
    }

  }

  if (params.arrow) {
    var arrow = tooltip.append("div")
      .attr("class","d3plus_tooltip_arrow")
      .style("background-color",params.background)
      .style(vendor+"box-shadow","0px 1px 3px rgba(0, 0, 0, 0.25)")
      .style("position","absolute")
      .style("bottom","-5px")
      .style("height","10px")
      .style("left","50%")
      .style("margin-left","-5px")
      .style("width","10px")
      .style(vendor+"transform","rotate(45deg)")
      .style("z-index",-1)
  }

  if (params.icon) {

    var title_icon = header.append("div")
      .attr("class","d3plus_tooltip_icon")
      .style("width",params.iconsize+"px")
      .style("height",params.iconsize+"px")
      .style("z-index",1)
      .style("background-position","50%")
      .style("background-size","100%")
      .style("background-image","url("+params.icon+")")
      .style("display","inline-block")
      .style("margin","0px 3px 3px 0px")

    if (params.style == "knockout") {
      title_icon.style("background-color",params.color)
    }

    title_width -= title_icon.node().offsetWidth
  }

  if (params.title) {
    var mw = params.max_width-6
    if ( params.icon ) mw -= (params.iconsize+6)
    mw += "px"

    var title = header.append("div")
      .attr("class","d3plus_tooltip_title")
      .style("max-width",mw)
      .style("color",!params.icon ? legible(params.color) : params.fontcolor)
      .style("vertical-align","top")
      .style("width",title_width+"px")
      .style("display","inline-block")
      .style("overflow","hidden")
      .style("text-overflow","ellipsis")
      .style("word-wrap","break-word")
      .style("z-index",1)
      .style("font-size",params.size === "large" ? "18px" : "16px")
      .style("line-height",params.size === "large" ? "20px" : "17px")
      .style("padding",params.size === "large" ? "3px 6px" : "3px")
      .text(params.title)
  }

  if (params.description) {
    var description = body.append("div")
      .attr("class","d3plus_tooltip_description")
      .style("font-size","12px")
      .style("padding","6px")
      .text(params.description)
  }

  if (params.data || params.html && !params.fullscreen) {

    var data_container = body.append("div")
      .attr("class","d3plus_tooltip_data_container")
      .style("overflow-y","auto")
      .style("z-index",-1)
  }

  if (params.data) {

    var val_width = 0, val_heights = {}

    var last_group = null
    params.data.forEach(function(d,i){

      if (d.group) {
        if (last_group != d.group) {
          last_group = d.group
          data_container.append("div")
            .attr("class","d3plus_tooltip_data_title")
            .style("font-size","12px")
            .style("font-weight","bold")
            .style("padding","6px 3px 0px 3px")
            .text(d.group)
        }
      }

      var block = data_container.append("div")
        .attr("class","d3plus_tooltip_data_block")
        .style("font-size","12px")
        .style("padding","3px 6px")
        .style("position","relative")
        .datum(d)

      if ( d.highlight === true ) {
        block.style("color",legible(params.color))
      }
      else if ( d.allColors || d.highlight !== params.color ) {
        block.style("color",legible(d.highlight))
      }

      var name = block.append("div")
          .attr("class","d3plus_tooltip_data_name")
          .style("display","inline-block")
          .html(d.name)
          .on(events.out,function(){
            d3.event.stopPropagation()
          })

      if (d.link) {
        name
          .style("cursor","pointer")
          .on(events.click,d.link)
      }

      if ( d.value instanceof Array ) {

        var and = params.locale.ui.and
          , more = params.locale.ui.more

        d.value = list( d.value , and , 3 , more )

      }

      var val = block.append("div")
          .attr("class","d3plus_tooltip_data_value")
          .style("display","block")
          .style("position","absolute")
          .style("text-align","right")
          .style("top","3px")
          .html(d.value)
          .on(events.out,function(){
            d3.event.stopPropagation()
          })

      if (rtl) {
        val.style("left","6px")
      }
      else {
        val.style("right","6px")
      }

      if (params.mouseevents && d.desc) {
        var desc = block.append("div")
          .attr("class","d3plus_tooltip_data_desc")
          .style("color","#888")
          .style("overflow","hidden")
          .style(vendor+"transition","height 0.5s")
          .style("width","85%")
          .text(d.desc)
          .on(events.out,function(){
            d3.event.stopPropagation()
          })

        var dh = desc.node().offsetHeight || desc.node().getBoundingClientRect().height

        desc.style("height","0px")

        var help = name.append("div")
          .attr("class","d3plus_tooltip_data_help")
          .style("background-color","#ccc")
          .style(vendor+"border-radius","5px")
          .style("color","#fff")
          .style("cursor","pointer")
          .style("display","inline-block")
          .style("font-size","8px")
          .style("font-weight","bold")
          .style("height","10px")
          .style("margin","3px 0px 0px 3px")
          .style("padding-right","1px")
          .style("text-align","center")
          .style("width","10px")
          .style("vertical-align","top")
          .style(prefix+"transition","background-color 0.5s")
          .text("?")
          .on(events.over,function(){
            var c = d3.select(this.parentNode.parentNode).style("color")
            d3.select(this).style("background-color",c)
            desc.style("height",dh+"px")
          })
          .on(events.out,function(){
            d3.event.stopPropagation()
          })

        name
          .style("cursor","pointer")
          .on(events.over,function(){
            close_descriptions()
            var c = d3.select(this.parentNode).style("color")
            help.style("background-color",c)
            desc.style("height",dh+"px")
          })

        block.on(events.out,function(){
          d3.event.stopPropagation()
          close_descriptions()
        })
      }

      var w = parseFloat(val.style("width"),10)
      if (w > params.width/2) w = params.width/2
      if (w > val_width) val_width = w

      if (i != params.data.length-1) {
        if ((d.group && d.group == params.data[i+1].group) || !d.group && !params.data[i+1].group)
        data_container.append("div")
          .attr("class","d3plus_tooltip_data_seperator")
          .style("background-color","#ddd")
          .style("display","block")
          .style("height","1px")
          .style("margin","0px 3px")
      }

    })

    data_container.selectAll(".d3plus_tooltip_data_name")
      .style("width",function(){
        var w = parseFloat(d3.select(this.parentNode).style("width"),10)
        return (w-val_width-30)+"px"
      })

    data_container.selectAll(".d3plus_tooltip_data_value")
      .style("width",val_width+"px")
      .each(function(d){
        var h = parseFloat(d3.select(this).style("height"),10)
        val_heights[d.name] = h
      })

    data_container.selectAll(".d3plus_tooltip_data_name")
      .style("min-height",function(d){
        return val_heights[d.name]+"px"
      })

  }

  if (params.html && (!params.fullscreen || params.stacked)) {
    data_container.append("div")
      .html(params.html)
    if (params.js) {
      params.js(container)
    }
  }

  var footer = body.append("div")
    .attr("class","d3plus_tooltip_footer")
    .style("font-size","10px")
    .style("position","relative")
    .style("text-align","center")

  if (params.footer) {
    footer.html(params.footer)
  }

  params.height = tooltip.node().offsetHeight || tooltip.node().getBoundingClientRect().height

  if (params.html && params.fullscreen && !params.stacked) {
    var h = params.height-12
    var w = tooltip.node().offsetWidth-params.width-44
    container.append("div")
      .attr("class","d3plus_tooltip_html")
      .style("width",w+"px")
      .style("height",h+"px")
      .style("display","inline-block")
      .style("vertical-align","top")
      .style("overflow-y","auto")
      .style("padding","0px 12px")
      .style("position","absolute")
      .html(params.html)
    if (params.js) {
      params.js(container)
    }
  }

  params.width = tooltip.node().offsetWidth

  if (params.anchor.y != "center") params.height += params.arrow_offset
  else params.width += params.arrow_offset

  if (params.data || ((!params.fullscreen || params.stacked) && params.html)) {

    if (!params.fullscreen || params.stacked) {
      var limit = params.fixed ? parentHeight-params.y-10 : parentHeight-10
      var h = params.height < limit ? params.height : limit
    }
    else {
      var h = params.height
    }
    h -= parseFloat(container.style("padding-top"),10)
    h -= parseFloat(container.style("padding-bottom"),10)
    if (header) {
      h -= header.node().offsetHeight || header.node().getBoundingClientRect().height
      h -= parseFloat(header.style("padding-top"),10)
      h -= parseFloat(header.style("padding-bottom"),10)
    }
    if (footer) {
      h -= footer.node().offsetHeight || footer.node().getBoundingClientRect().height
      h -= parseFloat(footer.style("padding-top"),10)
      h -= parseFloat(footer.style("padding-bottom"),10)
    }

    data_container
      .style("max-height",h+"px")
  }

  params.height = tooltip.node().offsetHeight || tooltip.node().getBoundingClientRect().height

  move(params.x, params.y, params.id);

}



//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Function that closes ALL Descriptions
//-------------------------------------------------------------------
function close_descriptions() {
  d3.selectAll("div.d3plus_tooltip_data_desc").style("height","0px");
  d3.selectAll("div.d3plus_tooltip_data_help").style("background-color","#ccc");
}
