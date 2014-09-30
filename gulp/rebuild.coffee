browserify = require "browserify"
error      = require "./error.coffee"
gulp       = require "gulp"
livereload = require "gulp-livereload"
lr         = require("tiny-lr")()
notify     = require "gulp-notify"
source     = require "vinyl-source-stream"
timer      = require "gulp-duration"
watchify   = require "watchify"

gulp.task "rebuild", ->

  # fileList = glob.sync files, {nosort: true}

  bundler = browserify watchify.args
    .add "./src/init.coffee"
    .transform "coffeeify"

  bundler = watchify(bundler)

  rebundle = ->
    bundler.bundle()
    .on("error", notify.onError(error))
    .pipe(source("d3plus.js"))
    .pipe(gulp.dest("./"))
    .pipe(timer("Total Build Time"))
    .pipe(notify(
      title:   "D3plus"
      message: "New Build Compiled"
      icon:    __dirname + "/../icon.png"
    ))
    .pipe(livereload(lr))
    .on "error", notify.onError(error)

  bundler.on "update", rebundle

  rebundle()
