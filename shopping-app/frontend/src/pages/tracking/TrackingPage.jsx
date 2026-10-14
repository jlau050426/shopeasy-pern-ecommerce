import "./TrackingPage.css";
import { Header } from "../../components/Header";
import { OrderTracking } from "./OrderTracking";

export function TrackingPage({ cart, isLoggedIn, reactHandleLogout, isAdmin }) {
  return (
    <>
      <title>Tracking</title>
      <Header cart={cart} isLoggedIn={isLoggedIn} reactHandleLogout={reactHandleLogout} isAdmin={isAdmin}></Header>

      <div className="tracking-page">
        <OrderTracking></OrderTracking>
      </div>
    </>
  );
}
