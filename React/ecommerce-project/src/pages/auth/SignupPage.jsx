import { useState } from "react";
import { Link } from "react-router-dom";
import "./sign-up.css";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
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

            <button className="signup-button" type="submit">
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
