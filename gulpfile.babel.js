import gulp from 'gulp'
import del from 'del'
import babel from 'gulp-babel'
import vueify from 'gulp-vueify'
import sass from 'gulp-sass'
import pug from 'gulp-pug'
import importer from 'node-sass-module-importer'

gulp.task('main', ['clean:main'], () => {
  return gulp.src('./src/main/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./build/main'))
})

gulp.task('renderer', [
  'clean:renderer',
  'renderer:js',
  'renderer:vue',
  'renderer:pug',
  'renderer:sass',
  'renderer:assets',
  'renderer:vendor'
])

gulp.task('renderer:js', () => {
  return gulp.src(['./src/renderer/**/*.js', '!./src/renderer/**/vendor/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('renderer:vue', () => {
  return gulp.src('./src/renderer/**/*.vue')
    .pipe(vueify())
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('renderer:pug', () => {
  return gulp.src('./src/renderer/**/*.pug')
    .pipe(pug())
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('renderer:sass', () => {
  return gulp.src('./src/renderer/**/*.scss')
    .pipe(sass({ importer }))
    .pipe(gulp.dest('./build/renderer'))
})

// Temporary task to simply copy image files
gulp.task('renderer:assets', () => {
  return gulp.src('./src/renderer/**/*.png')
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('renderer:vendor', () => {
  return gulp.src('./src/renderer/**/vendor/**/*.js')
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('common', ['clean:common'], () => {
  return gulp.src('./src/common/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./build/common'))
})

gulp.task('clean:all', () => del('./build'))
gulp.task('clean:main', () => del('./build/main'))
gulp.task('clean:renderer', () => del('./build/renderer'))
gulp.task('clean:common', () => del('./build/common'))

gulp.task('watch', ['build'], () => {
  gulp.watch('./src/main/**/*.js', ['clean:main', 'main'])
  gulp.watch('./src/renderer/**/*.{js,vue,pug,scss}', ['clean:renderer', 'renderer'])
  gulp.watch('./src/common/**/*.{js,vue,pug}', ['clean:common', 'common'])
})

gulp.task('build', ['main', 'renderer', 'common'])
