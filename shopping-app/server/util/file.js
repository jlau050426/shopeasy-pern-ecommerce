const fs = require("fs").promises;

//error status will be handled in controller, so here just log the error
const removeImage = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`error deleting ${filePath}`, error)
  }
};

exports.removeImage = removeImage;
