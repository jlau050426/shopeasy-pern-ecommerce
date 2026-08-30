import { Link } from "react-router-dom";
import "./header.css";
import { cartQuantity } from "../utils/cartQuantity";
import apiClient from "../services/apiClient";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function Header({
  cart = [],
  search = "",
  setSearch = () => {},
  isLoggedIn,
}) {
  const totalQuantity = cartQuantity(cart);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

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

        {isLoggedIn ? (
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
    </>
  );
}
