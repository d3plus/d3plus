browserify = require "browserify"
error      = require "./error.coffee"
es         = require "event-stream"
gulp       = require "gulp"
notify     = require "gulp-notify"
rename     = require "gulp-rename"
source     = require "vinyl-source-stream"
streamify  = require "gulp-streamify"
timer      = require "gulp-duration"
uglify     = require "gulp-uglify"
chmod      = require "gulp-chmod"

gulp.task "compile", ->

  normal = browserify ["./src/init.coffee"]
    .bundle()
    .on "error", notify.onError(error)
    .pipe source("d3plus.js")
    .pipe chmod(644)
    .pipe gulp.dest("./")
    .pipe rename("d3plus.min.js")
    .pipe streamify(uglify())
    .pipe chmod(644)
    .pipe gulp.dest("./")
    .on "error", notify.onError(error)

  full = browserify ["./src/libs.coffee", "./src/init.coffee"]
    .bundle()
    .on "error", notify.onError(error)
    .pipe source("d3plus.full.js")
    .pipe chmod(644)
    .pipe gulp.dest("./")
    .pipe rename("d3plus.full.min.js")
    .pipe streamify(uglify())
    .pipe chmod(644)
    .pipe gulp.dest("./")
    .pipe timer("Total Build Time")
    .pipe(notify(
      title: "D3plus"
      message: "Production Builds Compiled"
      icon: __dirname + "/../icon.png"
    ))
    .on "error", notify.onError(error)

  es.merge normal, full
