gulp    = require "gulp"
project = require "../package.json"
rimraf  = require "gulp-rimraf"
yuidoc  = require "gulp-yuidoc"

gulp.task "docs", ->

  gulp.src("./docs/files/*.*", {read: false}).pipe rimraf()

  scan "js"
  scan "coffee"

scan = (type) ->
  gulp.src("./src/**/*."+type).pipe(yuidoc(
      project: project
      syntaxtype: type
    ))
    .pipe gulp.dest("./docs")
