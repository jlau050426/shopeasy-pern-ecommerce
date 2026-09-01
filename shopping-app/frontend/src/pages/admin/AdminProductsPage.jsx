import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./AdminProductsPage.css";
import apiClient from "../../services/apiClient";
import { AdminProductContainer } from "./AdminProductContainer";

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalPages, setTotalPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("page") || 1;
  const [countdown, setCountdown] = useState(null);
  const navigate = useNavigate();

  //handle delete function
  async function handleDelete(productId, productTitle) {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${productTitle}"? This action cannot be undone.`,
    );
    if (!isConfirmed) return;

    try {
      await apiClient.delete(`/admin/delete-product/${productId}`);
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== productId),
      );
    } catch (error) {
      console.error("Error deleting product:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.errorMessage ||
          "Failed to delete product. Please try again.",
      );
    }
  }

  //countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    //while on edit page already validated through pre-fetch product details
    async function validateAdminValidity() {
      try {
        await apiClient.get("/admin/admin-page");
      } catch (error) {
        if (error.response) {
          if (error.response.status === 401) {
            setErrorMessage(error.response.data.message);
            setCountdown(5);
            setTimeout(() => {
              navigate("/login");
            }, 5000);
          } else if (error.response.status === 403) {
            setErrorMessage(error.response.data.message);
            setCountdown(5);
            setTimeout(() => {
              navigate("/");
            }, 5000);
          } else {
            setErrorMessage(
              error.response.data?.errorMessage || "Something Wrong",
            );
            setCountdown(5);
            setTimeout(() => {
              navigate("/");
            }, 5000);
          }
        } else {
          setErrorMessage("Unable to connect to the server. Please try again.");
        }
      }
    }
    validateAdminValidity();
  }, [navigate]);

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
        setCurrentPage(Number(response.data.currentPage));
      } catch (error) {
        if (error.response) {
          if (error.response.status === 400) {
            setErrorMessage(
              error.response.data?.message ||
                "page exceeds maximum pages, redirecting to page 1.....",
            );
            setCountdown(5);
            setTimeout(() => {
              setSearchParams({ page: 1 }, { replace: true });
              setErrorMessage("");
            }, 5000);
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
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "Product" : "Products"}
        </div>
      </div>

      {errorMessage && (
        <div className="header-error" role="alert">
          <span className="header-error-icon" aria-hidden="true">
            !
          </span>
          <div className="header-error-content">
            <span>{errorMessage}</span>
            {countdown !== null && countdown > 0 && (
              <span> Redirecting in {countdown}...</span>
            )}
          </div>
          <button
            className="header-error-close"
            type="button"
            onClick={() => setErrorMessage("")}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="admin-products-content">
        {isLoading ? (
          <div
            style={{ textAlign: "center", padding: "60px 0", color: "#66756c" }}
          >
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">🔍</div>
            <h3>No Products Found in This Page</h3>
            <h2>
              {search && (
                <button
                  className="no-products-reset-button"
                  onClick={() => setSearch("")}
                >
                  Clear Search
                </button>
              )}
            </h2>
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
          </>
        )}
      </main>

      {renderPagination()}
    </div>
  );
}

export default AdminProductsPage;
