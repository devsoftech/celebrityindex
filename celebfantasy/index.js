/*jslint anon:true, sloppy:true, nomen:true*/

process.chdir(__dirname);

/*
 * * Create the MojitoServer instance we'll interact with. Options can be passed
 * * using an object with the desired key/value pairs.
 * */
var Mojito = require('mojito');
var app = Mojito.createServer();

var fs = require('fs');

// Determine 'writable' cache directory
var cacheDir = process.env.manhattan_context__cache_dir;
console.log(cacheDir);
// Write synchronously into file system
try {
  fs.writeFileSync(cacheDir + '/foo.txt', 'barbarbar');
  console.log("YEA wrote it");
} catch (err) {
 console.log("OOPS COULD NOT WRITE");
}
module.exports = function(config, token) {
    process.emit('application-ready', token, app.getHttpServer());
};

