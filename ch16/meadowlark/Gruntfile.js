module.exports = function (grunt) {

    // 載入外掛
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        'grunt-link-checker',
        'grunt-contrib-less',
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    // 設置外掛
    grunt.initConfig({
        cafemocha: {
            all: {src: 'qa/tests-*.js', options: {ui: 'tdd'}}
        },
        jshint: {
            app: ['meadowlark.js', 'public/js/**/*.js', 'lib/**/*.js'],
            qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
        },
        linkChecker: {
            dev: {
                site: 'localhost',
                options: {
                    initialPort: 3000
                }
            }
        },
        less: {
            development: {
                options: {
                    customFunctions: {
                        static: function (lessObject, name) {
                            return 'url("' + require('./lib/static').map(name.value) + '")';
                        }
                    }
                },
                files: {
                    'public/css/main.css': 'less/main.less'
                }
            }
        }
    });

    // 註冊工作
    grunt.registerTask('default', ['cafemocha', 'jshint', 'linkChecker']);
};