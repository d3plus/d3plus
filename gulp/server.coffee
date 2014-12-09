connect = require "gulp-connect"
gulp    = require "gulp"
gutil   = require "gulp-util"
path    = require "path"

test_dir = "./tests/**/*.*"

gulp.task "server", ->

  connect.server
    livereload: true
    port: 4000
    root: "./"

  gulp.watch [test_dir], (file) ->

    fileName = path.relative("./", file.path)
    gutil.log gutil.colors.cyan(fileName), "changed"

    gulp.src(test_dir).pipe connect.reload()
