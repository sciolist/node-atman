var gulp = require('gulp');
var less = require('gulp-less');

gulp.task('styles', function() {
  gulp.src(['static/css/index.less'])
      .pipe(less({}))
      .pipe(gulp.dest('static/css/'));
});

gulp.task('default', ['styles'], function() {  
  gulp.watch('static/css/**/*.less', function(event) {
    gulp.run('styles');
  });
});

