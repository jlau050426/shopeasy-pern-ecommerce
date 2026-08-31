import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./AdminProductsPage.css";
import apiClient from "../../services/apiClient";
import { formatMoney } from "../../utils/money";

export function AdminProductContainer({ product, onDelete }) {
  const navigate = useNavigate();

  function handleEdit() {
    navigate(`/admin/edit-product/${product.id}`);
  }

  return (
    <div className="product-container" data-testid={`admin-product-${product.id}`}>
      <div className="product-image-container">
        <img
          className="product-image"
          data-testid="product-image"
          src={`${import.meta.env.VITE_API_URL}/${product.imageurl}`}
          alt={product.title}
        />
      </div>

      <div className="product-name limit-text-to-2-lines" title={product.title}>
        {product.title}
      </div>

      <div className="product-rating-container">
        <img
          className="product-rating-stars"
          data-testid="rating-star"
          src={`/images/ratings/rating-${(product.rating_star || 0) * 10}.png`}
          alt={`${product.rating_star || 0} stars`}
        />
        <div className="product-rating-count link-primary">
          {product.rating_count || 0}
        </div>
      </div>

      <div className="product-price">{formatMoney(product.price)}</div>

      <div className="product-spacer"></div>

      <div className="admin-product-actions">
        <button
          type="button"
          className="admin-edit-button"
          onClick={handleEdit}
          data-testid="edit-product-button"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          className="admin-delete-button"
          onClick={() => onDelete(product.id, product.title)}
          data-testid="delete-product-button"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalPages, setTotalPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("page") || 1;

  useEffect(() => {
    async function fetchProducts() {
      if (!Number.isInteger(Number(page)) || Number(page) < 1) {
        setErrorMessage("Invalid Page! Redirecting to Page 1...");
        setProducts([]);
        setTimeout(() => {
          setSearchParams({ page: 1 }, { replace: true });
          setErrorMessage("");
        }, 2000);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get(`/?page=${page}`);
        setProducts(response.data.prods || []);
        setTotalPages(response.data.totalPages);
        setCurrentPage(Number(response.data.currentPage) || Number(page));
        setErrorMessage("");
      } catch (error) {
        console.error("Error fetching admin products:", error);
        if (error.response) {
          setErrorMessage(
            error.response.data?.message || "An error occurred while loading products.",
          );
          setProducts([]);
          if (error.response.status === 400) {
            setTimeout(() => {
              setSearchParams({ page: 1 }, { replace: true });
              setErrorMessage("");
            }, 2000);
          }
        } else {
          setErrorMessage("Unable to connect to the server.");
          setProducts([]);
          setTotalPages(1);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [page, setSearchParams]);

  // Real-time search filter
  const filteredProducts = products.filter((product) =>
    product.title?.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(productId, productTitle) {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${productTitle}"? This action cannot be undone.`
    );
    if (!isConfirmed) return;

    try {
      await apiClient.delete(`/admin/delete-product/${productId}`);
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== productId)
      );
    } catch (error) {
      console.error("Error deleting product:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.errorMessage ||
          "Failed to delete product. Please try again."
      );
    }
  }

  function renderPagination() {
    if (!totalPages || totalPages <= 1) return null;

    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      const isCurrent = Number(p) === Number(currentPage);
      pages.push(
        <button
          key={p}
          type="button"
          className={isCurrent ? "active" : ""}
          onClick={() => setSearchParams({ page: p })}
        >
          {p}
        </button>,
      );
    }

    return (
      <section className="pagination">
        <div>{pages}</div>
      </section>
    );
  }

  return (
    <div className="admin-products-page">
      <title>Admin - Manage Products | ShopEasy</title>

      {/* Admin Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/" className="admin-logo-link" aria-label="ShopEasy Home">
            <span>ShopEasy</span>
            <span className="admin-badge">Admin</span>
          </Link>
        </div>

        <div className="admin-header-middle">
          <input
            className="admin-search-input"
            type="text"
            placeholder="Search products by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-header-right">
          <Link to="/admin/add-product" className="admin-add-product-btn">
            <span>+ Add Product</span>
          </Link>
          <Link to="/" className="admin-store-link">
            View Store
          </Link>
        </div>
      </header>

      {/* Subheader */}
      <div className="admin-subheader">
        <div className="admin-subheader-title">
          <h1>Product Management</h1>
          <p>View and manage all items in your store catalog</p>
        </div>
        <div className="admin-product-count">
          {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="admin-error-banner" role="alert">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="admin-products-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#66756c" }}>
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">📦</div>
            <h3>No Products Found</h3>
            <p>
              {search
                ? `No products match "${search}". Try another search term.`
                : "There are currently no products available in the catalog."}
            </p>
            <Link to="/admin/add-product" className="admin-add-product-btn">
              + Add First Product
            </Link>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <AdminProductContainer
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {renderPagination()}
          </>
        )}
      </main>
    </div>
  );
}

export default AdminProductsPage;
