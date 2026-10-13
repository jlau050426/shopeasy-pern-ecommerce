//middleware to verify the csrf token
const verifyCsrfToken = (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const clientToken = req.headers["x-csrf-token"]; //this is the csrfToken attached in header
    //verification failed if client token is not exist or not match with the csrfToken store in session
    if (!clientToken || clientToken !== req.session.csrfToken) {
      return res
        .status(403)
        .json({message: "Suspicious CSRF attacks! Accessing Forbidden!"});
    }
  }
  next();
};

module.exports = verifyCsrfToken;
