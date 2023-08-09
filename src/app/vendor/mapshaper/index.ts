const mapshaper = require('src/app/vendor/mapshaper/js/mapshaper.js');
mapshaper.enableLogging();
module.exports = mapshaper;

const zip = require('src/app/vendor/mapshaper/js/zip.js');
zip.enableLogging();
module.exports = zip;

const mproj = require('src/app/vendor/mapshaper/js/mproj.js');
// const mproj = require('../../../../../node_modules/mproj/dist/mproj.js');
mproj.enableLogging();
module.exports = mproj;

const fsModule = require('fs');
fsModule.enableLogging();
module.exports = fsModule;

