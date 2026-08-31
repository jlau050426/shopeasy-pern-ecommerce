import { useState } from "react";
import { Link } from "react-router-dom";
import "./password-reset.css";
import apiClient from "../../services/apiClient";

export function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      const response = await apiClient.post("/reset", {
        email: email,
      });

      if (response.status === 200) {
        setEmailMessage(response.data.message);
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data?.message || "An error occured");
        setEmail("");
      } else {
        setErrorMessage("Unable to connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="password-reset-page">
      <section
        className="password-reset-card"
        aria-labelledby="password-reset-heading"
      >
        <div className="password-reset-card__header">
          <Link
            className="password-reset-brand"
            to="/"
            aria-label="Go to homepage"
          >
            ShopEasy
          </Link>
          <Link className="password-reset-login-link" to="/login">
            Log in
          </Link>
        </div>

        {emailMessage && (
          <div className="header-success" role="alert">
            <span className="header-success-icon" aria-hidden="true">
              !
            </span>
            <span>{emailMessage}</span>
            <button
              className="header-success-close"
              type="button"
              onClick={() => setEmailMessage("")}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

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

        <div className="password-reset-card__content">
          <p className="password-reset-eyebrow">ACCOUNT RECOVERY</p>
          <h1 id="password-reset-heading">Verify your account</h1>
          <p className="password-reset-subtitle">
            Enter your email address to continue.
          </p>

          <form className="password-reset-form" onSubmit={handleSubmit}>
            <label htmlFor="reset-email">Email address</label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button
              className="password-reset-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Continue"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
