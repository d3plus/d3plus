# Detects right-to-left text direction on the page.
module.exports = d3.select("html").attr("dir") is "rtl"
