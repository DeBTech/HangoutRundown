module.exports = function (config) {
  config.set({
    basePath: '../',

    files: [
      'test/angular_lib/angular.min.js',
      'test/angular_lib/angular-mocks.js',
      'public/javascript/**/*.js',
      'test/angular_unit/**/*.js'
    ],

    frameworks: ['jasmine'],

    autoWatch: true,

    browsers: ['Chrome'],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }
  });
};
