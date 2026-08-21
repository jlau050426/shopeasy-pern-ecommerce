import dayjs from "dayjs";
import { formatMoney } from "../../utils/money";
import axios from "axios";
import { deleteCartItem } from "../../utils/deleteCartItem";

export function OrderSummary({ deliveryOptions, cart, fetchCart }) {
  return (
    <div className="order-summary">
      {deliveryOptions.length > 0 &&
        cart.map((cartItem) => {
          const selectedDeliveryOption = deliveryOptions.find(
            (deliveryOption) => {
              return deliveryOption.id === cartItem.deliveryOptionId;
            },
          );

          return (
            <div key={cartItem.productId} className="cart-item-container">
              <div className="delivery-date">
                Delivery date:{" "}
                {dayjs(selectedDeliveryOption.estimatedDeliveryTimeMs).format(
                  "dddd, MMMM D",
                )}
              </div>

              <div className="cart-item-details-grid">
                <img className="product-image" src={cartItem.product.image} />

                <div className="cart-item-details">
                  <div className="product-name">{cartItem.product.name}</div>
                  <div className="product-price">
                    {formatMoney(cartItem.product.priceCents)}
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
                      onClick={() => deleteCartItem(cartItem, fetchCart)}
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
                      await axios.put(
                        `/api/cart-items/${cartItem.productId}`,
                        {
                          deliveryOptionId: deliveryOption.id,
                        },
                      );
                      await fetchCart();
                    }
                    //determine the price
                    let priceString = "FREE Shipping"; //default of free shipping

                    //override if price is not FREE
                    if (deliveryOption.priceCents > 0) {
                      priceString = `${formatMoney(deliveryOption.priceCents)} - Shipping`;
                    }

                    return (
                      <div
                        key={deliveryOption.id}
                        className="delivery-option"
                        onClick={UpdateDeliveryOption}
                      >
                        <input
                          type="radio"
                          checked={
                            deliveryOption.id === cartItem.deliveryOptionId
                          }
                          onChange={() => {}}
                          className="delivery-option-input"
                          //separate by dfferent orders
                          name={`delivery-option-${cartItem.productId}`}
                        />
                        <div>
                          <div className="delivery-option-date">
                            {dayjs(
                              deliveryOption.estimatedDeliveryTimeMs,
                            ).format("dddd, MMMM D")}
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
    </div>
  );
}
