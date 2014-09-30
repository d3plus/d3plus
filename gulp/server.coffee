express    = require "express"
gulp       = require "gulp"
gutil      = require "gulp-util"
livereload = require "gulp-livereload"
lr         = require("tiny-lr")()
path       = require "path"

gulp.task "server", ->

  app = express()
  app.use require("connect-livereload")(hostname: "0.0.0.0")
  app.use express.static("./")
  app.listen 4000

  gulp.watch ["./tests/**/*.*"], (evt) ->

    fileName = path.relative("./", evt.path)
    gutil.log gutil.colors.cyan(fileName), "changed"
    gulp.src(evt.path, read: false).pipe livereload(lr)
