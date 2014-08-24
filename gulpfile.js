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
  , rimraf = require("gulp-rimraf")
  , yuidoc = require("gulp-yuidoc")

var files = "./src/**/*.*"

var tests = [ "tests/**/*.*" ]

var error = {
  title: "D3plus",
  subtitle: "Build Error",
  message: "<%= error.message %>",
  icon: __dirname + "/icon.png"
}

var documentation = function() {

  gulp.src("./docs/files/*.*", {read: false})
    .pipe(rimraf())

  gulp.src(files)
    .pipe(yuidoc({"syntaxtype": "js"}))
    .pipe(gulp.dest("./docs"))

  gulp.src(files)
    .pipe(yuidoc({"syntaxtype": "coffee"}))
    .pipe(gulp.dest("./docs"))

}

gulp.task("server", function() {

  var port = 4000
    , lrport = 35728

  // lr.listen(lrport, function() {
  //   gutil.log('LR Listening on', lrport);
  // });

  var app = express();
  app.use(require('connect-livereload')())
  app.use(express.static(__dirname));
  app.listen(port);

})

// Concatenate & Minify JS
gulp.task("make", function() {

  var fileList = glob.sync(files,{nosort: true});

  var bundler = browserify({entries: fileList, cache: {}, packageCache: {}, fullPaths: true})
    .ignore("./src/libs.js")
    .transform("coffeeify")

  bundler = watchify(bundler)

  var rebundle = function() {

    return bundler.bundle()
      .on("error",notify.onError(error))
      .pipe(plumber())
      .pipe(source("d3plus.js"))
      .pipe(gulp.dest("./"))
      .pipe(timer("Total Build Time"))
      .pipe(notify({
        title: "D3plus",
        message: "New Build Compiled",
        icon: __dirname + "/icon.png"
      }))
      .pipe(livereload(lr))
      .on("error",notify.onError(error))
      // .once("end",documentation);
      // .once("end",process.exit)

  }

  bundler.on("update",rebundle)

  return rebundle();

})

// Watch Files For Changes
gulp.task("watch", function() {

  gulp.watch(tests, function(evt) {

    var fileName = path.relative(__dirname,evt.path)
    gutil.log(gutil.colors.cyan(fileName), 'changed')

    gulp.src(evt.path, {read: false})
      .pipe(livereload(lr))

  })

})

// Task to build files for release
gulp.task("build", function(){

  var fileList = glob.sync(files,{nosort: true});

  var normal = browserify(fileList)
    .ignore("./src/libs.js")
    .transform("coffeeify")
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
      message: "Production Builds Compiled",
      icon: __dirname + "/icon.png"
    }))
    .on("error",notify.onError(error));

  return es.merge(normal,full)
    .once("end",function(){
        documentation();
        process.exit();
      });

})

// Default Task
// gulp.task("default",["make"])
gulp.task("default", ["server","make","watch"])
