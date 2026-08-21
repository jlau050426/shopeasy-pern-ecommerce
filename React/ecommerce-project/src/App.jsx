import { HomePage } from "./pages/home/HomePage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { OrdersPage } from "./pages/order/OrdersPage";
import { TrackingPage } from "./pages/tracking/TrackingPage";
import {Error404} from "./pages/error404/Error404"
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  
  //state lifted up
  //track cart quantity
  const [cart, setCart] = useState([]);
  async function fetchCart() {
    try {
      const response = await axios.get("/cart");
      setCart(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
  }, []);

  return (
    <Routes>
      {/* Route add page to website  */}
      <Route
        path="/"
        element={<HomePage cart={cart} fetchCart={fetchCart} />}
      />
      <Route
        path="*"
        element={<Error404 cart={cart}/>}
      />
      <Route
        path="checkout"
        element={<CheckoutPage cart={cart} fetchCart={fetchCart} />}
      />
      <Route
      path="orders"
      element={<OrdersPage cart={cart} />} 
      />
      <Route
      path="tracking"
      element={<TrackingPage cart={cart}/>} 
      />
    </Routes>
  );
}

export default App;
