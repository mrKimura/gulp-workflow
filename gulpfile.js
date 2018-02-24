'use strict';


//Requirements
const
    gulp = require('gulp'),
    browsersync = require('browser-sync').create(),
    fs = require('file-system'),
    notify = require('gulp-notify'),
    util = require('gulp-util'),
    gulpIf = require('gulp-if'),
    path = require('path'),
    data = require('gulp-data'),
    plumber = require('gulp-plumber'),
    newer = require('gulp-newer'),
    changed = require('gulp-changed'),
    render = require('gulp-nunjucks-render'),
    prettify = require('gulp-html-prettify'),
    htmlclean = require('gulp-htmlclean'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('autoprefixer'),
    mqpacker = require('css-mqpacker'),
    cssnano = require('cssnano'),
    svginline = require('postcss-inline-svg'),
    svgo = require('postcss-svgo');

//Directories here
const
    pathSrc = './src/',
    pathBuild = './build/',

    imgTypes = '(jpg|png|svg|jpeg|gif|ico)',
    fntTypes = '(woff|woff2|ttf|eot|otf)',

    pathBase = {
        sass: pathSrc + 'scss/',
        data: pathSrc + '_data/',
        njk: pathSrc + 'njk/',
        imgSrc: pathSrc + 'img/',
        imgBuild: pathBuild + 'img/',
        fntSrc: pathSrc + 'fonts/',
        fntBuild: pathBuild + 'fonts/',
        cssSrc: pathSrc + 'css/',
        css: pathBuild + 'css/',
        jsSrc: pathSrc + 'js/',
        jsBuild: pathBuild + 'js/'
    },

    pathFull = {
        njk: {
            pages: pathBase.njk + 'pages/**/*.+(njk)',
            watchedFiles: pathBase.njk + '**/*.+(njk)',
            templatesBaseDir: pathBase.njk + 'templates/',
            templateExtras: pathBase.njk + 'templates/' + '**/*.+(njk)'
        },
        sass: {
            fullPath: pathBase.sass + '**/*.+(scss)',
            extras: pathBase.sass + 'includes/' + '**/*.+(scss)'
        },
        data: {
            path: pathBase.data + '**/*.+(json)'
        },
        img: {
            path: pathBase.imgSrc + '**/*.+' + imgTypes
        },
        js: {
            path: pathBase.jsSrc + '**/*.+(js)'
        },
        css: {
            path: pathBase.cssSrc + '**/*.+(css)'
        },
        fonts: {
            path: pathBase.fntSrc + '**/*.+' + fntTypes
        }
    };

const
    postCSSpluginsForProd = [
        autoprefixer(),
        mqpacker({
            sort: true
        }),
        svginline({
            removeFill: true
        }),
        cssnano({
            preset: 'default'
        })
    ],
    postCSSpluginsForWatch = [
        autoprefixer(),
        svginline({
            removeFill: true
        })
        // svgo()
    ];


gulp.task('default', ['nunjucks-dev', 'scss-dev', 'img-dev', 'js-dev', 'fnt-dev', 'css-dev', 'serve']);
gulp.task('prod', ['nunjucks-build', 'scss-build', 'img-build', 'js-build', 'fnt-build', 'css-build']);


//Tasks


//------------- html

gulp.task('nunjucks-dev', () => {
    return gulp
        .src(pathFull.njk.pages)
        .pipe(data((file) => {
            const dataFile = pathBase.data + path.basename(file.path, '.njk') + '.json';
            return (fs.existsSync(dataFile)) ? JSON.parse(fs.readFileSync(dataFile)) : {};
        }))
        .pipe(plumber())
        .pipe(newer({dest: pathBuild, ext: '.html', extra: [pathFull.njk.templateExtras, pathFull.data.path]}))
        .pipe(render({
            path: [pathFull.njk.templatesBaseDir]
        }))
        .on("error", notify.onError((error) => error.message))
        .pipe(htmlclean())
        .pipe(prettify({
            indent_size: 2
        }))
        .pipe(gulp.dest(pathBuild))
        .pipe(browsersync.reload({stream: true}))
});

gulp.task('nunjucks-build', () => {
    return gulp
        .src(pathFull.njk.pages)
        .pipe(data((file) => {
            const dataFile = pathBase.data + path.basename(file.path, '.njk') + '.json';
            return (fs.existsSync(dataFile)) ? JSON.parse(fs.readFileSync(dataFile)) : {};
        }))
        .pipe(plumber())
        .pipe(newer({dest: pathBuild, ext: '.html', extra: [pathFull.njk.templateExtras, pathFull.data.path]}))
        .pipe(render({
            path: [pathFull.njk.templatesBaseDir]
        }))
        .on("error", notify.onError((error) => error.message))
        .pipe(htmlclean())
        .pipe(gulp.dest(pathBuild))
        .pipe(browsersync.reload({stream: true}))
});


//------------- css

gulp.task('scss-dev', () => {
    return gulp
        .src(pathFull.sass.fullPath)
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(newer({dest: pathBase.css, ext: '.css', extra: pathFull.sass.extras}))
        .pipe(sass())
        .on("error", notify.onError((error) => error.message))
        .pipe(postcss(postCSSpluginsForWatch))
        .pipe(sourcemaps.write('/'))
        .pipe(gulp.dest(pathBase.css))
        .pipe(browsersync.reload({stream: true}))
});

gulp.task('scss-build', () => {
    return gulp
        .src(pathFull.sass.fullPath)
        .pipe(plumber())
        .pipe(newer({dest: pathBase.css, ext: '.css', extra: pathFull.sass.extras}))
        .pipe(sass())
        .on("error", notify.onError((error) => error.message))
        .pipe(postcss(postCSSpluginsForProd))
        .pipe(gulp.dest(pathBase.css))
        .pipe(browsersync.reload({stream: true}))
});


//------------- server

gulp.task('serve', () => {
    browsersync.init({
        server: {
            baseDir: pathBuild
        }
    });
    gulp.watch([pathFull.njk.watchedFiles, pathFull.data.path], ['nunjucks-dev']);
    gulp.watch(pathFull.sass.fullPath, ['scss-dev']);
});


//------------- images

gulp.task('img-dev', () => {
    return gulp
        .src(pathFull.img.path)
        .pipe(newer({dest: pathBase.imgBuild}))
        .pipe(gulp.dest(pathBase.imgBuild));
});


gulp.task('img-build', () => {
    return gulp
        .src(pathFull.img.path)
        .pipe(gulp.dest(pathBase.imgBuild));
});

//------------- scripts

gulp.task('js-dev', () => {
    return gulp
        .src(pathFull.js.path)
        .pipe(newer({dest: pathBase.jsBuild}))
        .pipe(gulp.dest(pathBase.jsBuild));
});


gulp.task('js-build', () => {
    return gulp
        .src(pathFull.js.path)
        .pipe(gulp.dest(pathBase.jsBuild));
});

//------------- fonts

gulp.task('fnt-dev', () => {
    return gulp
        .src(pathFull.fonts.path)
        .pipe(newer({dest: pathBase.fntBuild}))
        .pipe(gulp.dest(pathBase.fntBuild));
});


gulp.task('fnt-build', () => {
    return gulp
        .src(pathFull.fonts.path)
        .pipe(gulp.dest(pathBase.fntBuild));
});


//------------- css

gulp.task('css-dev', () => {
    return gulp
        .src(pathFull.css.path)
        .pipe(newer({dest: pathBase.css}))
        .pipe(gulp.dest(pathBase.css));
});


gulp.task('css-build', () => {
    return gulp
        .src(pathFull.css.path)
        .pipe(gulp.dest(pathBase.css));
});
