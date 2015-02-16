var gulp = require("gulp");
require('coffee-script/register');
require("require-dir")("./gulp");

gulp.task("default", ["dev"]);

gulp.task("release", ["compile", "docs"], function() { process.exit(); });
