d3plus.data.element = function( vars ) {

  function get_attributes( obj , elem ) {

    var attributes = [ vars.color.value
                     , vars.icon.value
                     , vars.id.value
                     , vars.keywords.value
                     , vars.alt.value
                     , "style" ];

    [].forEach.call(elem.attributes, function(attr) {
        if (/^data-/.test(attr.name)) {
            var camelCaseName = attr.name.substr(5).replace(/-(.)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
            obj[camelCaseName] = attr.value;
        }
    })

    attributes.forEach(function(a){

      if ( elem.getAttribute(a) !== null ) {
        obj[a] = elem.getAttribute(a)
      }

    })

  }

  var elementTag  = vars.data.element.node().tagName.toLowerCase()
    , elementType = vars.data.element.attr("type")
    , elementData = []

  if ( elementTag === "select" ) {

    var elementID = vars.data.element.node().id
    if ( elementID ) {
      vars.self.container({"id": elementID})
    }

    vars.data.element.selectAll("option")
      .each(function( o , i ){

        var data_obj = {}

        data_obj[vars.text.value] = this.innerHTML

        get_attributes(data_obj,this)

        elementData.push(data_obj)

        if (this.selected) {
          vars.focus.value = data_obj[vars.id.value]
        }

      })

  }
  else if ( elementTag === "input" && elementType === "radio" ) {

    var elementName = vars.data.element.node().getAttribute("name")
    if ( elementName ) {
      vars.self.container({"id": elementName})
    }

    vars.data.element
      .each(function( o , i ){

        var data_obj = {}

        get_attributes(data_obj,this)

        var id = data_obj[vars.id.value] || this.id || false

        if ( id ) {

          var label = d3.select("label[for="+id+"]")

          if ( !label.empty() ) {
            data_obj[vars.text.value] = label.style("display","none").html()
          }

        }

        elementData.push(data_obj)

        if (this.checked) {
          vars.focus.value = data_obj[vars.id.value]
        }

      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Get focus from data, if it hasn't been found or set.
  //----------------------------------------------------------------------------
  if ( !vars.focus.value && elementData.length ) {

    vars.data.element.node().selectedIndex = 0
    vars.self.focus(elementData[0][vars.id.value])

  }

  function hideElement( elem ) {

    elem
      .style("position","absolute")
      .style("overflow","hidden")
      .style("clip","rect(0 0 0 0)")
      .style("width","1px")
      .style("height","1px")
      .style("margin","-1px")
      .style("padding","0")
      .style("border","0")

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If a <legend> element exists, use it as the title.
  //----------------------------------------------------------------------------
  var elementLegend = d3.select("legend[for="+vars.container.id+"]")
  if ( !elementLegend.empty() ) {

    vars.self.title(elementLegend.html())
    elementLegend.call(hideElement)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hide the original data element.
  //----------------------------------------------------------------------------
  vars.data.element.call(hideElement)

  if ( vars.container.value === false ) {
    vars.container.value = d3.select(vars.data.element.node().parentNode)
  }

  return elementData

}
