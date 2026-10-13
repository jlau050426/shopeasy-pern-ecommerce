import "./TrackingPage.css";
import { Header } from "../../components/Header";
import { OrderTracking } from "./OrderTracking";

export function TrackingPage({ cart, isLoggedIn, reactHandleLogout }) {
  return (
    <>
      <title>Tracking</title>
      <Header cart={cart} isLoggedIn={isLoggedIn} reactHandleLogout={reactHandleLogout}></Header>

      <div className="tracking-page">
        <OrderTracking></OrderTracking>
      </div>
    </>
  );
}
