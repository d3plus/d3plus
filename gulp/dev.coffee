browserify = require "browserify"
connect    = require "gulp-connect"
error      = require "./error.coffee"
gulp       = require "gulp"
gutil      = require "gulp-util"
notify     = require "gulp-notify"
path       = require "path"
source     = require "vinyl-source-stream"
timer      = require "gulp-duration"
watchify   = require "watchify"

test_dir = "./tests/**/*.*"

gulp.task "server", ->
  connect.server
    livereload: true
    port: 4000
    root: path.resolve("./")

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

bundler = watchify(browserify(watchify.args))
  .add "./src/init.coffee"
  .on "update", rebundle

gulp.task "dev", ->

  rebundle()

  gulp.watch [test_dir], (file) ->

    fileName = path.relative("./", file.path)
    gutil.log gutil.colors.cyan(fileName), "changed"

    gulp.src(test_dir).pipe connect.reload()
