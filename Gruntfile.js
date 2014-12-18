var _ = require('underscore');
var SERVER_RESTART_FILE = '.tmp/restart.js';

module.exports = function(grunt) {

  // Our custom tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-mkdir');

  grunt.initConfig({
    mkdir: {
      dot_tmp: {
        options: {
          create: ['.tmp']
        }
      }
    },
    exec: {
      server_start: {
        cmd: 'supervisor -n error -n exit -w '+SERVER_RESTART_FILE+' app.js'
      },
      touch_server_restart: {
        cmd: 'touch ' + SERVER_RESTART_FILE
      },
      mocha_test: {
        // Workaround for grunt-mocha-test not giving good errors on failure
        cmd: 'find tests | xargs node_modules/.bin/mocha --colors'
      }
    },
    jshint: {
      options: {
        trailing: true,
        evil: true,
        curly: false, // forces curly braces for if statements: needs discussion (false means not enforcing)
        eqeqeq: true, // forces === and !==
        eqnull: true, // allows for foo == null (which will check for null or undefined)
        expr: true, // allows x.foo && x.foo() etc.
        sub: true,
        strict: false, // we should probably take out our "use strict" at top of files and turn this on and globalstrict off
        globalstrict: true,
        boss: true,
        node: true,
        browser: true,
        globals: {
          "describe": true,
          "it": true,
          "before": true,
          "beforeEach": true
        }
      },
      all: ['Gruntfile.js', 'engine/**/*.js', 'lib/**/*.js', 'tests/**/*.js', '!tests/fixtures/**']
    },
    sass: {
      main: {
        files: [{
          expand: true,
          cwd: 'public/css/sass',
          src: ['*.scss'],
          dest: 'public/css/',
          ext: '.css'
        }]
      }
    },
    watch: {
      scripts: {
        files: ['**/*.js', '**/*.hjs', '!Gruntfile.js', '!**/node_modules/**'],
        tasks: ['server:restart', 'exec:mocha_test', 'jshint']
      },
      css: {
        files: 'public/css/sass/*.scss',
        tasks: ['sass']
      }
    }
  });

  grunt.registerTask('default', ['sass','test', 'jshint']);
  grunt.registerTask('server', ['mkdir:dot_tmp', 'exec:touch_server_restart', 'exec:server_start']);
  grunt.registerTask('server:restart', ['mkdir:dot_tmp', 'exec:touch_server_restart']);
  grunt.registerTask('test', 'exec:mocha_test');
};
