import { formatMoney } from "../../utils/money";
import apiClient from "../../services/apiClient";
import { useNavigate } from "react-router-dom";
import { cartQuantity } from "../../utils/cartQuantity";
import { useEffect, useState } from "react";

export function PaymentSummary({ cart, paymentSummary }) {
  const navigate = useNavigate();
  //pending payment == isCreatingOrder
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function getPendingPayment() {
      try {
        const response = await apiClient.get("/pending-payment");
        if (response.status === 200) {
          setIsCreatingOrder(true)
        } else {
          setIsCreatingOrder(false)
        }
      } catch (error) {
        console.log(error);
      }
    }

    getPendingPayment()
  }, []);

  const CreateOrder = async () => {
    if (isCreatingOrder) return;
    setIsCreatingOrder(true);
    try {
      const response = await apiClient.post("/checkout");

      //ejs render page to Stripe page, however React will locate windows to Stripe Page
      window.location.href = response.data.checkoutUrl;
      return;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) { //user not log-in
          navigate("/login");
        } else if (error.response.status === 400 || error.response.status === 409) {
          setErrorMessage(error.response.data.message)
        }
      }
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (!paymentSummary) {
    return null;
  }

  const totalItems = cartQuantity(cart);
  const grandTotal = paymentSummary.grandTotal;
  const shippingCostTotal = paymentSummary.shippingCostTotal;
  const totalCostBeforeTax = grandTotal + shippingCostTotal;
  // 10 percent tax
  const tax = totalCostBeforeTax * 0.1;
  const totalCostCents = totalCostBeforeTax + tax;

  return (
    <>
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

      <div className="payment-summary">
        <div className="payment-summary-title">Payment Summary</div>

        {/* check whether paymentSummary is null during initial loading, if yes, stop immediately */}
        {paymentSummary && (
          <>
            <div className="payment-summary-row">
              <div>Items ({totalItems}) :</div>
              <div className="payment-summary-money">
                {formatMoney(grandTotal)}
              </div>
            </div>

            <div className="payment-summary-row">
              <div>Shipping &amp; handling:</div>
              <div className="payment-summary-money">
                {formatMoney(shippingCostTotal)}
              </div>
            </div>

            <div className="payment-summary-row subtotal-row">
              <div>Total before tax:</div>
              <div className="payment-summary-money">
                {formatMoney(totalCostBeforeTax)}
              </div>
            </div>

            <div className="payment-summary-row">
              <div>Estimated tax (10%):</div>
              <div className="payment-summary-money">{formatMoney(tax)}</div>
            </div>

            <div className="payment-summary-row total-row">
              <div>Order total:</div>
              <div className="payment-summary-money">
                {formatMoney(totalCostCents)}
              </div>
            </div>

            <button
              className="place-order-button button-primary"
              onClick={CreateOrder}
              disabled={isCreatingOrder}
            >
              {isCreatingOrder ? "Pending Payment ...." : "Place your order"}
            </button>
          </>
        )}
      </div>


    </>
  );
}
