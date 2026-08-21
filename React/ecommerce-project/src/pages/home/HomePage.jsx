import "./HomePage.css";
import { Header } from "../../components/Header";
import axios from "axios";
import { useEffect, useState } from "react";
import { ProductContainer } from "./ProductContainer";

export function HomePage({ cart, fetchCart }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      //assynchronous code to fetch data (promise)
      try {
        const response = await axios.get("/api/products");
        setProducts(response.data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchProduct();
  }, []);

  const filteredProducts = products.filter((product) => {
    return product.name.toLowerCase().includes(search.toLowerCase());
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
