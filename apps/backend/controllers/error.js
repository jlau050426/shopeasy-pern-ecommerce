const error404 = (req, res, next) => {
    res.status(404).json({
        message: "Resource Not Found!"
    })
}


const error500 = (req, res, next) => {
    res.status(500).json({
        message: "Internal Server Error"
    })
}


exports.error404 = error404
exports.error500 = error500