import { HomePage } from "./pages/home/HomePage";
import { ProductDetails } from "./pages/home/ProductDetails";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { OrdersPage } from "./pages/order/OrdersPage";
import { TrackingPage } from "./pages/tracking/TrackingPage";
import { Error404 } from "./pages/error404/Error404";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { PasswordResetPage } from "./pages/auth/passwordResetPage";
import { NewPasswordPage } from "./pages/auth/newPasswordPage";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

axios.defaults.withCredentials = true; //set as DEFAULT to allow CORS

function App() {
  const navigate = useNavigate()
  //state lifted up
  //track cart quantity
  const [cart, setCart] = useState([]);
  async function fetchCart() {
    try {
      const response = await axios.get("/cart");
      setCart(response.data.cart);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
      }
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
        path="/product/:productID"
        element={<ProductDetails cart={cart} />}
      />
      <Route
        path="checkout"
        element={<CheckoutPage cart={cart} fetchCart={fetchCart} />}
      />
      <Route path="/checkout/orders" element={<OrdersPage cart={cart} />} />
      <Route path="tracking" element={<TrackingPage cart={cart} />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="sign-up" element={<SignupPage />} />
      <Route path="reset-password" element={<PasswordResetPage />} />
      <Route path="set-new-password/:token" element={<NewPasswordPage />} />
      <Route path="*" element={<Error404 cart={cart} />} />
    </Routes>
  );
}

export default App;
