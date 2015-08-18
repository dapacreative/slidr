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
	sprite: {
		src: basePaths.src + 'svg/*',
		svg: 'img/sprite.svg',
		css: '../' + basePaths.src + 'scss/helpers/_sprite.scss'
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
    minifycss = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload'),
    svgSprites = require('gulp-svg-sprites'),
    svg2png = require('gulp-svg2png'),
    svgo = require('gulp-svgo');

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
        .pipe(minifycss())
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

// Create SVG Sprites
gulp.task('svgSprite', function () {

	return gulp.src(paths.sprite.src)
		.pipe(svgo())
		.pipe(svgSprites({
			cssFile: paths.sprite.css,
			preview: false,
			layout: 'horizontal',
			padding: 5,
			svg: {
				sprite: paths.sprite.svg
			},
			templates: {
				css: require("fs").readFileSync(paths.templates.src + 'sprite-template.scss', "utf-8")
			}
		}))
		.pipe(gulp.dest(basePaths.dest));

});

// Create PNG from SVG
gulp.task('pngSprite', ['svgSprite'], function() {
	return gulp.src(basePaths.dest + paths.sprite.svg)
		.pipe(svg2png())
		.pipe(gulp.dest(paths.images.dest));
});

gulp.task('svg2png', function() {
	return gulp.src('assets/img/*.svg')
		.pipe(svg2png())
		.pipe(gulp.dest(paths.images.dest));
});

// Combine SVG and PNG tasks
gulp.task('sprite', ['pngSprite']);

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