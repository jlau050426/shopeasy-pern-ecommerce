import "./HomePage.css";
import { Header } from "../../components/Header";
import apiClient from "../../services/apiClient";
import { useEffect, useState } from "react";
import { ProductContainer } from "./ProductContainer";
import { generatePagination } from "./pagination";
import { useSearchParams } from "react-router-dom";

export function HomePage({ cart, fetchCart, isLoggedIn }) {
  const [products, setProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalPages, setTotalPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [countdown, setCountdown] = useState();
  const page = searchParams.get("page") || 1;

  //countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    async function fetchProduct() {
      if (!Number.isInteger(Number(page)) || Number(page) < 1) {
        setErrorMessage("Invalid Page! Redirecting to Page 1");
        setProducts([]);
        setCountdown(5);
        setTimeout(() => {
          setSearchParams({ page: 1 }, { replace: true });
          setErrorMessage("");
        }, 5000);
        return;
      }
      //assynchronous code to fetch data (promise)
      try {
        const response = await apiClient.get(`/?page=${page}`);
        setProducts(response.data.prods);
        setTotalPages(response.data.totalPages); //typeof number
        setCurrentPage(response.data.currentPage);
      } catch (error) {
        if (error.response) {
          setErrorMessage(
            error.response.data?.message || "An error has occured",
          );
          setProducts([]);
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
          setErrorMessage("Unable to connect to the server");
          setProducts([]);
          setTotalPages([1]);
        }
        console.log(error);
      }
    }
    fetchProduct();
  }, [page, setSearchParams]);

  //search mechanism
  const filteredProducts = products.filter((product) => {
    return product.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <title>Ecommerce Project</title>
      <Header
        cart={cart}
        search={search}
        setSearch={setSearch}
        isLoggedIn={isLoggedIn}
      ></Header>
      <div className="home-page">
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
        <div className="products-grid">
          {/* loop through the product array  */}
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              return (
                <ProductContainer
                  key={product.id} //react map function need to associate with unique key
                  product={product}
                  fetchCart={fetchCart}
                ></ProductContainer>
              );
            })
          ) : (
            <div className="no-products-container">
              <div className="no-products-icon">🔍</div>
              <h2 className="no-products-title">
                No Products Found in This Page
              </h2>
              {search && (
                <button
                  className="no-products-reset-button"
                  onClick={() => setSearch("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
        <section className="pagination">
          {totalPages && generatePagination(totalPages, currentPage)}
        </section>
      </div>
    </>
  );
}
