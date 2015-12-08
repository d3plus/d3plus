module.exports = {
  "y": function() {
    return (window.pageYOffset !== undefined) ? window.pageYOffset :
           (document.documentElement || document.body.parentNode || document.body).scrollTop
  },
  "x": function() {
    return (window.pageXOffset !== undefined) ? window.pageXOffset :
           (document.documentElement || document.body.parentNode || document.body).scrollLeft
  }
}
