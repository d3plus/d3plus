var fetchValue = require("./value.coffee"),
    validObject = require("../../object/validate.coffee"),
    uniques     = require("../../util/uniques.coffee");

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get array of available text values
//------------------------------------------------------------------------------
module.exports = function(vars, obj, depth) {

  if (typeof depth !== "number") depth = vars.depth.value;

  var key = vars.id.nesting[depth], textKeys;

  if ( vars.text.nesting && validObject(vars.text.nesting) ) {
    if ( vars.text.nesting[key] ) {
      textKeys = vars.text.nesting[key];
    }
    else {
      textKeys = vars.text.value;
    }
  }
  else {
    textKeys = [];
    if (vars.text.value && depth === vars.depth.value) textKeys.push(vars.text.value);
    textKeys.push(key);
  }

  if ( !(textKeys instanceof Array) ) {
    textKeys = [ textKeys ];
  }

  var names = [];

  if (validObject(obj) && "d3plus" in obj && obj.d3plus.text) {
    names.push(obj.d3plus.text.toString());
    names.push(vars.format.value(obj.d3plus.text.toString(), undefined, vars, obj));
  }
  else {

    var formatObj = validObject(obj) ? obj : undefined;

    if (obj[vars.id.value] instanceof Array) {
      obj = obj[vars.id.value];
    }
    else if (!(obj instanceof Array)) {
      obj = [obj];
    }

    textKeys.forEach(function( t ){

      var name = uniques(obj, t, fetchValue, vars, key);

      if ( name.length ) {
        if (name.length > 1) {
          name = name.filter(function(n){
            return (n instanceof Array) || (n.indexOf(" < ") < 0);
          });
        }
        name = name.map(function(n){
          if (n instanceof Array) {
            return n.map(function(nn){
              return vars.format.value(nn.toString(), t, vars, formatObj);
            });
          }
          else if (n) {
            return vars.format.value(n.toString(), t, vars, formatObj);
          }
        });
        if (name.length === 1) name = name[0];
        names.push(name);
      }

    });

  }

  return names;

};
