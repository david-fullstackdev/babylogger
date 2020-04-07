'use strict';

/* eslint comma-dangle:[0, "only-multiline"] */

module.exports = {
  client: {
    lib: {
      css: [
        // bower:css
        /* 'public/lib/bootstrap/dist/css/bootstrap.css',
        'public/lib/bootstrap/dist/css/bootstrap-theme.css',*/
        'public/lib/ng-img-crop/compile/unminified/ng-img-crop.css',
        'public/lib/angular-ui-notification/dist/angular-ui-notification.css',
        'public/lib/angular-material/angular-material.min.css',
        'public/lib/angular-material-icons/angular-material-icons.css',
        'public/lib/angular-material-sidenav/angular-material-sidenav.css',
        'public/lib/angular-ui-swiper/dist/angular-ui-swiper.css',
        'public/lib/nvd3/build/nv.d3.min.css',
        // endbower
      ],
      js: [
        // bower:js
        'public/lib/angular/angular.js',
        'public/lib/angular-animate/angular-animate.js',
        'public/lib/angular-sanitize/angular-sanitize.min.js',
        'public/lib/angular-aria/angular-aria.min.js',
        'public/lib/angular-messages/angular-messages.min.js',
        'public/lib/angular-material/angular-material.min.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
        'public/lib/ng-file-upload/ng-file-upload.js',
        'public/lib/ng-img-crop/compile/unminified/ng-img-crop.js',
        'public/lib/angular-messages/angular-messages.js',
        'public/lib/angular-mocks/angular-mocks.js',
        'public/lib/angular-resource/angular-resource.js',
        'public/lib/angular-ui-notification/dist/angular-ui-notification.js',
        'public/lib/angular-ui-router/release/angular-ui-router.js',
        'public/lib/owasp-password-strength-test/owasp-password-strength-test.js',
        'public/lib/moment/moment.js',
        'public/lib/moment-duration-format/lib/moment-duration-format.js',
        'public/lib/moment-timezone/builds/moment-timezone-with-data.min.js',
        'public/lib/angular-material-icons/angular-material-icons.min.js',
        'public/lib/angular-material-sidenav/angular-material-sidenav.js',
        'public/lib/angular-ui-swiper/dist/angular-ui-swiper.js',
        'public/lib/lodash/lodash.js',
        'public/lib/jstz-detect/jstz.js',
        'public/lib/d3/d3.min.js',
        'public/lib/nvd3/build/nv.d3.min.js',
        'public/lib/angular-nvd3/dist/angular-nvd3.min.js',
        // endbower
      ],
      tests: ['public/lib/angular-mocks/angular-mocks.js']
    },
    css: [
      'modules/*/client/css/*.css'
    ],
    less: [
      'modules/*/client/less/*.less'
    ],
    sass: [
      'modules/*/client/scss/*.scss'
    ],
    js: [
      'modules/core/client/app/config.js',
      'modules/core/client/app/init.js',
      'modules/*/client/*.js',
      'modules/*/client/**/*.js'
    ],
    img: [
      'modules/**/*/img/**/*.jpg',
      'modules/**/*/img/**/*.png',
      'modules/**/*/img/**/*.gif',
      'modules/**/*/img/**/*.svg'
    ],
    views: ['modules/*/client/views/**/*.html'],
    templates: ['build/templates.js']
  },
  server: {
    gulpConfig: ['gulpfile.js'],
    allJS: ['server.js', 'config/**/*.js', 'modules/*/server/**/*.js'],
    models: 'modules/*/server/models/**/*.js',
    routes: ['modules/!(core)/server/routes/**/*.js', 'modules/core/server/routes/**/*.js'],
    sockets: 'modules/*/server/sockets/**/*.js',
    config: ['modules/*/server/config/*.js'],
    policies: 'modules/*/server/policies/*.js',
    views: ['modules/*/server/views/*.html']
  }
};
