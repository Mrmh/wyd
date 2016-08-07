'use strict';
var gulp = require('gulp');
var minifycss = require('gulp-cssnano');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var livereload = require('gulp-livereload');
var webpack = require("webpack");
var uglify = require("gulp-uglify");
var rimraf = require('rimraf');
var rename = require('gulp-rename');
var concat  = require('gulp-concat');
var clean = require('gulp-clean');
var minifyImage = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');
var minifyHTML = require('gulp-minify-html');
var plumber = require('gulp-plumber');
var usemin = require('gulp-usemin');
var jscs = require('gulp-jscs');
var tinylr = require('tiny-lr');
var copyDir = require('copy-dir');
var fs = require('fs');

/*===========================测试环境=============================*/

//资源路径
var paths = {

    cssSrc :[
        './src/scss/**/*.scss'
    ],
    htmlSrc :[
          './src/html/**/*.html'
    ],
    jsSrc:[
        './src/js/**/*.js'
    ],
    release:{
        images :[
            './src/img/**/*.*'
        ]
    },
    build  : './build',
    output : './dist',
    deploy : '../webapp/assets',
    backup : './backup'
}

//测试环境build 样式处理
gulp.task('sass',function(){
    gulp.src('./src/scss/**/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({
            loadPath: 'src/scss/'
        }))
        .pipe(autoprefixer({
            browsers:['last 2 version','android 4'],
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

//测试环境build 脚本处理
gulp.task('js', function () {
    gulp.src('./src/js/**/*.*')
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(gulp.dest('./build/js'));
});

//测试环境build HTML 处理
gulp.task('minify-html', function () {
    gulp.src('./src/html/**/*.html') // 要压缩的html文件
        .pipe(livereload())
        .pipe(gulp.dest('./build/html'));
});

//测试环境build 图片处理
gulp.task('minify-image', function () {
    gulp.src('./src/img/**/*.*') // 要压缩的html文件
        .pipe(gulp.dest('./build/img/'));
});

//拷贝第三方库
gulp.task('plugins', function () {
    gulp.src('./src/plugins/**/*.*')
        .pipe(gulp.dest('./build/plugins/'));
});



/*=========================发布环境==========================*/

// 发布环境dist 样式处理
gulp.task('dist-styles',function(){
    gulp.src(paths.cssSrc)
        .pipe(plumber())
        .pipe(sass({
            loadPath: 'src/scss/'
        }))
        .pipe(autoprefixer({
            browsers:['last 2 version','android 4'],
            cascade: true,
            remove:true
        }))
        .pipe(minifycss({
            compatibility: 'ie8'
        }))
        .pipe(gulp.dest(paths.output+'/css'))
        .pipe(livereload());
});

// 发布环境DIST HTML处理

gulp.task('dist-htmls',function(){
    gulp.src(paths.htmlSrc)
        .pipe(minifyHTML())
        .pipe(gulp.dest(paths.output + '/html'))
});

// 发布环境DIST 脚本处理
gulp.task('dist-js', function () {
    gulp.src(paths.jsSrc)
        .pipe(gulp.dest(paths.output + '/js'));
});

// 发布环境DIST 图片处理

gulp.task('dist-images', function () {
    gulp.src(paths.release.images)
        .pipe(gulp.dest(paths.output + '/img'));
});

gulp.task('dist-plugins', function () {
    gulp.src('./src/plugins/**/*.*')
        .pipe(gulp.dest('./dist/plugins/'));
});


//后期管理
/* 下面的结构真**复杂*/
// 清理dist目录
gulp.task('clean', function () {
    return gulp.src(['./dist'], {read: false}).pipe(clean());
});

//DIST可以直接发布
gulp.task('dist', function () {

    gulp.src('./src/plugins/**/*.*')
        .pipe(gulp.dest('./dist/plugins/'));

    gulp.src(paths.release.images)
        .pipe(gulp.dest(paths.output + '/img'));

    gulp.src(paths.jsSrc)
        .pipe(gulp.dest(paths.output + '/js'));

    gulp.src(paths.htmlSrc)
        .pipe(minifyHTML())
        .pipe(gulp.dest(paths.output + '/html'))

    gulp.src(paths.cssSrc)
        .pipe(plumber())
        .pipe(sass({
            loadPath: 'src/scss/'
        }))
        .pipe(autoprefixer({
            browsers:['last 2 version','Android >= 4.0'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove: true //是否去掉不必要的前缀 默认：true
        }))
        .pipe(minifycss({
            compatibility: 'ie8'
        }))
        .pipe(gulp.dest(paths.output+'/css'))

    gulp.src('').pipe(livereload());

});

//默认任务
gulp.task('default', ['sass','js','minify-html','minify-image','plugins','dist'], function () {
        gulp.src('').pipe(livereload());
});

//监听任务
gulp.task('watch', ['default'], function () {
    
	livereload.listen();
	gulp.watch('./src/**/*.*', ['default','deploy']);

});

/*======================================================================*/
/*
 增加功能:版本备份
 只备份当天第一次发布时的备份，也就是说备份是之前的，
 今天不论发布多少次不会在备份，保证备份是上个版本的可用版本；
 备份文件只保留最多3个不同日期的备份。
 */

//自动备份build目录到backup目录
gulp.task('auto-backup', function () {
    var date = new Date(),
        dirName = date.toISOString().split('T')[0].replace(/[\D]/g, ''),
        reg = /^\d+$/g,
        build = './build';
    dirName = paths.backup + '/' + dirName;

    fs.exists(build, function (exists) {
        if (exists) {
            //备份目录是否存在
            fs.exists(dirName, function (exist) {
                if (!exist) {
                    backup();
                }
            });
        }
    });
    function backup() {
        fs.readdir('./backup', function (err, data) {
            var dirs = [], l;
            if (data && data.length > 0) {
                for (var i = 0, j = data.length; i < j; i++) {
                    if (data[i].match(reg)) {
                        dirs.push(data[i]);
                    }
                }
                //只保留当天发布的前三个版本
                if (dirs.length > 2) {
                    for (i = 0, l = dirs.length; i < l - 1; i++) {
                        rimraf.sync('./backup/' + dirs[i]);
                    }
                }
                rimraf.sync(dirName);
            }
            copyDir.sync(build, dirName);
        });
    }
});

/*========================================================*/
//测试环境 输出到=>  ./build
//deploy  输出到=> ../webapp/assets/(css/js/html/...)

gulp.task('cleanDeploy', function () {
    return gulp.src(['./dist'], {read: false}).pipe(clean());
});

gulp.task('deploy', function () {

    //第三方库
    gulp.src('./dist/plugins/**/*.*')
        .pipe(gulp.dest('../webapp/assets/plugins/'));

    //CSS
    gulp.src('./dist/css/**/*.css')
        .pipe(minifycss())
        .pipe(gulp.dest('../webapp/assets/css/'))

    //JS
    gulp.src('./dist/js/**/*.js')
        .pipe(gulp.dest('../webapp/assets/js/'))

    //image
    gulp.src('./dist/img/**/*.*')
        .pipe(minifyImage())
        .pipe(gulp.dest('../webapp/assets/img/'));

});



