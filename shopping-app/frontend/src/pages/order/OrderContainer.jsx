import { formatMoney } from "../../utils/money";
import apiClient from "../../services/apiClient";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { useState, Fragment } from "react"

export function OrderContainer({
  order,
  handleOrderReceived,
  handlePaymentCanceled,
  handleRemoveExpired,
  handleOrderStatusChanged,
  fetchCart,
}) {
  const [errorMessage, setErrorMessage] = useState();
  const API_URL = import.meta.env.VITE_API_URL;

  //continue payment function
  async function ContinuePayment() {
    try {
      const response = await apiClient.post("/checkout/continue");

      if (response.data.state === "open" && response.data.checkoutUrl) {
        window.location.assign(response.data.checkoutUrl);

        return;
      }

      if (response.data.state === "paid") {
        handleOrderStatusChanged(order.id, "PAID");
        await fetchCart();
        return;
      }
    } catch (error) {
      if (
        error.response?.status === 410 &&
        error.response?.data?.code === "CHECKOUT_EXPIRED"
      ) {
        handleOrderStatusChanged(order.id, "EXPIRED");
        setErrorMessage("Your previous payment session expired.");
        return;
      }

      setErrorMessage(
        error.response?.data?.message || "Unable to continue payment.",
      );
    }
  }

  function timeCalculatorAndFormatter(timestamp) {
    const milliseconds = Number(timestamp);
    const date = new Date(milliseconds);

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div key={order.id} className="order-container">
      {errorMessage && (
        <div className="header-error" role="alert">
          <span className="header-error-icon" aria-hidden="true">
            !
          </span>
          <span>{errorMessage}</span>
          <button
            className="header-error-close"
            type="button"
            onClick={() => setErrorMessage("")}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {order.status === "PENDING_PAYMENT" ? (
        <>
          <div className="order-header">
            <div className="order-header-left-section">
              <div className="order-date">
                <div className="order-header-label">Order Placed:</div>
                <div>{dayjs(order.created_at).format("dddd, MMMM D")}</div>
              </div>
              <div className="order-total">
                <div className="order-header-label">Total:</div>
                <div>
                  {formatMoney(order.single_order_total_price_after_tax)}
                </div>
              </div>
            </div>

            <div className="order-header-right-section">
              <div className="order-header-label">Order ID:</div>
              <div>{order.id}</div>
            </div>

            <button
              className="buy-again-button button-secondary"
              onClick={() => handlePaymentCanceled(order.id)}
            >
              <span className="buy-again-message">Cancel Payment</span>
            </button>
          </div>

          <div className="order-details-grid">
            {/* iterate through every items in an order  */}
            {order.items.map((item) => {
              return (
                <Fragment key={item.product_id}>
                  <div className="product-image-container">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${item.imageurl}`}
                    />
                  </div>

                  <div className="product-details">
                    <div className="product-name">{item.title}</div>
                    <div className="product-delivery-date">
                      Arriving on:{" "}
                      {timeCalculatorAndFormatter(
                        item.estimated_delivered_time,
                      )}
                    </div>
                    <div className="product-quantity">
                      Quantity: {item.quantity}
                    </div>
                  </div>
                </Fragment>
              );
            })}

            <div className="product-actions">
              <button
                className="track-package-button button-pending"
                onClick={ContinuePayment}
              >
                CONTINUE PAYMENT
              </button>
            </div>
          </div>
        </>
      ) : order.status === "EXPIRED" ? (
        <>
          <div className="order-header">
            <div className="order-header-left-section">
              <div className="order-date">
                <div className="order-header-label">Order Placed:</div>
                <div>{dayjs(order.created_at).format("dddd, MMMM D")}</div>
              </div>
              <div className="order-total">
                <div className="order-header-label">Total:</div>
                <div>{formatMoney(order.single_order_total_price_after_tax)}</div>
              </div>
            </div>
            <div className="order-header-right-section">
              <button
                className="track-package-button button-expired"
                onClick={() => handleRemoveExpired(order.id)}
              >
                REMOVE EXPIRED PAYMENT
              </button>
            </div>
            <div className="order-header-right-section">
              <div className="order-header-label">Order ID:</div>
              <div>{order.id}</div>
            </div>
          </div>

          <div className="order-details-grid">
            {/* iterate through every items in an order  */}
            {order.items.map((item) => {
              return (
                <Fragment key={item.product_id}>
                  <div className="product-image-container">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${item.imageurl}`}
                    />
                  </div>

                  <div className="product-details">
                    <div className="product-name">{item.title}</div>
                    <div className="product-delivery-date">
                      Arriving on:{" "}
                      {timeCalculatorAndFormatter(
                        item.estimated_delivered_time,
                      )}
                    </div>
                    <div className="product-quantity">
                      Quantity: {item.quantity}
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="order-header">
            <div className="order-header-left-section">
              <div className="order-date">
                <div className="order-header-label">Order Placed:</div>
                <div>{dayjs(order.created_at).format("dddd, MMMM D")}</div>
              </div>
              <div className="order-total">
                <div className="order-header-label">Total:</div>
                <div>{formatMoney(order.single_order_total_price_after_tax)}</div>
              </div>
            </div>

            <div className="order-header-right-section">
              <div className="order-header-label">Order ID:</div>
              <div>{order.id}</div>
            </div>


            <a href={`${API_URL}/order/${order.id}`}>
              ORDER INVOICE PDF
            </a>

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
              return (
                <Fragment key={item.product_id}>
                  <div className="product-image-container">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${item.imageurl}`}
                    />
                  </div>

                  <div className="product-details">
                    <div className="product-name">{item.title}</div>
                    <div className="product-delivery-date">
                      Arriving on:
                      {timeCalculatorAndFormatter(
                        item.estimated_delivered_time,
                      )}
                    </div>
                    <div className="product-quantity">
                      Quantity: {item.quantity}
                    </div>
                  </div>

                  <div className="product-actions">
                    <Link
                      to={`/tracking?orderID=${order.id}&productID=${item.product_id}`}
                    >
                      <button className="track-package-button button-primary">
                        Track package
                      </button>
                    </Link>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
