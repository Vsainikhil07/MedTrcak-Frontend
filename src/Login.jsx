
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "http://localhost:8080/api/auth/login";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Login failed. Please check your credentials."
        );
      }

      if (!data.token) {
        throw new Error(
          "The server did not return an authentication token."
        );
      }

      localStorage.setItem("medtrackToken", data.token);

      localStorage.setItem(
        "medtrackUser",
        JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email || normalizedEmail,
        })
      );

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to MedTrack. Check that the backend is running on port 8080."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-visual">
          <div className="login-brand">
            <div className="login-brand-mark">M+</div>
            <span>MedTrack</span>
          </div>

          <div className="login-visual-content">
            <span className="login-eyebrow">
              YOUR HEALTH, ORGANIZED
            </span>

            <h1>
              Better care
              <br />
              starts with
              <br />
              <span>better tracking.</span>
            </h1>

            <p>
              Keep your medicines, prescriptions, and reminders organized
              in one simple place.
            </p>

            <div className="login-health-card">
              <div className="login-health-icon">✚</div>

              <div className="login-health-info">
                <strong>Your health companion</strong>
                <p>Everything important, all in one place.</p>
              </div>

              <span className="login-health-status" aria-label="Active">
                ●
              </span>
            </div>
          </div>

          <div className="login-visual-footer">
            <span>CARE THAT FITS YOUR LIFE</span>
            <span>MEDTRACK © 2026</span>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-mobile-brand">
            <div className="login-brand-mark">M+</div>
            <span>MedTrack</span>
          </div>

          <div className="login-heading">
            <span className="login-eyebrow">WELCOME BACK</span>
            <h2>Sign in to MedTrack</h2>
            <p>Enter your account details to continue.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="login-email">Email address</label>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>

              <div className="login-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-message" role="alert">
                <span aria-hidden="true">!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading ? "Signing in..." : "Sign in to your account"}
              </span>
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="login-register-link">
            New to MedTrack?{" "}
            <Link to="/register">Create an account</Link>
          </div>

          <div className="login-security">
            <span aria-hidden="true">◆</span>
            <span>Sign in to access your MedTrack account.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
