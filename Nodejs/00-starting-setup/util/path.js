const path = require('path');
console.log("path: ", path.dirname(process.mainModule.filename));

module.exports = path.dirname(process.mainModule.filename);