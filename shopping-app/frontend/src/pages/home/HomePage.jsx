import "./HomePage.css";
import { Header } from "../../components/Header";
import apiClient from "../../services/apiClient";
import { useEffect, useState } from "react";
import { ProductContainer } from "./ProductContainer";

export function HomePage({ cart, fetchCart }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      //assynchronous code to fetch data (promise)
      try {
        const response = await apiClient.get("/");
        setProducts(response.data.prods);
      } catch (error) {
        console.log(error)
      }
    }
    fetchProduct();
  }, []);

  //search mechanism
  const filteredProducts = products.filter((product) => {
    return product.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <title>Ecommerce Project</title>
      <Header cart={cart} search={search} setSearch={setSearch}></Header>
      <div className="home-page">
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
        
      </div>
    </>
  );
}
