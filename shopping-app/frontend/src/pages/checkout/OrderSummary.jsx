import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { formatMoney } from "../../utils/money";
import apiClient from "../../services/apiClient";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket";

export function OrderSummary({ deliveryOptions, cart, fetchCart }) {
  const navigate = useNavigate();
  const [currentTime] = useState(() => Date.now());
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function deleteCartItem(cartItem) {
    try {
      await apiClient.delete(`/cart-delete-item/${cartItem.id}`);
      setSuccessMessage("Cart Deleted!");
    } catch (error) {
      console.log(error);
      setErrorMessage("Fail to Delete Cart!");
    }
  }

  //socket function
  useEffect(() => {
    function handleDeliveryOptionUpdater() {
      fetchCart();
    }
    socket.on("cart:delivery-updated", handleDeliveryOptionUpdater);
    return () => {
      socket.off("cart:delivery-updated", handleDeliveryOptionUpdater);
    };
  }, [fetchCart]);

  return (
    <div className="order-summary">
      {deliveryOptions.length > 0 &&
        cart.map((cartItem) => {
          const selectedDeliveryOption = deliveryOptions.find(
            (deliveryOption) => {
              return deliveryOption.id === cartItem.delivery_options;
            },
          );

          const estimatedDeliveryTimeMs =
            currentTime +
            selectedDeliveryOption.delivery_days * 24 * 60 * 60 * 1000;

          return (
            <div key={cartItem.id} className="cart-item-container">
              <div className="delivery-date">
                Delivery date:{" "}
                {dayjs(estimatedDeliveryTimeMs).format("dddd, MMMM D")}
              </div>

              <div className="cart-item-details-grid">
                <img
                  className="product-image"
                  src={`${import.meta.env.VITE_API_URL}/${cartItem.imageurl}`}
                />

                <div className="cart-item-details">
                  <div className="product-name">{cartItem.title}</div>
                  <div className="product-price">
                    {formatMoney(cartItem.price)}
                  </div>
                  <div className="product-quantity">
                    <span>
                      Quantity:{" "}
                      <span className="quantity-label">
                        {cartItem.quantity}
                      </span>
                    </span>
                    <span
                      className="delete-quantity-link link-primary"
                      onClick={() => deleteCartItem(cartItem)}
                    >
                      Delete
                    </span>
                  </div>
                </div>

                <div className="delivery-options">
                  <div className="delivery-options-title">
                    Choose a delivery option:
                  </div>

                  {deliveryOptions.map((deliveryOption) => {
                    //update delivery option function
                    async function UpdateDeliveryOption() {
                      try {
                        await apiClient.put(`/cart-items/${cartItem.id}`, {
                          deliveryOptionId: deliveryOption.id,
                        });
                        await fetchCart();
                      } catch (error) {
                        if (error.response?.status === 401) {
                          navigate("/login");
                        }
                        console.log(error);
                      }
                    }

                    //determine the price
                    let priceString = "FREE Shipping"; //default of free shipping

                    //override if price is not FREE
                    if (deliveryOption.price_dollars > 0) {
                      priceString = `${formatMoney(deliveryOption.price_dollars)} - Shipping`;
                    }

                    const optionDeliveryTimeMs =
                      currentTime +
                      deliveryOption.delivery_days * 24 * 60 * 60 * 1000;

                    return (
                      <div
                        key={deliveryOption.id}
                        className="delivery-option"
                        onClick={UpdateDeliveryOption}
                      >
                        <input
                          type="radio"
                          checked={
                            deliveryOption.id === cartItem.delivery_options
                          }
                          onChange={() => {}}
                          className="delivery-option-input"
                          //separate by dfferent orders
                          name={`delivery-option-${cartItem.product_id}`}
                        />
                        <div>
                          <div className="delivery-option-date">
                            {dayjs(optionDeliveryTimeMs).format("dddd, MMMM D")}
                          </div>
                          <div className="delivery-option-price">
                            {priceString}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

      {successMessage && (
        <div className="header-success" role="alert">
          <span className="header-success-icon" aria-hidden="true">
            !
          </span>
          <span>{successMessage}</span>
          <button
            className="header-success-close"
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

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
    </div>
  );
}
