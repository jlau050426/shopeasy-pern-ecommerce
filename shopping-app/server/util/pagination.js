const Product = require("../model/product");

//this is an async function
const pagination = async (req, next, productsPerPage, callback) => {
  let page = Number(req.query.page);

  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  const offset = (page - 1) * productsPerPage;

  try {
    const fetchPage = await Product.fetchPage(productsPerPage, offset);
    //calculate total pages to be generated
    const countProducts = await Product.countProducts();
    const totalProducts = countProducts.rows[0].count;
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    await callback(fetchPage, totalPages, page);
  } catch (err) {
    next(err);
  }
};

exports.pagination = pagination;
