// get the dependencies
var gulp        = require('gulp'),
  childProcess  = require('child_process'),
  electron      = require('electron-prebuilt'),
  sass			= require('gulp-sass'),
  sourcemaps	= require('gulp-sourcemaps'),
  livereload	= require('gulp-livereload')
 ;


// create the gulp task
gulp.task('run', ['styles'], function () {
	childProcess.spawn(electron, ['.'], { stdio: 'inherit' });
});

gulp.task('watch', function() {
	livereload.listen();
	gulp.watch('./assets/sass/*.scss', ['styles']);
	gulp.watch('./assets/js/*.js', ['scripts']);
	gulp.watch('./*.html', ['html']);

});

gulp.task('scripts', function() {
	return gulp.src('./assets/js/*.js')
		.pipe(livereload());
});

gulp.task('html', function() {
	return gulp.src('./*.html')
		.pipe(livereload());
});

gulp.task('styles', function() {
	return gulp.src('./assets/sass/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./assets/css'))
		.pipe(livereload());
});


gulp.task('default', ['run', 'watch']);