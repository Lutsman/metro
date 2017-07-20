'use strict';

const gulp = require('gulp');
const del = require('del');
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const debug = require('gulp-debug');
const gutil = require( 'gulp-util' );
const ftp = require( 'vinyl-ftp' );
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');
const newer = require('gulp-newer');
const imagemin = require('gulp-imagemin');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const eslint = require('gulp-eslint');
const through2 = require('through2');
const fs = require('fs');
const combiner = require('stream-combiner2').obj;
const remember = require('gulp-remember');
const sassInheritance = require('gulp-sass-multi-inheritance');
const cached = require('gulp-cached');
const critical = require('critical');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const pathNames = {
  src: {
    assets: ['src/assets/fonts/**/*.*', 'src/assets/mail/**/*.*'],
    img: ['src/assets/img/**/*.+(gif|png|jpg|jpeg)', 'src/assets/service_img/**/*.+(gif|png|jpg|jpeg)'],
    css: ['src/css/**/*.css'],
    sass: ['src/css/**/*.scss'],
    //cssLib: ['dev/css/normalize.css'],
    //cssFonts: ['dev/fonts/**/*.css'],
    //sassLib: ['dev/css/*.scss', '!dev/css/themes/**/*.scss'],
    //sassTheme: ['dev/css/themes/readyshop/**/*.scss'],
    js: ['src/js/**/*.js',],
    jsES6: ['dev/js/**/*.es6.js']
  }
};
const dest = 'dist';
const base = "src";

gulp.task('clean', () => {
  console.log(isDevelopment);
  console.log(process.env.NODE_ENV);
  return del(dest);
});

gulp.task('critical', () => {
  return critical.generate({
          inline: true,
          base: './',
          css: [
            'src/css/normalize.min.css',
            'src/css/styles.min.css',
            'src/css/jquery.mmenu.min.css',
            'src/css/jquery.mmenu.themes.min.css'
          ],
          src: 'src/index.html',
          dest: 'dist/index.html',
          minify: false,
          include: [
            '#m-menu:not(.mm-menu)',
            '.mm-menu.mm-offcanvas'
          ],
          dimensions: [{
            width: 1366,
            height: 900,
          }, {
            width: 700,
            height: 500,
          }]
        });
});

gulp.task('lint', () => {
  return gulp.src(pathNames.src.js);
});

gulp.task('assets', () => {
  return gulp.src(pathNames.src.assets, {base: base, since: gulp.lastRun('assets')})
    /*.on('data', (file) => {
      console.log({
        contents: file.contents,
        path: file.path,
        cwd: file.cwd,
        base: file.base,
        relative: file.relative,
        dirname: file.dirname,
        basename: file.basename,
        stem: file.stem,
        extname: file.extname
      });
      //console.dir(file);
    })*/
    .pipe(newer(dest))
    //.pipe(debug({title: 'assets'}))
    .pipe(gulp.dest(dest));
});

gulp.task('img', () => {
    return gulp.src(pathNames.src.img, {base: base, since: gulp.lastRun('img')})
      .pipe(newer(dest))
      //.pipe(debug({title: 'img:start'}))
      .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.jpegtran({progressive: true}),
        imagemin.optipng({optimizationLevel: 5}),
        imagemin.svgo({plugins: [{removeViewBox: true}]})
      ],
      {
        verbose: true
      }))
    //.pipe(debug({title: 'img:output'}))
    .pipe(gulp.dest(dest));
});

gulp.task('css', () => {
  return gulp.src(pathNames.src.css, {base: base, since: gulp.lastRun('css')})
    .pipe(newer(dest))
    .pipe(cleanCSS({rebaseTo: ''}))
    .pipe(gulp.dest(dest));
});

gulp.task('sass', () => {
  return gulp.src(pathNames.src.sassLib, {base: base/*, since: gulp.lastRun('sass:lib')*/})
    //.pipe(newer(dest))
    //.pipe(debug({title: 'sass:lib'}))
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    //.pipe(remember('sass:lib'))
    .pipe(sass().on('error', notify.onError()))
    .pipe(cleanCSS({rebaseTo: ''}))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(gulp.dest(dest));
    //.pipe(debug({title: 'sass:lib:output'}));
});

gulp.task('sass:theme', () => {
  return gulp.src(pathNames.src.sassTheme, {base: base, since: gulp.lastRun('sass:theme')})
    //.pipe(newer(dest))
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS({rebaseTo: ''}))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(gulp.dest(dest));
});

gulp.task('js', () => {
  return gulp.src(pathNames.src.js, {base: base, since: gulp.lastRun('js')})
    .pipe(newer(dest))
    //.pipe(debug({title: 'js'}))
    .pipe(eslint({
      configFile: 'eslint.json'/*,
      globals: [
        'jQuery',
        '$'
      ]*/
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(gulpIf(!isDevelopment, uglify()))
    .pipe(rename((path) => {
      let pattern = '.min';

      if (~path.basename.indexOf(pattern)) return;

      path.basename += pattern;
    }))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(gulp.dest(dest));
});

gulp.task('js:ES6', () => {
  return gulp.src(pathNames.src.jsES6, {base: base, since: gulp.lastRun('js:ES6')})
    /*.pipe(newer({
      dest: dest,
      map: function (relative) {
        return relative.replace('.es6', '');
      }
    }))*/
    //.pipe(debug({title: 'js:ES6'}))
    /*.pipe(plumber({
      errorHandler: notify.onError
    }))*/
    //.pipe(debug({title: 'js:ES6:1'}))
    .pipe(eslint({
      configFile: 'eslint.json'
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(babel({
      presets: ['es2015'],
      //plugins: ["transform-runtime"]
    }))
    .pipe(gulpIf(!isDevelopment, uglify()))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(rename((path) => {
      //console.dir(path);

      let pattern = '.es6';
      let newName = path.basename.slice(0, path.basename.indexOf(pattern));

      path.basename = newName;
    }))
    //.pipe(debug({title: 'js:ES6:2'}))
    .pipe(gulp.dest(dest));
});

//gulp.task('lint:js')

gulp.task('watch', () => {
  gulp.watch(pathNames.src.assets, gulp.series('assets'));

  gulp.watch(pathNames.src.cssLib, gulp.series('css:lib'));
  gulp.watch(pathNames.src.cssFonts, gulp.series('css:fonts'));

  gulp.watch('dev/css/**/*.scss', gulp.series('sass:lib'));
  gulp.watch(pathNames.src.sassTheme, gulp.series('sass:theme'));

  gulp.watch(pathNames.src.js, gulp.series('js'));
  gulp.watch(pathNames.src.jsES6, gulp.series('js:ES6'));
});

/*gulp.task('build',
  gulp.series(
    'clean',
    gulp.parallel(
      'assets', 'img', 'css:fonts', 'sass:theme', 'css:lib', 'sass:lib',
      gulp.series('js', 'js:ES6')
    )
  )
);*/

gulp.task('build', gulp.series('clean', 'assets', 'img', 'css:fonts', 'sass:theme', 'css:lib', 'sass:lib', 'js', 'js:ES6'));

gulp.task('default', gulp.series('build'));

gulp.task('dev', gulp.series('build', 'watch'));

/*FTP tasks*/
const ftpDataDefault = {
  host: '',
  user: '',
  pass: '',
  parallel: 5,
  log: gutil.log,
  src: 'dist/**/*.*',
  dest: '/sites/all/themes/jflex/library/'
};
let ftpData = {
  flexorm: {
    host: 'flexorm.com',
    user: 'flex_clean',
    pass: 'A3z8J2b9'
  },
  jeto: {
    host: 'jeto.online',
    user: 'front_all',
    pass: '3T5u2D0v',
    dest: '/themes/jflex/library/'
  },
  fashion: {
    host: 'fashion.jetoflex.ru',
    user: 'fashion_jeto',
    pass: '9H5e6B7c'
  },
  pradiz: {
    host: 'pradiz.jeto.ru',
    user: 'pradiz_jeto',
    pass: '7W7h5F7f'
  },
  seledka: {
    host: 'seledka-fit.ru',
    user: 'seledka_fit_jeto',
    pass: '1F3i2I4u'
  },
  planshets: {
    host: 'planshets.ru',
    user: 'planshets_jeto',
    pass: '0Q0o6R0e'
  },
  bagforman: {
    host: 'bagforman.ru',
    user: 'bagforman_jeto',
    pass: '2T3d7D9b'
  },
  dropbag: {
    host: 'dropbag.ru',
    user: 'dropbag_jeto',
    pass: 'G3m8M8m1'
  },
  gellen: {
    host: 'gellen.ru',
    user: 'gellen_jeto',
    pass: '0O8g1Y7y'
  }
};

for(let key in ftpData) {
  ftpData[key] = Object.assign({}, ftpDataDefault, ftpData[key]);
}

/*flexorm: {
 pluginOptions: {
 host: 'flexorm.com',
 user: 'flex_clean',
 pass: 'A3z8J2b9'
 }
 }*/





gulp.task('ftp:all', (callback) => {
  let ftpTasksArr = [];
  let index = 0;
  //let pipe;

  for(let key in ftpData) {
    let currFtpData = ftpData[key];
    //console.dir(currFtpData);

    //let func = ;
    let taskName = currFtpData.host; //`ftp-task-${index}`;
    gulp.task(taskName, () => {
      let conn = ftp.create({
        host: currFtpData.host,
        user: currFtpData.user,
        pass: currFtpData.pass,
        parallel: currFtpData.parallel,
        log: currFtpData.log
      });

      return gulp.src(currFtpData.src, {base: dest, buffer: false})
        .pipe(conn.newer(currFtpData.dest))
        .pipe(conn.dest(currFtpData.dest));
    });

    ftpTasksArr.push(taskName);
    index++;
  }

  console.dir(ftpTasksArr);

  gulp.series(ftpTasksArr)(callback);
  //callback();
});

gulp.task('ftp', () => {
  let conn = ftp.create({
    host: '192.185.226.145',
    user: 'dimon@mrhummer.com',
    pass: 'fDCHGDVbmwsh4Q5',
    parallel: 5,
    log: gutil.log
  });
  let globs = ['dist/**/*.*', '!dist/bindex.html'];

  return gulp.src(globs, {base: dest, buffer: false})
    .pipe(conn.newer('/'))
    .pipe(conn.dest('/'));
});

//gulp.task('ftp:all', gulp.parallel('ftp:flexorm', 'ftp:seledka', 'ftp:jeto', 'ftp:fashion'));

/*debugger*/

/*gulp.task('assets', () => {
  return gulp.src(path.src.assets, {base: base})
  /!*.on('data', (file) => {
   console.log({
   contents: file.contents,
   path: file.path,
   cwd: file.cwd,
   base: file.base,
   relative: file.relative,
   dirname: file.dirname,
   basename: file.basename,
   stem: file.stem,
   extname: file.extname
   });
   //console.dir(file);
   })*!/
  //.pipe(debug())
    .pipe(gulp.dest(dest));
});*/
/*gulp.task('hello', function (callback) {
 console.log('hello');
 var promise = new Promise((resolve, reject) => {
 resolve('result');
 console.dir(promise);
 });

 return promise;
 callback();
 });*/

/*gulp.task('upload:css', () => {
  let conn = ftp.create({
    host: 'seledka-fit.ru',
    user: 'seledka_fit_jeto',
    pass: '1F3i2I4u',
    parallel: 10,
    log: gutil.log
  });
  let globs = [
    'dist/fonts/!**!/!*.*',
    'dist/css/!**!/!*.*',
    'dist/img/!**!/!*.*',
  ];

  return gulp.src(globs, {base: 'dist', buffer: false})
    .pipe(conn.newer('/sites/all/themes/jflex/library/'))
    .pipe(conn.dest('/sites/all/themes/jflex/library/'));
});*/


