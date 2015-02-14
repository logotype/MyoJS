module.exports = function(grunt){
    var filename = "myojs-<%= pkg.version %>";
    var banner = "/*! \
\n * MyoJS v<%= pkg.version %>\
\n * https://github.com/logotype/myojs.git\
\n * \
\n * Copyright 2015 Victor Norgren\
\n * Released under the MIT license\
\n */";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        // This updates the Version.js to match pkg.version
        'string-replace': {
            build: {
                files: {
                    'src/': 'src/Version.js',
                    './': 'bower.json',
                    'examples/': 'examples/*.html'
                },
                options:{
                    replacements: [
                        // Version.js
                        {
                            pattern: /(full:\s)'.*'/,
                            replacement: "$1'<%= pkg.version %>'"
                        },
                        {
                            pattern: /(major:\s)\d/,
                            replacement: "$1<%= pkg.version.split('.')[0] %>"
                        },
                        {
                            pattern: /(minor:\s)\d/,
                            replacement: "$1<%= pkg.version.split('.')[1] %>"
                        },
                        {
                            pattern: /(dot:\s)\d.*/,
                            replacement: "$1<%= pkg.version.split('.')[2][0] %>"
                        },
                        // bower.json
                        {
                            pattern: /"version": ".*"/,
                            replacement: '"version": "<%= pkg.version %>"'
                        },
                        // examples
                        {
                            pattern: /myo.*\.js/,
                            replacement: filename + '.js'
                        }
                    ]
                }
            }
        },
        clean: {
            build: {
                src: ['./myo-*.js']
            }
        },
        browserify: {
            build: {
                src: 'template/entry.js',
                dest: filename + '.js'
            }
        },
        uglify: {
            build: {
                src: filename  + '.js',
                dest: filename + '.min.js'
            }
        },
        usebanner: {
            build: {
                options: {
                    banner: banner
                },
                src: [filename + '.js', filename + '.min.js']
            }
        },
        watch: {
            files: 'src/**/*',
            tasks: ['default'],
            test: {
                files: ['src/*', 'test/*'],
                tasks: ['test']
            }

        },
        exec: {
            'test-node': './node_modules/.bin/mocha src/index.js test/*.js -i -R dot'
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', [
        'string-replace',
        'clean',
        'browserify',
        'uglify',
        'usebanner'
    ]);


    grunt.registerTask('test', [
        'default',
        'test-only'
    ]);

    grunt.registerTask('test-only', [
        'exec:test-node'
    ]);
};