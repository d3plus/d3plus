// Include gulp
var gulp = require("gulp"),
    gutil      = require("gulp-util"),
    path       = require("path"),
    livereload = require("gulp-livereload"),
    notify     = require("gulp-notify"),
    rename     = require("gulp-rename"),
    uglify     = require("gulp-uglify"),
    glob       = require("glob"),
    express    = require("express"),
    source     = require("vinyl-source-stream"),
    lr         = require("tiny-lr")(),
    browserify = require("browserify"),
    watchify   = require("watchify"),
    streamify  = require('gulp-streamify'),
    es         = require('event-stream'),
    timer      = require("gulp-duration"),
    rimraf     = require("gulp-rimraf"),
    yuidoc     = require("gulp-yuidoc"),
    project    = require("./package.json")

var files = "./src/**/*.*"

var tests = [ "tests/**/*.*" ]

var error = {
  title: "D3plus",
  subtitle: "Build Error",
  message: "Error: <%= error.message %>",
  icon: __dirname + "/icon.png"
}

gulp.task("default", ["server","make","watch"])

gulp.task("server", function() {

  var port = 4000
    , lrport = 35728

  var app = express();
  app.use(require('connect-livereload')({
    hostname: "0.0.0.0"
  }))
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

gulp.task("release",["builds","docs"], function() {
  process.exit();
})

// Task to build files for release
gulp.task("builds", function(){

  var fileList = glob.sync(files,{nosort: true});

  var normal = browserify(fileList)
    .ignore("./src/libs.js")
    .transform("coffeeify")
    .bundle()
    .on("error",notify.onError(error))
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

})

gulp.task("docs", function() {

  gulp.src("./docs/files/*.*", {read: false})
    .pipe(rimraf())

  gulp.src(files)
    .pipe(yuidoc({"project": project, "syntaxtype": "js"}))
    .pipe(gulp.dest("./docs"))

  gulp.src(files)
    .pipe(yuidoc({"project": project, "syntaxtype": "coffee"}))
    .pipe(gulp.dest("./docs"))

})
