module.exports = function(grunt){
    var filename = 'myojs-<%= pkg.version %>';
    var banner = '/*! \
\n * MyoJS v<%= pkg.version %>\
\n * https://github.com/logotype/myojs.git\
\n * \
\n * Copyright 2015 Victor Norgren\
\n * Released under the MIT license\
\n */';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'jsbeautifier' : {
            files : ['src/**/*.js'],
            options: {
                js: {
                    braceStyle: 'collapse',
                    breakChainedMethods: false,
                    e4x: false,
                    evalCode: false,
                    indentChar: ' ',
                    indentLevel: 0,
                    indentSize: 4,
                    indentWithTabs: false,
                    jslintHappy: false,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    spaceBeforeConditional: true,
                    spaceInParen: false,
                    unescapeStrings: false,
                    wrapLineLength: 0
                }
            }
        },
        'string-replace': {
            build: {
                files: {
                    'src/': 'src/Version.js',
                    'examples/': 'examples/*.html'
                },
                options: {
                    replacements: [
                        {
                            pattern: /(full:\s)'.*'/,
                            replacement: "$1'<%= pkg.version %>'"
                        }, {
                            pattern: /(major:\s)\d/,
                            replacement: "$1<%= pkg.version.split('.')[0] %>"
                        }, {
                            pattern: /(minor:\s)\d/,
                            replacement: "$1<%= pkg.version.split('.')[1] %>"
                        }, {
                            pattern: /(dot:\s)\d.*/,
                            replacement: "$1<%= pkg.version.split('.')[2][0] %>"
                        },
                        {
                            pattern: /myo.*\.js/,
                            replacement: filename + '.js'
                        }
                    ]
                }
            }
        },
        'clean': {
            build: {
                src: ['./build/']
            }
        },
        'browserify': {
            build: {
                src: './src/Index.js',
                dest: './build/' + filename + '.js'
            }
        },
        'uglify': {
            build: {
                src: './build/' + filename + '.js',
                dest: './build/' + filename + '.min.js'
            }
        },
        'usebanner': {
            build: {
                options: {
                    banner: banner
                },
                src: ['./build/' + filename + '.js', './build/' + filename + '.min.js']
            }
        },
        'watch': {
            files: 'src/**/*',
            tasks: ['default'],
            test: {
                files: ['src/*', 'test/*'],
                tasks: ['test']
            }

        },
        'mocha_istanbul': {
            coverage: {
                src: 'test',
                options: {
                    reporter: 'dot',
                    print: 'summary',
                    coverage: true,
                    root: './src',
                    reportFormats: ['lcovonly', 'html']
                }
            }
        },
        'exec': {
            'test-node': './node_modules/.bin/mocha src/Index.js test/*.js -i -R dot'
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', [
        'string-replace',
        'clean',
        'browserify',
        'jsbeautifier',
        'uglify',
        'usebanner'
    ]);


    grunt.registerTask('test', [
        'default',
        'mocha_istanbul'
    ]);

    grunt.registerTask('test-only', [
        'exec:test-node'
    ]);
};