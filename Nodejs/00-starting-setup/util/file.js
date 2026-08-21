const fs = require("fs").promises;

const removeImage = async (filePath) => {
  try {
    await fs.unlink(filePath, (error) => {});
  } catch (error) {
    console.log(`error deleting ${filePath} ${error}`);
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

exports.removeImage = removeImage;
