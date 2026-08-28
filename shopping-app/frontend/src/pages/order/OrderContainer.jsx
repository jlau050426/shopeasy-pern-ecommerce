import { formatMoney } from "../../utils/money";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { useState, Fragment } from "react";

export function OrderContainer({ order, handleOrderReceived }) {
  const API_URL = import.meta.env.VITE_API_URL
  const [currentTime] = useState(() => Date.now());
  return (
    <div key={order.id} className="order-container">
      <div className="order-header">
        <div className="order-header-left-section">
          <div className="order-date">
            <div className="order-header-label">Order Placed:</div>
            <div>{dayjs(order.created_at).format("dddd, MMMM D")}</div>
          </div>
          <div className="order-total">
            <div className="order-header-label">Total:</div>
            <div>{formatMoney(order.single_order_total_price)}</div>
          </div>
        </div>

        <div className="order-header-right-section">
          <div className="order-header-label">Order ID:</div>
          <div>{order.id}</div>
        </div>

        <button
          className="buy-again-button button-secondary"
          onClick={() => handleOrderReceived(order.id)}
        >
          <img className="buy-again-icon" src="/images/icons/check.png" />
          <span className="buy-again-message">Order Received</span>
        </button>
      </div>

      <div className="order-details-grid">
        {/* iterate through every items in an order  */}
        {order.items.map((item) => {
          const estimatedDeliveryTimeMs = currentTime + item.estimated_delivery_days * 24 * 60 * 60 * 1000;
          return (
            <Fragment key={item.product_id}>
              <div className="product-image-container">
                <img src={item.imageurl} />
              </div>

              <div className="product-details">
                <div className="product-name">{item.title}</div>
                <div className="product-delivery-date">
                  Arriving on:{" "}
                  {dayjs(estimatedDeliveryTimeMs).format(
                    "dddd, MMMM D",
                  )}
                </div>
                <div className="product-quantity">Quantity: {item.quantity}</div>
              </div>

              <div className="product-actions">
                <Link to={`/tracking?orderID=${order.id}&productID=${item.product_id}`}>
                  <button className="track-package-button button-primary">
                    Track package
                  </button>
                </Link>
                <a href={`${API_URL}/order/${order.id}`}>INVOICE</a>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
