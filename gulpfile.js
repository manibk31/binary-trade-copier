var gulp=require("gulp");

var mainBowerFiles = require('main-bower-files');

gulp.task('3rdpartybundle', function(){  
  gulp.src(mainBowerFiles())
  .pipe(uglify())
  .pipe(concat('all.min.js'))
  .pipe(gulp.dest('./Scripts/'));
});