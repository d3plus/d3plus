// format number properly
vizwhiz.utils.format_num = function(val, percent, sig_figs) {
  
  if(percent){
    val = d3.format("."+sig_figs+"p")(val)
  }
  
  return val;
};

// Get a random color
vizwhiz.utils.color_scale = d3.scale.category20();
vizwhiz.utils.rand_color = function() {
  var rand_int = Math.floor(Math.random()*20)
  return vizwhiz.utils.color_scale(rand_int);
}