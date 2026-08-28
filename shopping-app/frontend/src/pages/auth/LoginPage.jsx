import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login-page.css";
import apiClient from "../../services/apiClient";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true); //once button pressed, isLoading = true
    //axios post email and password
    try {
      const response = await apiClient.post("/login", {
        email: email,
        password: password,
      });

      if (response.status === 200) {
        navigate("/");
      }
    } catch (error) {
      console.log(error);
      if (error.response) {
        setErrorMessage(error.response.data?.message || "An error occured");
        if (error.response.data?.oldInput?.email) {
          setEmail(error.response.data.oldInput.email); 
        }
      } else {
        setErrorMessage("Unable to Connect to Server");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await apiClient.post("/logout");
      setEmail("");
      setPassword("");
      navigate("/login");
    } catch (error) {
      console.log(error);
      if (error.response) {
        setErrorMessage(error.response.data?.message || "An error occured");
      } else {
        setErrorMessage("Unable to Connect to Server!")
      }
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-card__header">
          <Link className="login-brand" to="/" aria-label="Go to homepage">
            ShopEasy
          </Link>
          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>

        <div className="login-card__content">
          <p className="login-eyebrow">{errorMessage}</p>
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
              <Link to="/reset-password">Forgot password?</Link>
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

            <button className="login-button" type="submit" disabled={isLoading}>
              {isLoading ? "Logging-in" : "Log in"}
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
