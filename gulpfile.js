// Include gulp
var gulp = require("gulp")
  , gutil = require("gulp-util")
  , path = require("path")
  , livereload = require("gulp-livereload")
  , notify = require("gulp-notify")
  , rename = require("gulp-rename")
  , uglify = require("gulp-uglify")
  , glob = require("glob")
  , express = require("express")
  , source = require("vinyl-source-stream")
  , lr = require("tiny-lr")()
  , browserify = require("browserify")
  , watchify = require("watchify")
  , streamify = require('gulp-streamify')
  , es = require('event-stream')
  , timer = require("gulp-duration")

var files = "./src/**/*.*"

var tests = [ "tests/**/*.*" ]

// Concatenate & Minify JS
gulp.task("make", function() {

  var fileList = glob.sync(files,{nosort: true});

  var bundler = watchify(fileList).transform("coffeeify");

  var rebundle = function() {

    var bundle = bundler
      .ignore("./src/libs.js")
      .bundle();

    var normal = bundle
      .pipe(source("d3plus.js"))
      .pipe(timer("Build Time"))
      .pipe(gulp.dest("./"));

    var min = bundle
      .pipe(source("d3plus.min.js"))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest("./"));

    var bundle = browserify(fileList)
      .transform("coffeeify")
      .bundle();

    var full = bundle
      .pipe(source("d3plus.full.js"))
      .pipe(gulp.dest("./"));

    var fullmin = bundle
      .pipe(source("d3plus.full.min.js"))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest("./"))
      .pipe(notify({
        title: "D3plus",
        message: "New Build Compiled"
      }))
      .pipe(livereload(lr));

    return es.merge(normal,min,full,fullmin);

  }

  bundler.on("update",rebundle)

  return rebundle();

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

  gulp.watch(tests, function(evt) {

    var fileName = path.relative(__dirname,evt.path)
    gutil.log(gutil.colors.cyan(fileName), 'changed')

    gulp.src(evt.path, {read: false})
      .pipe(livereload(lr))

  })

})

// Default Task
gulp.task("default", ["make","watch"])
