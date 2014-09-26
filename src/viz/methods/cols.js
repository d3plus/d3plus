module.exports = {
  "accepted" : [ Array , Function , String ],
  "process"  : function(value, vars) {

    if (typeof value === "string") value = [value]
    
    return value
    
  },
  "value"    : false
}
