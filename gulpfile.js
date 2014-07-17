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

var error = {
  title: "D3plus",
  subtitle: "Build Error",
  message: "<%= error.message %>",
  icon: __dirname + "/icon.png"
}

// Concatenate & Minify JS
gulp.task("make", function() {

  var fileList = glob.sync(files,{nosort: true});

  var bundler = watchify({entries: fileList, debug: true})
    .transform("coffeeify");

  var rebundle = function() {

    // return bundler
    //   .ignore("./src/libs.js")
    //   .bundle()
    //   .on("error",notify.onError(error))
    //   .pipe(plumber())
    //   .pipe(source("d3plus.js"))
    //   .pipe(gulp.dest("./"))
    //   .pipe(timer("Total Build Time"))
    //   .pipe(notify({
    //     title: "D3plus",
    //     message: "New Build Compiled",
    //     icon: __dirname + "/icon.png"
    //   }))
    //   .pipe(livereload(lr))
    //   .on("error",notify.onError(error));

    var normal = bundler
      .ignore("./src/libs.js")
      .bundle()
      .on("error",notify.onError(error))
      .pipe(plumber())
      .pipe(source("d3plus.js"))
      .pipe(gulp.dest("./"))
      .pipe(rename("d3plus.min.js"))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest("./"))
      .on("error",notify.onError(error));

    var full = browserify(fileList)
      .transform("coffeeify")
      .bundle()
      .on("error",notify.onError(error))
      .pipe(plumber())
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
      .pipe(livereload(lr))
      .on("error",notify.onError(error));

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

  gulp.watch(tests, function(evt) {

    var fileName = path.relative(__dirname,evt.path)
    gutil.log(gutil.colors.cyan(fileName), 'changed')

    gulp.src(evt.path, {read: false})
      .pipe(livereload(lr))

  })

})

// Default Task
gulp.task("default", ["make","watch"])
