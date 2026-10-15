import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./new-password.css";
import apiClient from "../../services/apiClient";

export function NewPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [redirectPath, setRedirectPath] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useParams();

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      navigate(redirectPath)
      return
    }


    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, navigate, redirectPath]);

  async function handleSubmit(event) {
    setIsLoading(true);
    event.preventDefault();
    try {
      await apiClient.post("/new-password", {
        token: token,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });

      setSuccessMessage("New Password Updated Successfully!");
      setRedirectPath("/login")
      setCountdown(5);
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data?.message || "An error occured");
        setTimeout(() => {
          setErrorMessage("");
        }, 3000);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMessage("Unable to connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="new-password-page">
      <section
        className="new-password-card"
        aria-labelledby="new-password-heading"
      >
        <div className="new-password-card__header">
          <Link
            className="new-password-brand"
            to="/"
            aria-label="Go to homepage"
          >
            ShopEasy
          </Link>
          <Link className="new-password-login-link" to="/login">
            Log in
          </Link>
        </div>

        <div className="new-password-card__content">
          <p className="new-password-eyebrow">CREATE NEW PASSWORD</p>
          <h1 id="new-password-heading">Choose a new password</h1>
          <p className="new-password-subtitle">
            Use a password you have not used before.
          </p>

          {!token && (
            <p className="form-error" role="alert">
              Your verification session is missing. Please verify your account
              again.
            </p>
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

          {successMessage && (
            <div className="header-success" role="alert">
              <span className="header-success-icon" aria-hidden="true">
                !
              </span>
              <div className="header-error-content">
                <span>{successMessage}</span>
                <button
                  className="header-success-close"
                  type="button"
                  onClick={() => setSuccessMessage("")}
                  aria-label="Dismiss error"
                >
                  &times;
                </button>
                {countdown !== null && countdown > 0 && (
                  <span> Redirecting in {countdown}...</span>
                )}
              </div>
            </div>
          )}

          <form className="new-password-form" onSubmit={handleSubmit}>
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength="6"
              placeholder="Enter a new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <p className="new-password-hint">Use at least 6 characters.</p>

            <label htmlFor="confirm-new-password">Confirm new password</label>
            <input
              id="confirm-new-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <button
              className="new-password-button"
              type="submit"
              disabled={isLoading || !token}
            >
              {isLoading ? "Updating..." : "Update password"}
            </button>
          </form>

          <p className="verify-again-prompt">
            Need to verify again?{" "}
            <Link to="/reset-password">Back to account verification</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
