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
import { useCallback, useEffect, useState } from "react";
import apiClient, { initializeCsrf } from "./services/apiClient";
import { socket } from "./socket";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  //generate csrf token before starting everything
  useEffect(() => {
    initializeCsrf()
      .catch((error) => console.log(error))   //TODO This is directly copy-paste from Claude. Too Advance for current level (dealing with CSRF)
  }, []);

  //state lifted up
  //track cart   quantity
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function adminValidation() {
      try {
        const response = await apiClient.get("/check-admin");
        if (response.status === 200) {
          setIsAdmin(true);
          setSuccessMessage(response.data?.successMessage || "Welcome Admin");
          setTimeout(() => {
            setSuccessMessage("");
          }, 3000);
        }
      } catch (error) {
        console.log(error);
        if (error.response) {
          if (error.response.status === 401) {
            setIsAdmin(false);
          } else if (error.response.status === 403) {
            setSuccessMessage(
              error.response.data?.errorMessage || "Welcome User",
            );
            setIsAdmin(false);
            setTimeout(() => {
              setSuccessMessage("");
            }, 3000);
          } else {
            setErrorMessage("Failed to Pass Admin Validation");
          }
        } else {
          setErrorMessage("Unable to connect to server");
        }
      }
    }

    adminValidation()
  }, [isLoggedIn])

  //useCallBack will not create new fetchCart function everytime page rendered
  const fetchCart = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
  }, [fetchCart]);

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
  }, [fetchCart]);



  const logout = useCallback(() => {
    setCart([])
    setIsLoggedIn(false)
  }, [])

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

      {successMessage && (
        <div className="header-success" role="alert">
          <span className="header-success-icon" aria-hidden="true">
            !
          </span>
          <span>{successMessage}</span>
          <button
            className="header-success-close"
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}


      <Routes>
        {/* Route add page to website  */}
        <Route path="/" element={<HomePage cart={cart} fetchCart={fetchCart} isLoggedIn={isLoggedIn} reactHandleLogout={logout} isAdmin={isAdmin} />} />
        <Route path="/product/:productID" element={<ProductDetails cart={cart} isLoggedIn={isLoggedIn} reactHandleLogout={logout} isAdmin={isAdmin} />} />
        <Route path="/checkout" element={<CheckoutPage cart={cart} fetchCart={fetchCart} />} />
        <Route path="/checkout/orders" element={<OrdersPage cart={cart} fetchCart={fetchCart} isLoggedIn={isLoggedIn} reactHandleLogout={logout} isAdmin={isAdmin} />} />
        <Route path="/tracking" element={<TrackingPage cart={cart} isLoggedIn={isLoggedIn} reactHandleLogout={logout} isAdmin={isAdmin} />} />
        <Route path="/login" element={<LoginPage fetchCart={fetchCart} />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/set-new-password/:token" element={<NewPasswordPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/edit-product/:productID" element={<EditProductForm />} />
        <Route path="/admin/add-product" element={<AddProductForm />} />
        <Route path="*" element={<Error404 cart={cart} isLoggedIn={isLoggedIn} reactHandleLogout={logout} isAdmin={isAdmin} />} />
      </Routes>

    </>
  );
}

export default App;
