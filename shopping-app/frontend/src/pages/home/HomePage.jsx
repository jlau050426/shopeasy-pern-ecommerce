import "./HomePage.css";
import { Header } from "../../components/Header";
import apiClient from "../../services/apiClient";
import { useEffect, useState } from "react";
import { ProductContainer } from "./ProductContainer";
import { generatePagination } from "./pagination";
import { useSearchParams } from "react-router-dom";

export function HomePage({ cart, fetchCart, isLoggedIn, reactHandleLogout, isAdmin }) {
  const [products, setProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalPages, setTotalPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = searchParams.get("page") || 1;

  useEffect(() => {
    async function fetchProduct() {
      if (!Number.isInteger(Number(page)) || Number(page) < 1) {
        setErrorMessage("Invalid Page! Return to Page 1");
        setTimeout(() => {
          setErrorMessage("")
        }, 5000)
        setProducts([]);
        setSearchParams({ page: 1 }, { replace: true })
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
          setTimeout(() => {
            setErrorMessage("")
          }, 5000)
          setProducts([]);
          if (error.response.status === 404) {
            setErrorMessage(
              error.response.data?.message ||
              "page exceeds maximum pages. Return to page 1.....",
            );
            setSearchParams({ page: 1 }, { replace: true })
          }
        } else {
          setErrorMessage("Unable to connect to the server");
          setTimeout(() => {
            setErrorMessage("")
          }, 5000)
          setProducts([]);
          setTotalPages([1]);
        }
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
        reactHandleLogout={reactHandleLogout}
        isAdmin={isAdmin}
      ></Header>
      <div className="home-page">
        {errorMessage && (
          <div className="header-error" role="alert">
            <span className="header-error-icon" aria-hidden="true">
              !
            </span>
            <div className="header-error-content">
              {errorMessage}
            </div>
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
