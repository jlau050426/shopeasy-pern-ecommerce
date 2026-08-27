const fs = require("fs").promises;

const removeImage = async (filePath, next) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.log(`error deleting ${filePath} ${error}`);
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

exports.removeImage = removeImage;
