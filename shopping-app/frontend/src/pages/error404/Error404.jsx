import { Link, useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import "./Error404.css";

export function Error404({ cart = [], isLoggedIn, reactHandleLogout, isAdmin }) {
  const navigate = useNavigate();

  return (
    <>
      <title>404 - Page Not Found | Ecommerce</title>
      <Header cart={cart} isLoggedIn={isLoggedIn} reactHandleLogout={reactHandleLogout} isAdmin={isAdmin}/>

      <div className="error-page-container">
        <div className="error-card">
          {/* Visual Illustration */}
          <div className="error-illustration">
            <svg
              className="error-svg"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background Glow */}
              <circle cx="80" cy="80" r="70" fill="#E8F5E9" />

              {/* Shopping Cart Body */}
              <path
                d="M45 50H120L108 90H55L45 50Z"
                fill="#FFFFFF"
                stroke="#198754"
                strokeWidth="4"
                strokeLinejoin="round"
              />

              {/* Cart Handle & Wheel Base */}
              <path
                d="M32 38H42L52 90H112"
                stroke="#198754"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Wheels */}
              <circle cx="60" cy="106" r="7" fill="#198754" />
              <circle cx="104" cy="106" r="7" fill="#198754" />
              <circle cx="60" cy="106" r="2.5" fill="#FFFFFF" />
              <circle cx="104" cy="106" r="2.5" fill="#FFFFFF" />

              {/* Magnifying Glass Searching Empty Cart */}
              <circle
                cx="88"
                cy="66"
                r="18"
                fill="#FFFFFF"
                stroke="#212529"
                strokeWidth="4"
              />
              <line
                x1="101"
                y1="79"
                x2="118"
                y2="96"
                stroke="#212529"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Question Mark Inside Lens */}
              <text
                x="88"
                y="73"
                fontSize="18"
                fontWeight="bold"
                fill="#198754"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
              >
                ?
              </text>
            </svg>

            <div className="error-badge">404</div>
          </div>

          {/* Heading and Description */}
          <h1 className="error-title">Oops! Page Not Found</h1>
          <p className="error-description">
            We couldn't find the page or product you're looking for. The link might be broken,
            or the item may have been moved or removed.
          </p>

          {/* Action Buttons */}
          <div className="error-actions">
            <Link to="/" className="error-btn error-btn-primary">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Back to Home
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="error-btn error-btn-secondary"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Go Back
            </button>
          </div>

          {/* Divider */}
          <div className="error-divider">
            <span>Or explore these destinations</span>
          </div>

          {/* Quick Links Navigation */}
          <div className="error-quick-links">
            <Link to="/" className="quick-link-card">
              <div className="quick-link-icon">🛍️</div>
              <div className="quick-link-info">
                <div className="quick-link-title">Shop Products</div>
                <div className="quick-link-sub">Browse catalog</div>
              </div>
            </Link>

            <Link to="/checkout/orders" className="quick-link-card">
              <div className="quick-link-icon">📦</div>
              <div className="quick-link-info">
                <div className="quick-link-title">Your Orders</div>
                <div className="quick-link-sub">Track purchases</div>
              </div>
            </Link>

            <Link to="/checkout" className="quick-link-card">
              <div className="quick-link-icon">🛒</div>
              <div className="quick-link-info">
                <div className="quick-link-title">Shopping Cart</div>
                <div className="quick-link-sub">View saved items</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
