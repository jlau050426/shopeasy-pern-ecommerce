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
import { AddProductForm } from "./pages/admin/addProductForm";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { EditProductForm } from "./pages/admin/editProductForm";
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient, { initializeCsrf } from "./services/apiClient";
import { socket } from "./socket";

function App() {
  //generate csrf token before starting everything
  useEffect(() => {
    initializeCsrf()
  }, []);

  //state lifted up
  //track cart quantity
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function fetchCart() {
    try {
      const response = await apiClient.get("/cart");
      setCart(response.data.cart || []);
      setIsLoggedIn(true);
    } catch (error) {
      if (error.response?.status === 401) {
        setCart([]);
        setIsLoggedIn(false);
        return;
      }
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
  }, []);

  //websocket initialization
  useEffect(() => {
    function onCartUpdated() {
      fetchCart();
    }
    socket.on("cart:updated", onCartUpdated);
    socket.on("cart:deleted", onCartUpdated);

    return () => {
      socket.off("cart:updated", onCartUpdated);
      socket.off("cart:deleted", onCartUpdated);
    };
  }, []);

  return (
    <Routes>
      {/* Route add page to website  */}
      <Route
        path="/"
        element={
          <HomePage cart={cart} fetchCart={fetchCart} isLoggedIn={isLoggedIn} />
        }
      />
      <Route
        path="/product/:productID"
        element={<ProductDetails cart={cart} isLoggedIn={isLoggedIn} />}
      />
      <Route
        path="/checkout"
        element={<CheckoutPage cart={cart} fetchCart={fetchCart} />}
      />
      <Route
        path="/checkout/orders"
        element={
          <OrdersPage
            cart={cart}
            fetchCart={fetchCart}
            isLoggedIn={isLoggedIn}
          />
        }
      />
      <Route
        path="/tracking"
        element={<TrackingPage cart={cart} isLoggedIn={isLoggedIn} />}
      />
      <Route path="/login" element={<LoginPage fetchCart={fetchCart} />} />
      <Route path="/sign-up" element={<SignupPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
      <Route path="/set-new-password/:token" element={<NewPasswordPage />} />
      <Route path="/admin/products" element={<AdminProductsPage />} />
      <Route
        path="/admin/edit-product/:productID"
        element={<EditProductForm />}
      />
      <Route path="/admin/add-product" element={<AddProductForm />} />
      <Route
        path="*"
        element={<Error404 cart={cart} isLoggedIn={isLoggedIn} />}
      />
    </Routes>
  );
}

export default App;
