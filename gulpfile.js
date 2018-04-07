'use strict';


//Requirements
const gulp = require ('gulp');
const browsersync = require ('browser-sync').create ();
const fs = require ('file-system');
const notify = require ('gulp-notify');
const path = require ('path');
const data = require ('gulp-data');
const del = require ('del');
const plumber = require ('gulp-plumber');
const newer = require ('gulp-newer');
const render = require ('gulp-nunjucks-render');
const prettify = require ('gulp-html-prettify');
const htmlclean = require ('gulp-htmlclean');
const sass = require ('gulp-sass');
const postcss = require ('gulp-postcss');
const sourcemaps = require ('gulp-sourcemaps');
const autoprefixer = require ('autoprefixer');
const mqpacker = require ('css-mqpacker');
const cssnano = require ('cssnano');
const svginline = require ('postcss-inline-svg');
const svgo = require ('postcss-svgo');
const babel = require ('gulp-babel');
const concat = require ('gulp-concat');
const uglify = require('gulp-uglify');

//Directories here
const workplace = `app/`;
const pathSrc = `${workplace}src/`;
const pathBuild = `${workplace}build/`;
const imgTypes = `(jpg|png|svg|jpeg|gif|ico)`;
const fntTypes = `(woff|woff2|ttf|eot|otf)`;
const pathBase = {
	sass: `${pathSrc}scss/`,
	data: `${pathSrc}_data/`,
	njk: `${pathSrc}njk/`,
	imgSrc: `${pathSrc}img/`,
	imgBuild: `${pathBuild}img/`,
	fntSrc: `${pathSrc}fonts/`,
	fntBuild: `${pathBuild}fonts/`,
	cssSrc: `${pathSrc}css/`,
	css: `${pathBuild}css/`,
	jsSrc: `${pathSrc}js/`,
	jsBuild: `${pathBuild}js/`
};
const pathFull = {
	njk: {
		pages: `${pathBase.njk}pages/**/*.+(njk)`,
		watchedFiles: `${pathBase.njk}**/*.+(njk)`,
		templatesBaseDir: `${pathBase.njk}templates/`,
		templateExtras: `${pathBase.njk}templates/**/*.+(njk)`
	},
	sass: {
		fullPath: `${pathBase.sass}**/*.+(scss)`,
		extras: `${pathBase.sass}includes/**/*.+(scss)`
	},
	data: {
		path: `${pathBase.data}**/*.+(json)`
	},
	img: {
		path: `${pathBase.imgSrc}**/*.+${imgTypes}`
	},
	js: {
		path: `${pathBase.jsSrc}**/*.+(js)`
	},
	css: {
		path: `${pathBase.cssSrc}**/*.+(css)`
	},
	fonts: {
		path: `${pathBase.fntSrc}**/*.+${fntTypes}`
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

//Tasks


//------------- clean

gulp.task('clean', () => del([`${pathBuild}**`]));


//------------- html

gulp.task('nunjucks-dev', () => gulp
	.src(pathFull.njk.pages)
	.pipe(data((file) => {
			const dataFile = `${pathBase.data}${path.basename(file.path, '.njk')}.json`;
			return (fs.existsSync(dataFile)) ?
				JSON.parse(fs.readFileSync(dataFile)) : {};
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
);

gulp.task('nunjucks-build', () => gulp
	.src(pathFull.njk.pages)
	.pipe(data((file) => {
		const dataFile = `${pathBase.data}${path.basename(file.path, '.njk')}.json`;
			return (fs.existsSync(dataFile)) ?
				JSON.parse(fs.readFileSync(dataFile)) : {};
	}))
	.pipe(plumber())
	.pipe(newer({dest: pathBuild, ext: '.html', extra: [pathFull.njk.templateExtras, pathFull.data.path]}))
	.pipe(render({
			path: [pathFull.njk.templatesBaseDir]
	}))
	.on("error", notify.onError((error) => error.message))
	.pipe(htmlclean())
	.pipe(gulp.dest(pathBuild))
);


//------------- css

gulp.task('scss-dev', () => gulp
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
);

gulp.task('scss-build', () => gulp
	.src(pathFull.sass.fullPath)
	.pipe(plumber())
	.pipe(newer({dest: pathBase.css, ext: '.css', extra: pathFull.sass.extras}))
	.pipe(sass())
	.on("error", notify.onError((error) => error.message))
	.pipe(postcss(postCSSpluginsForProd))
	.pipe(gulp.dest(pathBase.css))
);


//------------- images

gulp.task('img-dev', () => gulp
	.src(pathFull.img.path)
	.pipe(newer({dest: pathBase.imgBuild}))
	.pipe(gulp.dest(pathBase.imgBuild))
);


gulp.task('img-build', () => gulp
	.src(pathFull.img.path)
	.pipe(gulp.dest(pathBase.imgBuild))
);

//------------- scripts

gulp.task('js-dev', () => gulp
	.src(pathFull.js.path)
	.pipe(sourcemaps.init())
	.pipe(babel({presets: ['env']}))
	.pipe(concat('script.js'))
	.pipe(sourcemaps.write('/'))
	.pipe(gulp.dest(pathBase.jsBuild))
	.pipe(browsersync.reload({stream: true}))
);


gulp.task('js-build', () => gulp
	.src(pathFull.js.path)
	.pipe(babel({presets: ['env']}))
	.pipe(concat('script.js'))
	.pipe(uglify({mangle: {toplevel: true}}))
	.pipe(gulp.dest(pathBase.jsBuild))
);

//------------- fonts

gulp.task('fnt-dev', () => gulp
	.src(pathFull.fonts.path)
	.pipe(newer({dest: pathBase.fntBuild}))
	.pipe(gulp.dest(pathBase.fntBuild))
);


gulp.task('fnt-build', () => gulp
	.src(pathFull.fonts.path)
	.pipe(gulp.dest(pathBase.fntBuild))
);


//------------- css

gulp.task('css-dev', () => gulp
	.src(pathFull.css.path)
	.pipe(newer({dest: pathBase.css}))
	.pipe(gulp.dest(pathBase.css))
);


gulp.task('css-build', () => gulp
	.src(pathFull.css.path)
	.pipe(gulp.dest(pathBase.css))
);


// /-------------Gulp V3

// gulp.task('serve', () => {
// 	browsersync.init({
// 		server: {
// 			baseDir: pathBuild
// 		}
// 	});
// 	gulp.watch([pathFull.njk.watchedFiles, pathFull.data.path], ['nunjucks-dev']);
// 	gulp.watch(pathFull.sass.fullPath, ['scss-dev']);
// 	gulp.watch(pathFull.js.path, ['js-dev']);
// });
//
// gulp.task('default', ['clean', 'nunjucks-dev', 'scss-dev', 'img-dev', 'js-dev', 'fnt-dev', 'css-dev', 'serve']);
// gulp.task('prod', ['clean', 'nunjucks-build', 'scss-build', 'img-build', 'js-build', 'fnt-build', 'css-build']);

// /-------------Gulp V4

gulp.task('serve', () => {
	browsersync.init({
		server: {
			baseDir: pathBuild
		}
	});
	gulp.watch([pathFull.njk.watchedFiles, pathFull.data.path], gulp.series('nunjucks-dev'));
	gulp.watch(pathFull.sass.fullPath, gulp.series('scss-dev'));
	gulp.watch(pathFull.js.path, gulp.series('js-dev'));
});

gulp.task('default', gulp.series('clean', 'nunjucks-dev', 'scss-dev', 'img-dev', 'js-dev', 'fnt-dev', 'css-dev', 'serve'));
gulp.task('prod', gulp.series('clean', 'nunjucks-build', 'scss-build', 'img-build', 'js-build', 'fnt-build', 'css-build'));

