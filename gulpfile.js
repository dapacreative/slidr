var basePaths = {
	src: '_src/',
	dest: 'assets/',
};

var paths = {
	images: {
		src: basePaths.src + 'img/',
		dest: basePaths.dest + 'img/'
	},
	js: {
		src: basePaths.src + 'js/',
		dest: basePaths.dest + 'js/'
	},
	css: {
		src: basePaths.src + 'scss/',
		dest: basePaths.dest + 'css/'
	},
	templates: {
		src: basePaths.src + 'tpl/'
	}
};

// Include gulp
var gulp = require('gulp'); 

// Include Our Plugins
var jshint = require('gulp-jshint'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cleanCSS = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('_src/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass
gulp.task('sass', function() {
    return gulp.src('_src/scss/site.scss')
        .pipe(sass({style: 'compact'}))
        .pipe(autoprefixer('last 2 version', 'ie 9', 'ie 8'))
        .pipe(gulp.dest('./assets/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(cleanCSS({compatibility: 'ie9'}))
        .pipe(gulp.dest('./assets/css'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src(['_src/js/plugins/*.js','_src/js/modules/*.js','_src/js/*.js']) 
        .pipe(concat('site.js'))
        .pipe(gulp.dest('./assets/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./assets/js'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch([
      '_src/js/*.js',
      '_src/js/plugins/*.js',
      '_src/js/modules/*.js'
    ], ['lint', 'scripts']);
    gulp.watch([
      '_src/scss/*.scss',
      '_src/scss/base/*.scss',
      '_src/scss/helpers/*.scss',
      '_src/scss/layout/*.scss',
      '_src/scss/modules/*.scss',
      '_src/scss/templates/*.scss'
    ], ['sass']);
    
    // Create LiveReload server
    livereload.listen();
    
    // Watch any files in dist/, reload on change
    gulp.watch(['assets/**']).on('change', livereload.changed);
});

// Default Task
gulp.task('default', ['lint', 'sass', 'scripts', 'watch']);