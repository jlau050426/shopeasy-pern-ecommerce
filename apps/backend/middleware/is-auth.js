const isAuth = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.status(401).json({
            message: "You must log in"
        })
    }
    next()
}

module.exports = isAuth