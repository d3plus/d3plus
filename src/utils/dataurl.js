//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a Base-64 Data URL from and Image URL
//------------------------------------------------------------------------------
d3plus.util.dataurl = function(url,callback) {

  var img = new Image();
  img.src = url;
  img.crossOrigin = "Anonymous";
  img.onload = function () {

    var canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(this, 0, 0);

    callback.call(this,canvas.toDataURL("image/png"))

    canvas = null

  }

}
