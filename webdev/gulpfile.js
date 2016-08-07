var gulp = require('gulp');
var minifycss = require('gulp-cssnano');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var livereload = require('gulp-livereload');
var webpack = require("webpack");
var uglify = require("gulp-uglify");
var concat = require('gulp-concat');
var minifyImage = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');
var minifyHTML = require('gulp-minify-html');
var plumber = require('gulp-plumber');

gulp.task('sass',function(){
    gulp.src('./src/scss/**/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({
            loadPath: 'src/scss/'
        }))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: true,
            remove:true
        }))
        .pipe(minifycss({
            compatibility: 'ie8'
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build/css'))
        .pipe(livereload());
});


gulp.task('js', function () {
    gulp.src('./src/js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(plumber())
        //.pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/js'));
});

gulp.task('minify-html', function () {
    gulp.src('./src/html/*.html') // 要压缩的html文件
         .pipe(minifyHTML())
        .pipe(gulp.dest('./build/html'));
});

gulp.task('minify-image', function () {
    gulp.src('./src/img/*.*') // 要压缩的html文件
      //.pipe(minifyImage())
        .pipe(gulp.dest('./build/img/'));
});

gulp.task('default', ['sass','js','minify-html','minify-image'], function () {
        gulp.src('').pipe(livereload());
});


gulp.task('watch', ['default'], function () {
    livereload.listen(); //要在这里调用listen()方法
    gulp.watch('./src/**/*.*', ['default']);
});




//测试环境 输出到=>  ./build
//deploy  输出到=> ../webapp/assets/(css/js/html/...)


gulp.task('deploy', function () {


    //CSS
    gulp.src('./build/css/**/*.css')
        .pipe(minifycss())
        .pipe(gulp.dest('../webapp/assets/css/'))

    //JS
    gulp.src('./build/js/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('../webapp/assets/js/'))

    //image
    gulp.src('./build/img/**/*.*')
        .pipe(minifyImage())
        .pipe(gulp.dest('../webapp/assets/img/'));

});




