import gulp from 'gulp'
import babel from 'gulp-babel'
import newer from 'gulp-newer'
import deleted from 'gulp-deleted'

function buildBot () {
  const output = './build/renderer/bot'
  return gulp
    .src('./src/renderer/bot/**/*.js')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(babel())
    .pipe(gulp.dest(output))
}

function buildMain () {
  const output = './build/main'
  return gulp
    .src('./src/main/**/*.js')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(babel())
    .pipe(gulp.dest(output))
}

function buildCommon () {
  const output = './build/common'
  return gulp
    .src('./src/common/**/*.js')
    .pipe(deleted(output))
    .pipe(newer(output))
    .pipe(babel())
    .pipe(gulp.dest(output))
}

function watchAll () {
  gulp.watch('./src/main/**/*.js', buildMain)
  gulp.watch('./src/common/**/*.js', buildCommon)
  gulp.watch('./src/renderer/bot/**/*.js', buildBot)
}

export const build = gulp.parallel(buildMain, buildCommon, buildBot)
export const watch = gulp.series(build, watchAll)

export default watch
