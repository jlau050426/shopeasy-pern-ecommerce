const Product = require('../model/product')

//this is an async function
const pagination = async (req, res, productsPerPage, redirectPath, callback) => {
    let page = Number(req.query.page) || 1

    if (!Number.isInteger(page) || page < 1) {
        page = 1;
    }

    const offset = (page - 1) * productsPerPage

    try {
        const fetchPage = await Product.fetchPage(productsPerPage, offset)
        //calculate total pages to be generated
        const countProducts = await Product.countProducts()
        const totalProducts = countProducts.rows[0].count
        const totalPages = Math.ceil(totalProducts / productsPerPage)

        if (totalPages > 0 && page > totalPages) {
            return res.redirect(`${redirectPath}?page=1`)
        }

        await callback(fetchPage, totalPages)

    } catch (error) {
        req.flash("error", "error getting products")
        return res.redirect(redirectPath)
    }
}

exports.pagination = pagination