var linter = require('linter');

linter.run({
    files: "../jquery.sprite-animation.js", // can be an array or directory
    //config: "conf/server.json" // can be an object, path to a conf.json or config name e.g. "server"
    //confRoot: "/path/to/linter/predef/configs", per default is linter "conf" dir
    recursive: false, // read dir recursively, default to false
    format: false, // set to true if you want to get a string as errors argument, formatted for console output
    // callback functions, which is called on complete and errors array is passed
    // see ./bin/cli.js
    callback: function(errors) {
        console.log(errors);
    }
});