'use strict';

module.exports = function(grunt)
{
    grunt.initConfig({
        uglify:
        {
            my_target:
            {
                files:
                {
                    'dist/js/staggered_grid.min.js': [
                        'src/js/staggered_grid.js'
                    ]
                }
            }
        },
        cssmin:
        {
            options:
            {
                mergeIntoShorthands: false,
                roundingPrecision: -1
            },
            target:
            {
                files:
                {
                    'dist/css/staggered_grid.min.css': [
                        'src/css/staggered_grid.css'
                    ]
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', [
        'uglify',
        'cssmin'
    ]);
};
