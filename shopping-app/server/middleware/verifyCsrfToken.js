//middleware to verify the csrf token
const verifyCsrfToken = (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const clientToken = req.headers["x-csrf-token"];
    //verification failed if client token is not exist or not match with the session token
    if (!clientToken || clientToken !== req.session.csrfToken) {
      return res
        .status(403)
        .json({message: "Suspicious CSRF attacks! Accessing Forbidden!"});
    }
  }
  next();
};

module.exports = verifyCsrfToken;
