import del from 'del'
import gulp from 'gulp'
import babel from 'gulp-babel'
import vueify from 'gulp-vueify'
import sass from 'gulp-sass'
import jetpack from 'fs-jetpack'
import importer from 'node-sass-module-importer'

const babelVue = () => jetpack.read('./.babelrc')

function cleanAll () { return del('./build') }
function cleanMain () { return del('./build/main') }
function cleanCommon () { return del('./build/common') }
function cleanRenderer () { return del('./build/renderer') }

const buildMain = gulp.parallel(mainJS, mainJSON, mainServer)

function mainJS () {
  return gulp
    .src('./src/main/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./build/main'))
}

function mainJSON () {
  return gulp
    .src('./src/main/**/*.json')
    .pipe(gulp.dest('./build/main'))
}

function mainServer () {
  return gulp
    .src('./src/main/components/server/public/**/*.html')
    .pipe(gulp.dest('./build/main/components/server/public'))
}

const buildRenderer = gulp.parallel(
  rendererJS,
  rendererVue,
  rendererSass,
  rendererHTML,
  rendererAssets,
  rendererVendor
)

function rendererJS () {
  return gulp
    .src(['./src/renderer/**/*.js', '!./src/renderer/**/vendor/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('./build/renderer'))
}

function rendererVue () {
  return gulp
    .src('./src/renderer/**/*.vue')
    .pipe(vueify(babelVue()))
    .pipe(gulp.dest('./build/renderer'))
}

function rendererSass () {
  return gulp
    .src('./src/renderer/**/*.scss')
    .pipe(sass({ importer }))
    .pipe(gulp.dest('./build/renderer'))
}

function rendererHTML () {
  return gulp
    .src('./src/renderer/**/*.html')
    .pipe(gulp.dest('./build/renderer'))
}

function rendererAssets () {
  return gulp
    .src('./src/renderer/**/*.png')
    .pipe(gulp.dest('./build/renderer'))
}

function rendererVendor () {
  return gulp
    .src('./src/renderer/**/vendor/**/*.js')
    .pipe(gulp.dest('./build/renderer'))
}

function buildCommon () {
  return gulp
    .src('./src/common/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./build/common'))
}

function watchAll () {
  gulp.watch('./src/main/**/*.{js,json,html}', gulp.series(
    cleanMain, buildMain
  ))

  gulp.watch('./src/common/**/*.js', gulp.series(
    cleanCommon, buildCommon
  ))

  gulp.watch('./src/renderer/**/*.{js,vue,html,scss}', gulp.series(
    cleanRenderer, buildRenderer
  ))
}

export const build = gulp.series(cleanAll, buildMain, buildCommon, buildRenderer)
export const watch = gulp.series(cleanAll, buildMain, buildCommon, buildRenderer, watchAll)

export default watch
