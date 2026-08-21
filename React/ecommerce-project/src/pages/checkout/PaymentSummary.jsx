import { formatMoney } from "../../utils/money";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function PaymentSummary({ paymentSummary, fetchCart }) {
  const navigate = useNavigate();
  const CreateOrder = async () => {
    await axios.post("/api/orders");
    // after order placed, remove that items from cart and redirect to order page
    await fetchCart();
    navigate("/orders");
  };

  return (
    <div className="payment-summary">
      <div className="payment-summary-title">Payment Summary</div>

      {paymentSummary && (
        <>
          <div className="payment-summary-row">
            <div>Items ({paymentSummary.totalItems}) :</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.productCostCents)}
            </div>
          </div>

          <div className="payment-summary-row">
            <div>Shippinc &amp; handling:</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.shippingCostCents)}
            </div>
          </div>

          <div className="payment-summary-row subtotal-row">
            <div>Total before tax:</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.totalCostBeforeTaxCents)}
            </div>
          </div>

          <div className="payment-summary-row">
            <div>Estimated tax (10%):</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.taxCents)}
            </div>
          </div>

          <div className="payment-summary-row total-row">
            <div>Order total:</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.totalCostCents)}
            </div>
          </div>

          <button
            className="place-order-button button-primary"
            onClick={CreateOrder}
          >
            Place your order
          </button>
        </>
      )}
    </div>
  );
}
