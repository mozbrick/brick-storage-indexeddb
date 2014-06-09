module.exports = function(config){
  config.set({

    files : [
      'bower_components/platform/platform.js',
      {pattern: 'src/element.html', watched: false, included: false, served: true},
      'test/browser.js'
    ],

    autoWatch : true,

    frameworks: ['mocha', 'chai', 'chai-as-promised'],

    browsers : ['Firefox'],

    plugins : [
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-chai',
      'karma-chai-plugins',
    ],
  });
};
