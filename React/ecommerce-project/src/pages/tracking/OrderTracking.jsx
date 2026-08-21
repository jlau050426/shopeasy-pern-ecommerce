import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

export function OrderTracking() {
  const [order, setOrder] = useState([]);
  const [searchParams] = useSearchParams();
  const orderID = searchParams.get("orderID");
  const productID = searchParams.get("productID");

  useEffect(() => {
    if (!orderID) return;
    async function fetchOrder() {
      try {
        const response = await axios.get(
          `/api/orders/${orderID}?expand=products`,
        );
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching data ", error);
      }
    }

    fetchOrder();
  }, [orderID]);

  // Find the exact product from the order
  const trackedProduct = order.products?.find(
    (item) => item.productId === productID,
  );

  if (!trackedProduct) {
    return (
      <div className="order-tracking">
        <p className="error-message">Product not found in this order.</p>
        <Link className="back-to-orders-link link-primary" to="/orders">
          Back to orders
        </Link>
      </div>
    );
  }

  // Calculate delivery progress percentage
  const orderTime = order.orderTimeMs;
  const estimatedDeliveryTime = trackedProduct.estimatedDeliveryTimeMs;
  const currentTime = Date.now();

  const totalDuration = estimatedDeliveryTime - orderTime;
  const elapsed = currentTime - orderTime;

  //TODO CALCULATE PERCENTAGE BETWEEN 0 AND 100 (ELAPSED /  TOTAL DURATION)
  const progressPercent = totalDuration > 0 ? Math.min((elapsed/totalDuration) * 100, 100) : 0

  //TODO DYNAMIC PROGRESS LABELS (IS PREPARING, IS SHIPPED, IS DELIVERED)
  let progressState
  if(progressPercent < 50){
    progressState = "Preparing"
  } else if (progressPercent < 100){
    progressState = "Shipped"
  } else {
    progressState = "Delivered"
  }

  return (
    <div className="order-tracking">
      <Link className="back-to-orders-link link-primary" to="/orders">
        View all orders
      </Link>

      <div className="delivery-date">Arriving on {dayjs(estimatedDeliveryTime).format("dddd, MMMM D")}</div>

      <div className="product-info">
        {trackedProduct.product.name}
      </div>

      <div className="product-info">Quantity: {trackedProduct.quantity}</div>

      <img
        className="product-image"
        src={trackedProduct.product.image}
      />

      <div className="progress-labels-container">
        <div className={`progress-label ${progressState==="Preparing" ? "current-status" : ""}`}>Preparing</div>
        <div className={`progress-label ${progressState==="Shipped" ? "current-status" : ""}`}>Shipped</div>
        <div className={`progress-label ${progressState==="Delivered" ? "current-status" : ""}`}>Delivered</div>
      </div>

      <div className="progress-bar-container">
        <div 
        className="progress-bar"
        style={
          {
            width: `${progressPercent}%`
          }
        }
        ></div>
      </div>
    </div>
  );
}
