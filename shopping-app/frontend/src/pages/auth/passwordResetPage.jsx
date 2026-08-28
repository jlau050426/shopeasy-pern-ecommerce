import { useState } from "react";
import { Link } from "react-router-dom";
import "./password-reset.css";
import apiClient from "../../services/apiClient";

export function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailValidationStatusMessage, setEmailValidationStatusMessage] = useState("")
  const [emailSentMessage, setEmailSentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      const response = await apiClient.post("/reset", {
        email: email,
      });

      if (response.data.status === 200) {
        setEmailValidationStatusMessage(response.data.emailVerifyMessage)
        setEmailSentMessage(response.data.emailSendingMessage)
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

        <h1 id="password-reset-heading">{emailValidationStatusMessage}</h1>
        <h1 id="password-reset-heading">{emailSentMessage}</h1>

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
