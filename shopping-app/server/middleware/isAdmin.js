const isAdmin = (req, res, next) => {

    if (req.session.sessionUserRole != "ADMIN") {
        return res.status(403).json({
            message: "You are not Admin!"
        })
    }
    next()
}

module.exports = isAdmin