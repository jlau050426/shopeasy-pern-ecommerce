import "./TrackingPage.css";
import { Header } from "../../components/Header";
import { OrderTracking } from "./OrderTracking";

export function TrackingPage({ cart }) {
  return (
    <>
      <title>Tracking</title>
      <Header cart={cart}></Header>

      <div className="tracking-page">
        <OrderTracking></OrderTracking>
      </div>
    </>
  );
}
