/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
	pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    qunit: {
      files: ['tests/*js.test.html']
    },
    lint: {
      files: ['grunt.js', 'jquery.*.js']
    },
    /*watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },*/
    jshint: {
      options: {
        curly: true,
        eqeqeq: false, // allow ==
        immed: false,
        latedef: false,
        newcap: false,
        nonew: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: false,
        browser: true,
        regexp: true,
        strict: true,
        trailing: true
      },
      globals: {
        jQuery: true
      }
    },
    uglify: {},
    server: {
        port: 8080,
        base: '.'
      }
  });

  // Default task.
  grunt.registerTask('default', 'lint server min');

};