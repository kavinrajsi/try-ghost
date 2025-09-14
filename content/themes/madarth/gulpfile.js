/* eslint-disable */
const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');
const livereload = require('gulp-livereload');
const postcss = require('gulp-postcss');
const zip = require('gulp-zip');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const beeper = require('beeper');
const path = require('path');
const fs = require('fs');

// Sass (Dart Sass)
const dartSass = require('sass');
const gulpSass = require('gulp-sass')(dartSass);

// PostCSS plugins
const autoprefixer = require('autoprefixer');
const colorFunction = require('postcss-color-mod-function');
const cssnano = require('cssnano');
const easyimport = require('postcss-easy-import');

/* ========= Paths ========= */
const paths = {
  scss: {
    src: 'assets/scss/**/*.scss',
    dest: 'assets/built/'
  },
  css: {
    src: 'assets/css/*.css', // optional plain CSS files
    dest: 'assets/built/'
  },
  js: {
    // libs first, then your own files
    src: ['assets/js/lib/*.js', 'assets/js/*.js'],
    dest: 'assets/built/'
  },
  hbs: {
    src: ['*.hbs', 'partials/**/*.hbs']
  }
};

/* ========= Helpers ========= */
function serve(done) {
  livereload.listen();
  done();
}
const handleError = (done) => (err) => {
  if (err) beeper();
  return done(err);
};

/* ========= Tasks ========= */
function hbs(done) {
  pump([
    src(paths.hbs.src, {allowEmpty: true}),
    livereload()
  ], handleError(done));
}

function scss(done) {
  pump([
    src(paths.scss.src, {sourcemaps: true, allowEmpty: true}),
    gulpSass().on('error', gulpSass.logError),
    postcss([easyimport, colorFunction(), autoprefixer(), cssnano()]),
    dest(paths.scss.dest, {sourcemaps: '.'}),
    livereload()
  ], handleError(done));
}

function css(done) {
  pump([
    src(paths.css.src, {sourcemaps: true, allowEmpty: true}),
    postcss([easyimport, colorFunction(), autoprefixer(), cssnano()]),
    dest(paths.css.dest, {sourcemaps: '.'}),
    livereload()
  ], handleError(done));
}

function js(done) {
  pump([
    src(paths.js.src, {sourcemaps: true, allowEmpty: true}),
    concat('theme.js'),             // final JS filename
    uglify(),
    dest(paths.js.dest, {sourcemaps: '.'}),
    livereload()
  ], handleError(done));
}

/* ========= ZIP (whitelist only theme files) ========= */

function zipper(done) {
  const filename = require('./package.json').name + '.zip';

  const mandatory = [
    '*.hbs',
    'partials/**/*.hbs',
    'assets/**',
    'package.json'
  ];

  const optional = ['routes.yaml', 'README.md', 'LICENSE']
    .filter(p => fs.existsSync(p));

  pump([
    src([...mandatory, ...optional], { base: '.' }),
    zip(filename),
    dest('dist/')
  ], handleError(done));
}


/* ========= Watchers ========= */
const scssWatcher = () => watch('assets/scss/**', scss);
const cssWatcher  = () => watch('assets/css/**', css);
const jsWatcher   = () => watch('assets/js/**', js);
const hbsWatcher  = () => watch(paths.hbs.src, hbs);

const build = series(parallel(scss, css, js));
const watcher = parallel(scssWatcher, cssWatcher, jsWatcher, hbsWatcher);

/* ========= Exports ========= */
exports.scss = scss;
exports.css = css;
exports.js = js;
exports.hbs = hbs;
exports.build = build;
exports.zip = series(build, zipper);
exports.default = series(build, serve, watcher);
