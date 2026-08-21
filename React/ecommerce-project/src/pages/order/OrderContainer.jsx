import { formatMoney } from "../../utils/money";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

export function OrderContainer({ order, Fragment, handleOrderReceived }) {
  return (
    <div key={order.id} class="order-container">
      <div class="order-header">
        <div class="order-header-left-section">
          <div class="order-date">
            <div class="order-header-label">Order Placed:</div>
            <div>{dayjs(order.orderTimeMs).format("dddd, MMMM D")}</div>
          </div>
          <div class="order-total">
            <div class="order-header-label">Total:</div>
            <div>{formatMoney(order.totalCostCents)}</div>
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
        {order.products.map((product) => {
          return (
            <Fragment key={product.productId}>
              <div class="product-image-container">
                <img src={product.product.image} />
              </div>

              <div class="product-details">
                <div class="product-name">{product.product.name}</div>
                <div class="product-delivery-date">
                  Arriving on:{" "}
                  {dayjs(product.estimatedDeliveryTimeMs).format(
                    "dddd, MMMM D",
                  )}
                </div>
                <div class="product-quantity">Quantity: {product.quantity}</div>
              </div>

              <div class="product-actions">
                <Link to={`/tracking?orderID=${order.id}&productID=${product.productId}`}>
                  <button class="track-package-button button-primary">
                    Track package
                  </button>
                </Link>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
