//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// function that will wrap and resize SVG text
//-------------------------------------------------------------------
d3plus.util.wordwrap = function(params) {

  var parent = params.parent,
      width = params.width ? params.width : 20000,
      height = params.height ? params.height : 20000,
      resize = params.resize,
      font_max = params.font_max ? params.font_max : 40,
      font_min = params.font_min ? params.font_min : 9,
      text_array = params.text,
      split = ["-","/",";",":","&"],
      regex = new RegExp("[^\\s\\"+split.join("\\")+"]+\\"+split.join("?\\")+"?","g"),
      current_text = ""

  if (!d3.select(parent).attr("font-size")) {
    d3.select(parent).attr("font-size",font_min)
  }

  if (text_array instanceof Array) {
    text_array = text_array.filter(function(t){
      return ["string","number"].indexOf(typeof t) >= 0
    })
    current_text = String(text_array.shift())
  }
  else {
    current_text = String(text_array)
  }

  wrap()

  function wrap() {

    var words = current_text.match(regex)

    if (resize) {

      // Start by trying the largest font size
      var size = font_max
      size = Math.floor(size)
      d3.select(parent).attr("font-size",size)

      // Add each word to it's own line (to test for longest word)
      d3.select(parent).selectAll("tspan").remove()
      for(var i=0; i<words.length; i++) {
        if (words.length == 1) var t = words[i]
        else var t = words[i]+"..."
        d3.select(parent).append("tspan").attr("x",0).text(t)
      }

      // If the longest word is too wide, make the text proportionately smaller
      if (parent.getBBox().width > width) size = size*(width/parent.getBBox().width)

      // If the new size is too small, return NOTHING
      if (size < font_min) {
        d3.select(parent).selectAll("tspan").remove();
        if (typeof text_array == "string" || text_array.length == 0) return;
        else {
          current_text = String(text_array.shift())
          wrap()
        }
        return;
      }

      // Use new text size
      size = Math.floor(size)
      d3.select(parent).attr("font-size",size);

      // Flow text into box
      flow();

      // If text doesn't fit height-wise, shrink it!
      if (parent.childNodes.length*parent.getBBox().height > height) {
        var temp_size = size*(height/(parent.childNodes.length*parent.getBBox().height))
        if (temp_size < font_min) size = font_min
        else size = temp_size
        size = Math.floor(size)
        d3.select(parent).attr("font-size",size)
      } else finish();

    }

    flow();
    truncate();
    finish();

    function flow() {

      d3.select(parent).selectAll("tspan").remove()

      var x_pos = parent.getAttribute("x")

      var tspan = d3.select(parent).append("tspan")
        .attr("x",x_pos)
        .text(words[0])

      for (var i=1; i < words.length; i++) {

        var current = tspan.text(),
            last_char = current.slice(-1),
            next_char = current_text.charAt(current_text.indexOf(current)+current.length)
            joiner = next_char == " " ? " " : ""

        tspan.text(current+joiner+words[i])

        if (tspan.node().getComputedTextLength() > width) {

          tspan.text(current)

          tspan = d3.select(parent).append("tspan")
            .attr("x",x_pos)
            .text(words[i])

        }
      }

    }

    function truncate() {
      var cut = false
      while (parent.childNodes.length*parent.getBBox().height > height && parent.lastChild && !cut) {
        parent.removeChild(parent.lastChild)
        if (parent.childNodes.length*parent.getBBox().height < height && parent.lastChild) cut = true
      }
      if (cut) {

        tspan = parent.lastChild
        words = d3.select(tspan).text().match(/[^\s-]+-?/g)

        function ellipsis() {

          if (words.length) {

            var last_word = words[words.length-1],
                last_char = last_word.charAt(last_word.length-1)

            if (last_word.length == 1 && split.indexOf(last_word) >= 0) {

              words.pop()
              ellipsis()

            }
            else {

              if (split.indexOf(last_char) >= 0) {
                last_word = last_word.substr(0,last_word.length-1)
              }

              d3.select(tspan).text(words.join(" ")+"...")
              if (tspan.getComputedTextLength() > width) {
                words.pop()
                ellipsis()
              }

            }

          }
          else {

            d3.select(tspan).remove()

          }

        }

        ellipsis()

      }
    }
  }

  function finish() {
    d3.select(parent).selectAll("tspan").attr("dy", d3.select(parent).style("font-size"));
    return;
  }

}
