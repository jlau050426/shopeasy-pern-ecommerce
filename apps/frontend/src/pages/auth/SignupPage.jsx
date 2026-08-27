import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./sign-up.css";
import axios from "axios";

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post("/sign-up", {
        email: email,
        password: password,
        confirmPassword: confirmPassword
      });

      if(response.status === 201){
        navigate("/login")
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message)
        setEmail(error.response.data.oldInput.email)
        setPassword('')
        setConfirmPassword('')
      }else{
        setErrorMessage("Unable to Connect to Server!")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-card" aria-labelledby="signup-heading">
        <div className="signup-card__header">
          <Link className="signup-brand" to="/" aria-label="Go to homepage">
            ShopEasy
          </Link>
          <Link className="login-link" to="/login">
            Log in
          </Link>
        </div>

        <div className="signup-card__content">
          <p className="signup-eyebrow">{errorMessage}</p>
          <p className="signup-eyebrow">CREATE YOUR ACCOUNT</p>
          <h1 id="signup-heading">Start shopping with us</h1>
          <p className="signup-subtitle">
            Sign up to save your details and keep track of your orders.
          </p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength="6"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <p className="password-hint">Use at least 6 characters.</p>

            <label htmlFor="signup-confirm-password">Confirm password</label>
            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <button
              className="signup-button"
              type="submit"
              disabled={isLoading}
            >
              Create account
            </button>
          </form>

          <p className="login-prompt">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
