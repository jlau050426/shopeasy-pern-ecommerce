const error404 = (req, res, next) => {
    res.status(404).render('404', { 
        pageTitle: 'Page Not Found', 
        path: '/404',
    });
}


const error500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Internal Server Error',
        path: '/500',
    });
}


exports.error404 = error404
exports.error500 = error500