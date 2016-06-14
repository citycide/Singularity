import gulp from 'gulp';
import babel from 'gulp-babel';
import clean from 'gulp-clean';
// import rebuild from './vendor/rebuild';
// import { spawn, exec } from 'child_process';

const paths = {
    serverScripts: ['src/**/*.js', '!src/public{,/**}'],
    clientScripts: ['src/public/**/*.js', '!src/public/js/vendor/{,/**}'],
    vendorScripts: ['src/public/js/vendor/**/*',
                    'node_modules/keen-ui/dist/min/keen-ui.min.js',
                    'node_modules/vue/dist/vue.js',
                    'node_modules/vue/dist/vue.min.js'],
    vendorStyles: ['node_modules/keen-ui/dist/min/keen-ui.min.css'],
    views: ['src/public/views/**/*.{ejs,html}'],
    fonts: ['node_modules/font-awesome/fonts/*.{otf,eot,svg,ttf,woff,woff2}',
            'node_modules/material-design-icons-iconfont/dist/fonts/*.{otf,eot,svg,ttf,woff,woff2}'],
    images: ['src/public/images/**/*'],
    fontStyles: ['node_modules/font-awesome/css/*.min.css'],
    styles: ['src/public/css/**/*'],
    assets: ['src/assets/**/*'],
    overlayEJS: ['src/public/views/overlays/*.ejs'],
    overlayCSS: ['src/public/views/overlays/css/**/*'],
    overlaySND: ['src/public/views/overlays/snd/**/*'],
    overlayIMG: ['src/public/views/overlays/images/**/*'],
    overlayFNT: ['src/public/views/overlays/fonts/**/*']
};

const cleanGlob = (glob) => {
    return () => {
        return gulp.src(glob, { read: false })
            .pipe(clean({ force: true }));
    };
};

gulp.task('clean-server', cleanGlob(['./build/*.js', './build/**/*.js', '!./build/public/**/*']));
gulp.task('clean-client', cleanGlob(['./build/public/*.js', './build/public/**/*.js', '!./build/public/js/vendor/**/*']));
gulp.task('clean-vendor', cleanGlob(['./build/js/vendor/**/*.js']));
gulp.task('clean-views', cleanGlob(['./build/public/views/*.ejs']));
gulp.task('clean-fonts', cleanGlob(['./build/public/fonts/**/*']));
gulp.task('clean-images', cleanGlob(['./build/public/images/**/*']));
gulp.task('clean-styles', cleanGlob(['./build/public/css/**/*.css']));
// gulp.task('clean-vendor-styles', cleanGlob(['./build/public/css/vendor/**/*.css']));
gulp.task('clean-assets', cleanGlob(['./build/public/assets/**/*']));
gulp.task('clean-overlayEJS', cleanGlob(['./build/public/views/overlays/*.ejs']));
gulp.task('clean-overlayCSS', cleanGlob(['./build/public/views/overlays/css/**/*']));
gulp.task('clean-overlaySND', cleanGlob(['./build/public/views/overlays/snd/**/*']));
gulp.task('clean-overlayIMG', cleanGlob(['./build/public/views/overlays/images/**/*.png']));
gulp.task('clean-overlayFNT', cleanGlob(['./build/public/views/overlays/fonts/**/*']));

gulp.task('transpile-server', ['clean-server'], () => {
    gulp.src(paths.serverScripts)
        .pipe(babel({ presets: ['es2015-node6'] }))
        .on('error', (err) => {
            console.error(err);
        })
        .pipe(gulp.dest('./build/'));
});

gulp.task('transpile-client', ['clean-client'], () => {
    gulp.src(paths.clientScripts, { base: './src/public' })
        .pipe(babel({ presets: ['es2015'] }))
        .on('error', (err) => {
            console.error(err);
        })
        .pipe(gulp.dest('./build/public'));
});

gulp.task('views', ['clean-views'], () => {
    return gulp.src(paths.views)
        .pipe(gulp.dest('./build/public/views/'));
});

gulp.task('fonts', ['clean-fonts'], () => {
    return gulp.src(paths.fonts)
        .pipe(gulp.dest('./build/public/fonts'));
});

gulp.task('images', ['clean-images'], () => {
    return gulp.src(paths.images)
        .pipe(gulp.dest('./build/public/images/'));
});

gulp.task('internal-styles', ['clean-styles'], () => {
    return gulp.src(paths.styles)
        .pipe(gulp.dest('./build/public/css'));
});

gulp.task('vendor-styles', ['internal-styles'], () => {
    return gulp.src(paths.vendorStyles)
        .pipe(gulp.dest('./build/public/css/vendor/'));
});

gulp.task('styles', ['vendor-styles'], () => {
    return gulp.src(paths.fontStyles)
        .pipe(gulp.dest('./build/public/fonts/'));
});

gulp.task('vendor-scripts', ['clean-vendor'], () => {
    return gulp.src(paths.vendorScripts)
        .pipe(gulp.dest('./build/public/js/vendor/'));
});

gulp.task('assets', ['clean-assets'], () => {
    return gulp.src(paths.assets)
        .pipe(gulp.dest('./build/assets'));
});

gulp.task('overlay-views', ['clean-overlayEJS'], () => {
    return gulp.src(paths.overlayEJS)
        .pipe(gulp.dest('./build/public/views/overlays'));
});

gulp.task('overlay-styles', ['clean-overlayCSS'], () => {
    return gulp.src(paths.overlayCSS)
        .pipe(gulp.dest('./build/public/views/overlays/css'));
});

gulp.task('overlay-sounds', ['clean-overlaySND'], () => {
    return gulp.src(paths.overlaySND)
        .pipe(gulp.dest('./build/public/views/overlays/snd'));
});

gulp.task('overlay-images', ['clean-overlayIMG'], () => {
    return gulp.src(paths.overlayIMG)
        .pipe(gulp.dest('./build/public/views/overlays/images'));
});

gulp.task('overlay-fonts', ['clean-overlayFNT'], () => {
    return gulp.src(paths.overlayFNT)
        .pipe(gulp.dest('./build/public/views/overlays/fonts'));
});

gulp.task('watch', ['build'], () => {
    gulp.watch(paths.serverScripts, ['transpile-server']);
    gulp.watch(paths.clientScripts, ['transpile-client']);
    gulp.watch(paths.views, ['views']);
    gulp.watch(paths.images, ['images']);
    gulp.watch(paths.styles, ['styles']);
    gulp.watch(paths.overlayEJS, ['overlay-views']);
    gulp.watch(paths.overlayCSS, ['overlay-styles']);
    gulp.watch(paths.overlayIMG, ['overlay-images']);
});

gulp.task('default', ['watch', 'transpile-server', 'transpile-client', 'images']);
gulp.task('clean', ['clean-server', 'clean-client', 'clean-vendor', 'clean-views', 'clean-fonts', 'clean-images', 'clean-styles',
                    'clean-assets', 'clean-overlayEJS', 'clean-overlayCSS', 'clean-overlaySND', 'clean-overlayFNT', 'clean-overlayIMG']);
gulp.task('build', ['transpile-server', 'transpile-client', 'views', 'fonts', 'images', 'styles', 'assets', 'vendor-scripts',
                    'overlay-views', 'overlay-styles', 'overlay-sounds', 'overlay-fonts', 'overlay-images']);
