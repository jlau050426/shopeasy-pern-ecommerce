import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export function OrderTracking() {
  const [orderAndProduct, setOrderAndProduct] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime] = useState(() => Date.now());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate()

  const orderID = searchParams.get("orderID");
  const productID = searchParams.get("productID");

  useEffect(() => {
    async function fetchOrderAndProduct() {
      try {
        const response = await apiClient.get(
          `/checkout/order-&-product?orderID=${orderID}&productID=${productID}`,
        );

        setOrderAndProduct(response.data?.order || null);
      } catch (error) {
        console.error("Error fetching data ", error);
        if (error.response?.status === 401) {
          navigate("/login", {replace: true});
          return
        }
        if (error.response) {
          setErrorMessage(
            error.response.data.message || "failed to fetch order",
          );
        } else {
          setErrorMessage("Unable to connect to server");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderAndProduct();
  }, [orderID, productID, navigate]);

  if (isLoading) {
    return (
      <div className="order-tracking">
        <p className="error-message">Retrieving Information.......</p>
        <Link
          className="back-to-orders-link link-primary"
          to="/checkout/orders"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  if (!orderAndProduct) {
    return (
      <div className="order-tracking">
        <p className="error-message">Product Not Found</p>
        <Link
          className="back-to-orders-link link-primary"
          to="/checkout/orders"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  // Calculate delivery progress percentage
  const orderCreatedAtMs = new Date(orderAndProduct.created_at).getTime();
  const dateReceiveMs = orderAndProduct.date_receive_ms;

  const totalDuration = dateReceiveMs - orderCreatedAtMs;
  const elapsed = currentTime - orderCreatedAtMs;

  //TODO CALCULATE PERCENTAGE BETWEEN 0 AND 100 (ELAPSED /  TOTAL DURATION)
  const progressPercent =
    totalDuration > 0 ? Math.min((elapsed / totalDuration) * 100, 100) : 0;

  //TODO DYNAMIC PROGRESS LABELS (IS PREPARING, IS SHIPPED, IS DELIVERED)
  let progressState;
  if (progressPercent < 50) {
    progressState = "Preparing";
  } else if (progressPercent < 100) {
    progressState = "Shipped";
  } else {
    progressState = "Delivered";
  }

  return (
    <div className="order-tracking">
      <Link className="back-to-orders-link link-primary" to="/checkout/orders">
        View all orders
      </Link>

      <div className="delivery-date">{errorMessage}</div>

      <div className="delivery-date">
        Arriving on {dayjs(Number(dateReceiveMs)).format("dddd, MMMM D")}
      </div>

      <div className="product-info">{orderAndProduct.title}</div>

      <div className="product-info">Quantity: {orderAndProduct.quantity}</div>

      <img
        className="product-image"
        src={`${import.meta.env.VITE_API_URL}/${orderAndProduct.imageurl}`}
      />

      <div className="progress-labels-container">
        <div
          className={`progress-label ${progressState === "Preparing" ? "current-status" : ""}`}
        >
          Preparing
        </div>
        <div
          className={`progress-label ${progressState === "Shipped" ? "current-status" : ""}`}
        >
          Shipped
        </div>
        <div
          className={`progress-label ${progressState === "Delivered" ? "current-status" : ""}`}
        >
          Delivered
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{
            width: `${progressPercent}%`,
          }}
        ></div>
      </div>
    </div>
  );
}
