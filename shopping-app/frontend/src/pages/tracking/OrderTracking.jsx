import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

export function OrderTracking() {
  const [order, setOrder] = useState([]);
  const [trackedProduct, setTrackedProduct] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime] = useState(() => Date.now());
  const [searchParams] = useSearchParams();
  const orderID = searchParams.get("orderID");
  const productID = searchParams.get("productID");

  useEffect(() => {
    if (!orderID) {
      setIsLoading(false);
      return;
    }
    async function fetchOrder() {
      try {
        const response = await axios.get(`/checkout/orders/${orderID}`);
        
        setOrder(response.data);

        //find product
        // Find the exact product from the order
        const product = response.data.find((item) => String(item.product_id) === String(productID));
        if (!product) {
          setErrorMessage("Product Not Foind in this order")
          return
        }
        setTrackedProduct(product)
      } catch (error) {
        console.error("Error fetching data ", error);
        if (error.response) {
          setErrorMessage(error.response.data.message || "failed to fetch order");
        } else {
          setErrorMessage("Unable to connect to server")
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderID, productID]);

  if (isLoading) {
    return (
      <div className="order-tracking">
        <p className="error-message">Retrieving Information.......</p>
        <Link className="back-to-orders-link link-primary" to="/orders">
          Back to orders
        </Link>
      </div>
    );
  }

  // Calculate delivery progress percentage
  const orderCreatedAtMs = new Date(order.created_at).getTime();
  const dateReceiveMs = trackedProduct.date_receive_ms;

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
      <Link className="back-to-orders-link link-primary" to="/orders">
        View all orders
      </Link>

      <div className="delivery-date">{errorMessage}</div>

      <div className="delivery-date">
        Arriving on {dayjs(dateReceiveMs).format("dddd, MMMM D")}
      </div>

      <div className="product-info">{trackedProduct.title}</div>

      <div className="product-info">Quantity: {trackedProduct.quantity}</div>

      <img className="product-image" src={trackedProduct.imageurl} />

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
