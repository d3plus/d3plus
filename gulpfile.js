var gulp = require("gulp");
require('coffee-script/register');
require("require-dir")("./gulp");

gulp.task("default", ["server", "dev"]);

gulp.task("release", ["compile"], function() { process.exit(); });
