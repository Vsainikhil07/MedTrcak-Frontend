
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Login from "./Login";
import Register from "./Register";
import Medicines from "./pages/Medicines";
import Prescriptions from "./pages/Prescriptions";
import Reminders from "./pages/Reminders";
import PharmacyLocator from "./pages/PharmacyLocator";

import "./App.css";

function isLoggedIn() {
  return Boolean(
    localStorage.getItem("medtrackToken") &&
      localStorage.getItem("medtrackUser")
  );
}

function ProtectedRoute() {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/login" replace />;
}

function Dashboard() {
  let userData = {};

  try {
    userData = JSON.parse(localStorage.getItem("medtrackUser") || "{}");
  } catch {
    userData = {};
  }

  const userName =
    userData.name?.trim()?.split(" ")[0] ||
    userData.fullName?.trim()?.split(" ")[0] ||
    "there";

  const cards = [
    {
      path: "/medicines",
      icon: "✚",
      label: "YOUR MEDICATION",
      title: "Medicines",
      description: "Keep your medicines and dosage details organized.",
      action: "Manage medicines",
      theme: "mint",
    },
    {
      path: "/prescriptions",
      icon: "▤",
      label: "YOUR RECORDS",
      title: "Prescriptions",
      description: "Access and organize your prescription records.",
      action: "View prescriptions",
      theme: "blue",
    },
    {
      path: "/reminders",
      icon: "◷",
      label: "STAY ON TRACK",
      title: "Reminders",
      description: "Keep track of your medication schedule.",
      action: "View reminders",
      theme: "peach",
    },
    {
      path: "/pharmacy",
      icon: "⌖",
      label: "NEARBY CARE",
      title: "Pharmacy Locator",
      description: "Find nearby pharmacies and directions.",
      action: "Find pharmacies",
      theme: "lavender",
    },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <span className="dashboard-eyebrow">
            YOUR PERSONAL HEALTH SPACE
          </span>
          <h1>Welcome back, {userName}.</h1>
          <p>Everything you need to manage your health, in one place.</p>
        </div>

        <div
          className="dashboard-profile"
          aria-label={`Signed in as ${userName}`}
        >
          <span className="dashboard-avatar">
            {userName.charAt(0).toUpperCase()}
          </span>
          <div>
            <strong>{userName}</strong>
            <span>MedTrack member</span>
          </div>
        </div>
      </header>

      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-tag">
            <span className="dashboard-live-dot" />
            YOUR HEALTH, ORGANIZED
          </span>

          <h2>A simpler way to care for yourself.</h2>

          <p>
            Keep your health information organized, stay on top of your
            medicines, and find care when you need it.
          </p>

          <Link to="/medicines" className="dashboard-hero-button">
            Explore medicines <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="dashboard-hero-art" aria-hidden="true">
          <div className="dashboard-orbit dashboard-orbit-one" />
          <div className="dashboard-orbit dashboard-orbit-two" />
          <div className="dashboard-medical-symbol">+</div>
          <div className="dashboard-floating-card">
            <span className="dashboard-floating-icon">✓</span>
            <div>
              <strong>Health management</strong>
              <span>All in one place</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow">YOUR WORKSPACE</span>
            <h2>Explore MedTrack</h2>
            <p>Choose what you would like to manage today.</p>
          </div>
        </div>

        <div className="dashboard-cards">
          {cards.map((card) => (
            <Link
              to={card.path}
              className="dashboard-card"
              key={card.path}
            >
              <div className="dashboard-card-top">
                <span className={`dashboard-card-icon ${card.theme}`}>
                  {card.icon}
                </span>
                <span className="dashboard-card-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>

              <span className="dashboard-card-label">{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>

              <span className="dashboard-card-action">
                {card.action} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="dashboard-footer">
        <span className="dashboard-footer-mark">M+</span>
        <p>MedTrack · Your health, organized.</p>
      </footer>
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem("medtrackToken");
    localStorage.removeItem("medtrackUser");
    sessionStorage.removeItem("medtrackToken");
    sessionStorage.removeItem("medtrackUser");

    navigate("/login", { replace: true });
  }

  const navigationItems = [
    { path: "/", label: "Dashboard", icon: "⌂" },
    { path: "/medicines", label: "Medicines", icon: "✚" },
    { path: "/prescriptions", label: "Prescriptions", icon: "▤" },
    { path: "/reminders", label: "Reminders", icon: "◷" },
    { path: "/pharmacy", label: "Pharmacy Locator", icon: "⌖" },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Link to="/" className="app-brand">
          <span className="app-brand-mark">M+</span>
          <span>MedTrack</span>
        </Link>

        <span className="sidebar-section-label">WORKSPACE</span>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
              aria-current={
                location.pathname === item.path ? "page" : undefined
              }
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="sidebar-help-icon">♥</span>
            <strong>Your health matters.</strong>
            <p>Stay organized, one step at a time.</p>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span aria-hidden="true">↪</span> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login and registration can always be opened directly. */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protect all application pages. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/pharmacy" element={<PharmacyLocator />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
