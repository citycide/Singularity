import gulp from 'gulp'
import babel from 'gulp-babel'
import newer from 'gulp-newer'
import vueify from 'gulp-vueify'
import sass from 'gulp-sass'
import pug from 'gulp-pug'
import importer from 'node-sass-module-importer'

gulp.task('main', () => {
  gulp.src('./src/main/**/*.js')
    .pipe(newer('./build/main'))
    .pipe(babel())
    .pipe(gulp.dest('./build/main'))
})

gulp.task('renderer', [
  'renderer:js',
  'renderer:vue',
  'renderer:pug',
  'renderer:sass',
  'renderer:assets'
])

gulp.task('renderer:js', () => {
  gulp.src('./src/renderer/**/*.js')
    .pipe(newer('./build/renderer'))
    .pipe(babel())
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('renderer:vue', () => {
  gulp.src('./src/renderer/**/*.vue')
    .pipe(newer('./build/renderer'))
    .pipe(vueify())
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('renderer:pug', () => {
  gulp.src('./src/renderer/**/*.pug')
    .pipe(newer('./build/renderer'))
    .pipe(pug())
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('renderer:sass', () => {
  gulp.src('./src/renderer/**/*.scss')
    .pipe(newer('./build/renderer'))
    .pipe(sass({ importer }))
    .pipe(gulp.dest('./build/renderer'))
})

// Temporary task to simply copy image files
gulp.task('renderer:assets', () => {
  gulp.src('./src/renderer/**/*.png')
    .pipe(newer('./build/renderer'))
    .pipe(gulp.dest('./build/renderer'))
})

gulp.task('common', () => {
  gulp.src('./src/common/**/*.js')
    .pipe(newer('./build/common'))
    .pipe(babel())
    .pipe(gulp.dest('./build/common'))
})

gulp.task('watch', ['build'], () => {
  gulp.watch('./src/main/**/*.js', ['main'])
  gulp.watch('./src/renderer/**/*.{js,vue,pug,scss}', ['renderer'])
  gulp.watch('./src/common/**/*.{js,vue,pug}', ['common'])
})

gulp.task('build', ['main', 'renderer', 'common'])
