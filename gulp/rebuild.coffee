browserify = require "browserify"
connect    = require "gulp-connect"
error      = require "./error.coffee"
gulp       = require "gulp"
notify     = require "gulp-notify"
source     = require "vinyl-source-stream"
timer      = require "gulp-duration"
watchify   = require "watchify"

gulp.task "rebuild", ->

  bundler = watchify(browserify watchify.args)
    .add "./src/init.coffee"
    .transform "coffeeify"

  rebundle = ->
    bundler.bundle()
    .on "error", notify.onError(error)
    .pipe source("d3plus.js")
    .pipe gulp.dest("./")
    .pipe timer("Total Build Time")
    .pipe(notify(
      title:   "D3plus"
      message: "New Build Compiled"
      icon:    __dirname + "/../icon.png"
    ))
    .pipe connect.reload()
    .on "error", notify.onError(error)

  bundler.on "update", rebundle

  rebundle()
