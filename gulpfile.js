/* jshint node:true */
var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    connect = require('gulp-connect'),
    ghpages = require('gulp-gh-pages'),
    bump = require('gulp-bump'),
    concat = require('gulp-concat');

var paths = {
  'main': 'src/element.html',
  'scripts': 'src/*.js',
  'src': 'src/*',
  'index': 'index.html',
  'test': 'test/*',
  'bowerComponents': 'bower_components/**/*'
};


gulp.task('lint', function() {
  gulp.src(paths.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('connect', function() {
  connect.server({
    port: 3001
  });
});

gulp.task('watch', function () {
  gulp.watch(paths.scripts, ['lint']);
});


// do a build, start a server, watch for changes
gulp.task('server', ['lint','connect','watch']);


// Bum up the Version (patch)
gulp.task('bump', function(){
  console.log(arguments);
  gulp.src(['bower.json','package.json'])
  .pipe(bump())
  .pipe(gulp.dest('./'));
});


// publish to gh pages
gulp.task('deploy', function () {
  gulp.src([
    paths.index,
    paths.src,
    paths.test,
    paths.bowerComponents,
  ],{base:'./'})
    .pipe(ghpages());
});