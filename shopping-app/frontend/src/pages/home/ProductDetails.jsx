import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { Header } from "../../components/Header";
import { formatMoney } from "../../utils/money";

export function ProductDetails({ cart, isLoggedIn }) {
  // Get productID from URL parameter (e.g. /product/:productID)
  const { productID } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product detail on mount / URL change
  useEffect(() => {
    async function fetchProductDetail() {
      try {
        setLoading(true);
        const response = await apiClient.get(`/product/${productID}`);
        // Support both { product: {...} } and direct product object response
        setProduct(response.data.product || response.data);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    }

    if (productID) {
      fetchProductDetail();
    }
  }, [productID]);

  return (
    <>
      <title>{product ? product.title : "Product Details"}</title>
      <Header cart={cart} isLoggedIn={isLoggedIn}/>

      <main
        style={{
          maxWidth: "800px",
          margin: "80px auto 40px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        {loading && <p>Loading product details...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && product && (
          <>
            <h1>{product.title}</h1>
            <hr style={{ margin: "20px 0", borderColor: "#eee" }} />

            <div style={{ margin: "20px 0" }}>
              <img
                src={`${import.meta.env.VITE_API_URL}/${product.imageurl}`}
                alt={product.title}
                style={{
                  maxWidth: "350px",
                  maxHeight: "350px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            </div>

            <h2 style={{ margin: "15px 0", color: "#B12704" }}>
              {typeof product.price === "number"
                ? formatMoney(product.price)
                : `$${product.price}`}
            </h2>

            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                color: "#333",
                maxWidth: "600px",
                margin: "0 auto 30px",
              }}
            >
              {product.description}
            </p>
          </>
        )}
      </main>
    </>
  );
}
