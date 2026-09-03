import { Link } from "react-router-dom";
import "./header.css";
import { cartQuantity } from "../utils/cartQuantity";
import apiClient from "../services/apiClient";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { socket } from "../socket";

export function Header({
  cart = [],
  search = "",
  setSearch = () => {},
  isLoggedIn,
}) {
  const totalQuantity = cartQuantity(cart);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  //socket logout function
  useEffect(() => {
    function handleSocketLogout(){
      handleLogout()
    }

    socket.on("logout", handleSocketLogout)
    
    return () => {
      socket.off("logout", handleSocketLogout)
    }
  })

  async function handleLogout() {
    try {
      await apiClient.post("/logout");
      navigate("/login");
    } catch (error) {
      console.log(error);
      if (error.response) {
        setErrorMessage(error.response.data?.message || "An error occured");
      } else {
        setErrorMessage("Unable to Connect to Server!");
      }
    }
  }

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

    adminValidation();
  }, []);

  return (
    <>
      <div className="header">
        <div className="left-section">
          <Link to="/" className="header-link">
            <img className="logo" src="/images/logo-white.png" />
            <img className="mobile-logo" src="/images/mobile-logo-white.png" />
          </Link>
        </div>

        <div className="middle-section">
          <input
            className="search-bar"
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />

          <button className="search-button">
            <img className="search-icon" src="/images/icons/search-icon.png" />
          </button>
        </div>

        {isLoggedIn && isAdmin ? (
          //result 2
          <div className="right-section">
            <Link className="orders-link header-link" to="/admin/products">
              <span className="orders-text"> Admin Page </span>
            </Link>
            <Link className="orders-link header-link" to="/checkout/orders">
              <span className="orders-text">Orders</span>
            </Link>

            <Link className="cart-link header-link" to="/checkout">
              <img className="cart-icon" src="/images/icons/cart-icon.png" />
              <div className="cart-quantity">{totalQuantity}</div>
              <div className="cart-text">Cart</div>
            </Link>
            <button
              className="logout-button"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        ) : isLoggedIn ? (
          //result 1
          <div className="right-section">
            <Link className="orders-link header-link" to="/checkout/orders">
              <span className="orders-text">Orders</span>
            </Link>

            <Link className="cart-link header-link" to="/checkout">
              <img className="cart-icon" src="/images/icons/cart-icon.png" />
              <div className="cart-quantity">{totalQuantity}</div>
              <div className="cart-text">Cart</div>
            </Link>
            <button
              className="logout-button"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="right-section">
            <Link className="login-button" to="/login">
              Log In
            </Link>
          </div>
        )}
      </div>

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
    </>
  );
}
