import "./CheckoutPage.css";
import "./checkout-header.css";
import apiClient from "../../services/apiClient";
import { useState, useEffect } from "react";
import { OrderSummary } from "./OrderSummary";
import { PaymentSummary } from "./PaymentSummary";
import { Link, useNavigate } from "react-router-dom";
import { cartQuantity } from "../../utils/cartQuantity";

export function CheckoutPage({ cart, fetchCart }) {
  const navigate = useNavigate();
  const totalQuantity = cartQuantity(cart);

  const [deliveryOptions, setDeliveryOptions] = useState([]);
  //state for payment summary
  const [paymentSummary, setPaymentSummary] = useState(null);

  //function to getDeliveryOptions
  useEffect(() => {
    async function getDeliveryOptions() {
      try {
        const response = await apiClient.get("/delivery-options");
        setDeliveryOptions(response.data.deliveryOptionsDetails);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
        console.log(error);
      }
    }

    getDeliveryOptions();

    //function to getPaymentSummary
    async function getPaymentSummary() {
      try {
        const response = await apiClient.get("/cart");
        setPaymentSummary(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
        console.log(error);
      }
    }

    getPaymentSummary();
  }, [cart]); //when cart changes, the useEffect will rerun and update the payment summary

  return (
    <>
      <title>Checkout</title>
      <div className="checkout-header">
        <div className="header-content">
          <div className="checkout-header-left-section">
            <Link to="/">
              <img className="logo" src="/images/logo.png" />
              <img className="mobile-logo" src="images/mobile-logo.png" />
            </Link>
          </div>

          <div className="checkout-header-middle-section">
            Checkout (
            <Link className="return-to-home-link" to="/">
              {totalQuantity} items
            </Link>
            )
          </div>

          <div className="checkout-header-right-section">
            <img src="images/icons/checkout-lock-icon.png" />
          </div>
        </div>
      </div>

      <div className="checkout-page">
        <div className="page-title">Review your cart</div>

        <div className="checkout-grid">
          <OrderSummary
            deliveryOptions={deliveryOptions}
            cart={cart}
            fetchCart={fetchCart}
          ></OrderSummary>
          <PaymentSummary
            paymentSummary={paymentSummary}
            cart={cart}
            fetchCart={fetchCart}
          ></PaymentSummary>
        </div>
      </div>
    </>
  );
}
