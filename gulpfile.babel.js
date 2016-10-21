import gulp from 'gulp'
import sass from 'gulp-sass'
import babel from 'gulp-babel'
import newer from 'gulp-newer'
import vueify from 'gulp-vueify'
import deleted from 'gulp-deleted'
import jetpack from 'fs-jetpack'
import importer from 'node-sass-module-importer'

const babelVue = () => jetpack.read('./.babelrc')

function mainJS () {
  const output = './build/main'
  return gulp
    .src('./src/main/**/*.js')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(babel())
    .pipe(gulp.dest(output))
}

function mainJSON () {
  const output = './build/main'
  return gulp
    .src('./src/main/**/*.json')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(gulp.dest(output))
}

function mainServer () {
  const output = './build/main/components/server/public'
  return gulp
    .src('./src/main/components/server/public/**/*.html')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(gulp.dest(output))
}

function rendererJS () {
  const output = './build/renderer'
  return gulp
    .src(['./src/renderer/**/*.js', '!./src/renderer/**/vendor/**/*.js'])
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(babel())
    .pipe(gulp.dest(output))
}

function rendererVue () {
  const output = './build/renderer'
  return gulp
    .src('./src/renderer/**/*.vue')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(vueify(babelVue()))
    .pipe(gulp.dest(output))
}

function rendererSass () {
  const output = './build/renderer'
  return gulp
    .src('./src/renderer/**/*.scss')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(sass({ importer }))
    .pipe(gulp.dest(output))
}

function rendererHTML () {
  const output = './build/renderer'
  return gulp
    .src('./src/renderer/**/*.html')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(gulp.dest(output))
}

function rendererAssets () {
  const output = './build/renderer'
  return gulp
    .src('./src/renderer/**/*.png')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(gulp.dest(output))
}

function rendererVendor () {
  const output = './build/renderer'
  return gulp
    .src('./src/renderer/**/vendor/**/*.js')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(gulp.dest(output))
}

function commonJS () {
  const output = './build/common'
  return gulp
    .src('./src/common/**/*.js')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(babel())
    .pipe(gulp.dest(output))
}

function commonJSON () {
  const output = './build/common'
  return gulp
    .src('./src/common/**/*.json')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(gulp.dest(output))
}

const buildMain = gulp.parallel(mainJS, mainJSON, mainServer)
const buildCommon = gulp.parallel(commonJS, commonJSON)
const buildRenderer = gulp.parallel(
  rendererJS,
  rendererVue,
  rendererSass,
  rendererHTML,
  rendererAssets,
  rendererVendor
)

function watchAll () {
  gulp.watch('./src/main/**/*.{js,json,html}', buildMain)
  gulp.watch('./src/common/**/*.{js,json}', buildCommon)
  gulp.watch('./src/renderer/**/*.{js,vue,html,scss}', buildRenderer)
}

export const build = gulp.parallel(buildMain, buildCommon, buildRenderer)
export const watch = gulp.series(build, watchAll)

export default watch
