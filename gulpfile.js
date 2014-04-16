// Include gulp
var gulp = require("gulp")
  , gutil = require("gulp-util")
  , path = require("path")
  , concat = require("gulp-concat")
  , livereload = require("gulp-livereload")
  , notify = require("gulp-notify")
  , rename = require("gulp-rename")
  , uglify = require("gulp-uglify")
  , express = require("express")
  , lr = require("tiny-lr")()

var files = [ "src/begin.js"
            , "src/general.js"
            , "src/console.js"
            , "src/forms.js"
            , "src/viz.js"
            , "src/**/*.js"
            , "src/end.js" ]

var tests = [ "tests/*.*", "tests/**/*.*" ]

// Concatenate & Minify JS
gulp.task("make", function() {

  return gulp.src(files)
    .pipe(concat("d3plus.js"))
    .pipe(gulp.dest("./"))
    .pipe(rename("d3plus.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("./"))
    .pipe(notify({
      title: "D3plus",
      message: "New Build Compiled"
    }))
    .pipe(livereload(lr))

})

var createServers = function(port, lrport) {

  lr.listen(lrport, function() {
    gutil.log('LR Listening on', lrport);
  });

  var app = express();
  app.use(require('connect-livereload')())
  app.use(express.static(__dirname));
  app.listen(port, function() {
    gutil.log('Express Listening on', port);
  });

  return {
    lr: lr,
    app: app
  };

};

var servers = createServers(4000, 35729);

// Watch Files For Changes
gulp.task("watch", function() {

  gulp.watch(files, ["make"])

  gulp.watch(tests, function(evt) {

    var fileName = path.relative(__dirname,evt.path)
    gutil.log(gutil.colors.cyan(fileName), 'changed')

    gulp.src(evt.path, {read: false})
      .pipe(livereload(lr))

  })

})

// Default Task
gulp.task("default", ["make","watch"])
