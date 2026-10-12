const fs = require("fs");
const path = require("path");

//absolute paths, so they work no matter which folder the server is started from
const IMAGES_DIR = path.join(__dirname, "..", "images");
const DATA_DIR = path.join(__dirname, "..", "data");

//create the folders if they are missing (recursive: no error if they already exist)
fs.mkdirSync(IMAGES_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

module.exports = { IMAGES_DIR, DATA_DIR };