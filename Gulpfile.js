require('babel/register');
var gulp = require('gulp'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    isparta = require('isparta'),
    del = require('del'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    $ = require('gulp-load-plugins')(),
    pkg = require('./package.json');

gulp.task('eslint', function () {
    return gulp
        .src(['./src/**/*.js'])
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.eslint.failOnError());
});

gulp.task('clean',['eslint'], function (done) {
    del(['build/**'], done);
});

gulp.task('compile', ['clean'], function() {
    return browserify({
        entries: './src/Index.js',
        debug: true,
        transform: babelify
    })
        .exclude('ws')
        .bundle()
        .pipe(source('myojs-' + pkg.version + '.js'))
        .pipe(buffer())
        /*.pipe($.uglify({
            mangle: false
        }))*/
        .pipe(gulp.dest('./build'));
});

gulp.task('test', ['compile'], function () {
    gulp
        .src(['./test/**/*.spec.js'], {read:false})
        .pipe($.mocha({
            compilers: require('babel/register'),
            reporter: 'spec'
        }));
});

gulp.task('default', ['eslint', 'clean', 'compile']);