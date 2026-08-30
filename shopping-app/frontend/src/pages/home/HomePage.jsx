import "./HomePage.css";
import { Header } from "../../components/Header";
import apiClient from "../../services/apiClient";
import { useEffect, useState } from "react";
import { ProductContainer } from "./ProductContainer";
import { generatePagination } from "./pagination";
import { useSearchParams } from "react-router-dom";

export function HomePage({ cart, fetchCart, isLoggedIn}) {
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
        setErrorMessage("Invalid Page! Redirecting to Page 1");
        setProducts([]);
        setTimeout(() => {
          setSearchParams({ page: 1 }, { replace: true });
          setErrorMessage("");
        }, 3000);
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
            setTimeout(() => {
              setSearchParams({ page: 1 }, { replace: true });
              setErrorMessage("");
            }, 3000);
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
      <Header cart={cart} search={search} setSearch={setSearch} isLoggedIn={isLoggedIn}></Header>
      <div className="home-page">
        {errorMessage && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              border: "1px solid #ffeeba",
              padding: "12px 20px",
              margin: "10px auto",
              maxWidth: "800px",
              borderRadius: "6px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}
        <div className="products-grid">
          {/* loop through the product array  */}
          {filteredProducts.map((product) => {
            return (
              <ProductContainer
                key={product.id} //react map function need to associate with unique key
                product={product}
                fetchCart={fetchCart}
              ></ProductContainer>
            );
          })}
        </div>
        <section className="pagination">
          {totalPages && generatePagination(totalPages, currentPage)}
        </section>
      </div>
    </>
  );
}
