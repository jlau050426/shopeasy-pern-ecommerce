import { useState } from "react";
import { Link } from "react-router-dom";
import "./password-reset.css";
import axios from "axios";

export function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      await axios.post("/reset", {
        email: email,
      });

    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message);
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

        <div className="password-reset-card__content">
          <p className="password-reset-eyebrow">ACCOUNT RECOVERY</p>
          <h1 id="password-reset-heading">Verify your account</h1>
          <p className="password-reset-subtitle">
            Enter your email address to continue.
          </p>

          {errorMessage && (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          )}

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
