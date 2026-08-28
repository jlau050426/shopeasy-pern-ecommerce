import { formatMoney } from "../../utils/money";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { useState, Fragment } from "react";

export function OrderContainer({ order, handleOrderReceived, totalOrderPrice }) {
  const [currentTime] = useState(() => Date.now());
  return (
    <div key={order.id} class="order-container">
      <div class="order-header">
        <div class="order-header-left-section">
          <div class="order-date">
            <div class="order-header-label">Order Placed:</div>
            <div>{dayjs(order.created_at).format("dddd, MMMM D")}</div>
          </div>
          <div class="order-total">
            <div class="order-header-label">Total:</div>
            <div>{formatMoney(order.single_order_total_price)}</div>
          </div>
        </div>

        <div class="order-header-right-section">
          <div class="order-header-label">Order ID:</div>
          <div>{order.id}</div>
        </div>

        <button
          class="buy-again-button button-secondary"
          onClick={() => handleOrderReceived(order.id)}
        >
          <img class="buy-again-icon" src="/images/icons/check.png" />
          <span class="buy-again-message">Order Received</span>
        </button>
      </div>

      <div class="order-details-grid">
        {/* iterate through every items in an order  */}
        {order.items.map((item) => {
          const estimatedDeliveryTimeMs = currentTime + item.estimated_delivery_days * 24 * 60 * 60 * 1000;
          return (
            <Fragment key={item.product_id}>
              <div class="product-image-container">
                <img src={item.imageurl} />
              </div>

              <div class="product-details">
                <div class="product-name">{item.title}</div>
                <div class="product-delivery-date">
                  Arriving on:{" "}
                  {dayjs(estimatedDeliveryTimeMs).format(
                    "dddd, MMMM D",
                  )}
                </div>
                <div class="product-quantity">Quantity: {item.quantity}</div>
              </div>

              <div class="product-actions">
                <Link to={`/tracking?orderID=${order.id}&productID=${item.product_id}`}>
                  <button class="track-package-button button-primary">
                    Track package
                  </button>
                </Link>
                <a href={`/order/${order.id}`}>INVOICE</a>
              </div>
            </Fragment>
          );
        })}
      </div>
      <div class="order-details-grid">
        Total Order Price: {totalOrderPrice}
      </div>
    </div>
  );
}
