import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

const API_URL = "http://localhost:8080/api/auth/register";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!name || !email || !password) {
      setIsError(true);
      setMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setIsError(true);
      setMessage("Password must contain at least 8 characters.");
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
          name,
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Registration failed. Please try again."
        );
      }

      setMessage(
        data.message || "Account created successfully! Redirecting to login..."
      );

      setForm({
        name: "",
        email: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error) {
      setIsError(true);

      setMessage(
        error.message === "Failed to fetch"
          ? "Unable to connect to the server. Please check that the backend is running."
          : error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-shell">
        <section className="register-visual">
          <div className="register-brand">
            <div className="register-brand-mark">M</div>
            <span>MedTrack</span>
          </div>

          <div className="register-visual-content">
            <span className="register-eyebrow">
              YOUR HEALTH, ORGANIZED
            </span>

            <h1>
              Take control of your
              <span> health journey.</span>
            </h1>

            <p>
              Keep your medicines, prescriptions, and reminders organized
              in one convenient place. Make managing your health simpler
              every day.
            </p>

            <div className="register-benefits">
              <div className="register-benefit">
                <span className="register-check">✓</span>
                <span>Organize your medicines</span>
              </div>

              <div className="register-benefit">
                <span className="register-check">✓</span>
                <span>Keep prescriptions accessible</span>
              </div>

              <div className="register-benefit">
                <span className="register-check">✓</span>
                <span>Manage your medication reminders</span>
              </div>
            </div>
          </div>

          <div className="register-visual-footer">
            SIMPLE HEALTH MANAGEMENT
          </div>
        </section>

        <section className="register-form-panel">
          <div className="register-mobile-brand">
            <div className="register-brand-mark">M</div>
            <span>MedTrack</span>
          </div>

          <div className="register-heading">
            <span className="register-eyebrow">GET STARTED</span>
            <h2>Create your account</h2>
            <p>
              Join MedTrack and make your health management easier.
            </p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                maxLength={100}
                required
                disabled={loading}
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                maxLength={254}
                required
                disabled={loading}
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-password">Password</label>

              <div className="register-password-wrap">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                />

                <button
                  className="register-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <span className="register-hint">
                Use at least 8 characters.
              </span>
            </div>

            {message && (
              <div
                className={`register-message ${
                  isError
                    ? "register-message-error"
                    : "register-message-success"
                }`}
                role={isError ? "alert" : "status"}
              >
                {message}
              </div>
            )}

            <button
              className="register-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading ? "Creating account..." : "Create account"}
              </span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="register-login-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>

          <div className="register-security">
            <span aria-hidden="true">●</span>
            <span>Your health management starts here.</span>
          </div>
        </section>
      </div>
    </div>
  );
}