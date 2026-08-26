import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login-page.css";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
  }

  function handleLogout() {
    setEmail("");
    setPassword("");
    navigate("/");
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-card__header">
          <Link className="login-brand" to="/" aria-label="Go to homepage">
            ShopEasy
          </Link>
          <button className="logout-button" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>

        <div className="login-card__content">
          <p className="login-eyebrow">WELCOME BACK</p>
          <h1 id="login-heading">Log in to your account</h1>
          <p className="login-subtitle">
            Enter your details below to continue shopping.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <a href="#forgot-password">Forgot password?</a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button className="login-button" type="submit">
              Log in
            </button>
          </form>

          <p className="signup-prompt">
            New to ShopEasy? <Link to="/sign-up">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
