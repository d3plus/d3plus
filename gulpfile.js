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
  , plumber = require("gulp-plumber")

var files = "./src/**/*.*"

var tests = [ "tests/**/*.*" ]

// Concatenate & Minify JS
gulp.task("make", function() {

  var fileList = glob.sync(files,{nosort: true});

  var bundler = watchify(fileList).transform("coffeeify");

  var rebundle = function() {

    var normal = bundler
      .ignore("./src/libs.js")
      .bundle()
      .pipe(plumber())
      .pipe(source("d3plus.js"))
      .pipe(gulp.dest("./"))
      .pipe(rename("d3plus.min.js"))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest("./"));

    var full = browserify(fileList)
      .transform("coffeeify")
      .bundle()
      .pipe(source("d3plus.full.js"))
      .pipe(gulp.dest("./"))
      .pipe(rename("d3plus.full.min.js"))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest("./"))
      .pipe(timer("Total Build Time"))
      .pipe(notify({
        title: "D3plus",
        message: "New Build Compiled",
        icon: __dirname + "/icon.png"
      }))
      .pipe(livereload(lr));

    return es.merge(normal,full);

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

  gulp.watch("gulpfile.js",["make"])

  gulp.watch(tests, function(evt) {

    var fileName = path.relative(__dirname,evt.path)
    gutil.log(gutil.colors.cyan(fileName), 'changed')

    gulp.src(evt.path, {read: false})
      .pipe(livereload(lr))

  })

})

// Default Task
gulp.task("default", ["make","watch"])
