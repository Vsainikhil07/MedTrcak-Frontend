
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API = "http://localhost:8080/api";

const navigation = [
  { label: "Dashboard", path: "/", icon: "grid" },
  { label: "Medicines", path: "/medicines", icon: "pill" },
  { label: "Prescriptions", path: "/prescriptions", icon: "file" },
  { label: "Reminders", path: "/reminders", icon: "bell" },
  { label: "Pharmacy Locator", path: "/pharmacy", icon: "map" },
];

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    pill: <><path d="m10 14 4-4" /><path d="M7.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7l-6 6Z" transform="translate(3 -2)" /><path d="m8 8 8 8" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grid}
    </svg>
  );
}

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("medtrackUser") || "{}");
  } catch {
    return {};
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => getUser(), []);
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("medtrackToken");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setLoadError("");

      const request = async (endpoint) => {
        const response = await fetch(`${API}/${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `${endpoint}: ${response.status} ${response.statusText}`
          );
        }

        if (response.status === 204) return [];
        return response.json();
      };

      const results = await Promise.allSettled([
        request("medicines"),
        request("prescriptions"),
        request("reminders"),
      ]);

      if (cancelled) return;

      if (results[0].status === "fulfilled") {
        setMedicines(getArray(results[0].value));
      }

      if (results[1].status === "fulfilled") {
        setPrescriptions(getArray(results[1].value));
      }

      if (results[2].status === "fulfilled") {
        setReminders(getArray(results[2].value));
      }

      if (results.some((result) => result.status === "rejected")) {
        setLoadError(
          "Some information could not be loaded. Check your backend connection and try refreshing."
        );
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const activeReminders = reminders.filter(
    (item) => item.completed !== true && item.isCompleted !== true
  );

  const displayName = user.name?.trim()?.split(/\s+/)[0] || "there";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const recentItems = [
    ...medicines.map((item) => ({
      id: `medicine-${item.id ?? item.name}`,
      title: item.name || item.medicineName || "Medicine",
      detail: item.dosage || item.strength || "Medicine record",
      category: "Medicine",
      date: item.createdAt || item.updatedAt || item.startDate,
    })),
    ...prescriptions.map((item) => ({
      id: `prescription-${item.id ?? item.name}`,
      title: item.title || item.name || item.doctorName || "Prescription",
      detail: item.doctorName
        ? `Dr. ${item.doctorName}`
        : item.description || "Prescription record",
      category: "Prescription",
      date: item.createdAt || item.date || item.prescriptionDate,
    })),
  ]
    .sort((a, b) => {
      const first = new Date(a.date || 0).getTime();
      const second = new Date(b.date || 0).getTime();
      return second - first;
    })
    .slice(0, 5);

  const handleLogout = () => {
    sessionStorage.removeItem("medtrackToken");
    sessionStorage.removeItem("medtrackUser");
    navigate("/login", { replace: true });
  };

  return (
    <div className="mt-dashboard">
      <aside className="mt-sidebar">
        <Link to="/" className="mt-brand">
          <span className="mt-brand-mark">
            <Icon name="activity" size={25} />
          </span>
          <span>
            <strong>MedTrack</strong>
            <small>HEALTH MANAGEMENT</small>
          </span>
        </Link>

        <div className="mt-nav-heading">WORKSPACE</div>

        <nav className="mt-nav">
          {navigation.map((item) => {
            const active = item.path === "/";

            return (
              <Link
                to={item.path}
                key={item.path}
                className={`mt-nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {active && <span className="mt-nav-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-sidebar-bottom">
          <div className="mt-help-card">
            <span className="mt-help-icon">
              <Icon name="activity" size={21} />
            </span>
            <strong>Your health, organized.</strong>
            <p>Keep your health records and daily care in one place.</p>
          </div>

          <button className="mt-logout" onClick={handleLogout}>
            <Icon name="logout" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="mt-main">
        <header className="mt-topbar">
          <div className="mt-breadcrumb">
            <span>Workspace</span>
            <span className="mt-crumb-separator">/</span>
            <strong>Dashboard</strong>
          </div>

          <div className="mt-topbar-right">
            <span className="mt-date">
              <Icon name="clock" size={16} />
              {today}
            </span>
            <div className="mt-avatar">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="mt-content">
          <section className="mt-welcome">
            <div>
              <div className="mt-eyebrow">YOUR HEALTH OVERVIEW</div>
              <h1>Good day, {displayName}.</h1>
              <p>Here’s what’s happening with your health records today.</p>
            </div>

            <Link to="/medicines" className="mt-primary-button">
              <Icon name="plus" size={18} />
              Add medicine
            </Link>
          </section>

          {loadError && (
            <div className="mt-alert" role="status">
              <Icon name="activity" size={19} />
              <span>{loadError}</span>
            </div>
          )}

          <section className="mt-stats-grid">
            <article className="mt-stat-card">
              <div className="mt-stat-top">
                <span className="mt-stat-label">Total medicines</span>
                <span className="mt-stat-icon teal">
                  <Icon name="pill" size={21} />
                </span>
              </div>
              <div className="mt-stat-number">
                {loading ? "—" : medicines.length}
              </div>
              <div className="mt-stat-foot">Medicine records</div>
            </article>

            <article className="mt-stat-card">
              <div className="mt-stat-top">
                <span className="mt-stat-label">Prescriptions</span>
                <span className="mt-stat-icon blue">
                  <Icon name="file" size={21} />
                </span>
              </div>
              <div className="mt-stat-number">
                {loading ? "—" : prescriptions.length}
              </div>
              <div className="mt-stat-foot">Saved prescriptions</div>
            </article>

            <article className="mt-stat-card">
              <div className="mt-stat-top">
                <span className="mt-stat-label">Active reminders</span>
                <span className="mt-stat-icon amber">
                  <Icon name="bell" size={21} />
                </span>
              </div>
              <div className="mt-stat-number">
                {loading ? "—" : activeReminders.length}
              </div>
              <div className="mt-stat-foot">Reminders to review</div>
            </article>

            <article className="mt-stat-card">
              <div className="mt-stat-top">
                <span className="mt-stat-label">Health records</span>
                <span className="mt-stat-icon violet">
                  <Icon name="activity" size={21} />
                </span>
              </div>
              <div className="mt-stat-number">
                {loading
                  ? "—"
                  : medicines.length + prescriptions.length}
              </div>
              <div className="mt-stat-foot">Medicines and prescriptions</div>
            </article>
          </section>

          <section className="mt-section-grid">
            <article className="mt-panel mt-activity-panel">
              <div className="mt-panel-heading">
                <div>
                  <h2>Recent health records</h2>
                  <p>Your latest saved information</p>
                </div>
                <span className="mt-panel-heading-icon">
                  <Icon name="activity" size={19} />
                </span>
              </div>

              {loading ? (
                <div className="mt-empty-state">Loading your records…</div>
              ) : recentItems.length === 0 ? (
                <div className="mt-empty-state">
                  <span className="mt-empty-icon">
                    <Icon name="file" size={24} />
                  </span>
                  <strong>No records yet</strong>
                  <p>Your saved medicines and prescriptions will appear here.</p>
                  <Link to="/medicines" className="mt-text-link">
                    Add your first medicine <span>→</span>
                  </Link>
                </div>
              ) : (
                <div className="mt-record-list">
                  {recentItems.map((item) => (
                    <div className="mt-record-row" key={item.id}>
                      <span
                        className={`mt-record-icon ${
                          item.category === "Medicine" ? "teal" : "blue"
                        }`}
                      >
                        <Icon
                          name={item.category === "Medicine" ? "pill" : "file"}
                          size={19}
                        />
                      </span>
                      <div className="mt-record-info">
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </div>
                      <div className="mt-record-meta">
                        <span
                          className={`mt-type-tag ${
                            item.category === "Medicine" ? "teal" : "blue"
                          }`}
                        >
                          {item.category}
                        </span>
                        <small>{formatDate(item.date)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link to="/medicines" className="mt-panel-footer-link">
                View medicines and records <span>→</span>
              </Link>
            </article>

            <article className="mt-panel mt-reminders-panel">
              <div className="mt-panel-heading">
                <div>
                  <h2>Reminder overview</h2>
                  <p>Stay on top of your routine</p>
                </div>
                <span className="mt-panel-heading-icon amber">
                  <Icon name="bell" size={19} />
                </span>
              </div>

              <div className="mt-reminder-summary">
                <div className="mt-reminder-number">
                  {loading ? "—" : activeReminders.length}
                </div>
                <div>
                  <strong>Active reminders</strong>
                  <p>Keep track of your health routine.</p>
                </div>
              </div>

              {loading ? (
                <div className="mt-empty-state compact">Loading reminders…</div>
              ) : activeReminders.length === 0 ? (
                <div className="mt-reminder-empty">
                  <span className="mt-reminder-check">
                    <Icon name="check" size={21} />
                  </span>
                  <div>
                    <strong>All clear for now</strong>
                    <p>No pending reminders to show.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-reminder-list">
                  {activeReminders.slice(0, 4).map((item, index) => (
                    <div
                      className="mt-reminder-row"
                      key={item.id ?? item.title ?? index}
                    >
                      <span className="mt-reminder-dot" />
                      <div>
                        <strong>
                          {item.title ||
                            item.name ||
                            item.medicineName ||
                            "Health reminder"}
                        </strong>
                        <small>
                          {item.time || item.reminderTime || item.date || "Scheduled reminder"}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link to="/reminders" className="mt-panel-footer-link">
                Manage reminders <span>→</span>
              </Link>
            </article>
          </section>

          <section className="mt-quick-section">
            <div className="mt-section-title">
              <div>
                <h2>Quick actions</h2>
                <p>Jump straight to what you need</p>
              </div>
            </div>

            <div className="mt-quick-grid">
              <Link to="/medicines" className="mt-quick-card">
                <span className="mt-quick-icon teal">
                  <Icon name="pill" size={22} />
                </span>
                <span className="mt-quick-copy">
                  <strong>Manage medicines</strong>
                  <small>Add or review medicine records</small>
                </span>
                <Icon name="arrow" size={18} />
              </Link>

              <Link to="/prescriptions" className="mt-quick-card">
                <span className="mt-quick-icon blue">
                  <Icon name="file" size={22} />
                </span>
                <span className="mt-quick-copy">
                  <strong>Prescriptions</strong>
                  <small>View your prescription records</small>
                </span>
                <Icon name="arrow" size={18} />
              </Link>

              <Link to="/reminders" className="mt-quick-card">
                <span className="mt-quick-icon amber">
                  <Icon name="bell" size={22} />
                </span>
                <span className="mt-quick-copy">
                  <strong>Health reminders</strong>
                  <small>Review your reminders</small>
                </span>
                <Icon name="arrow" size={18} />
              </Link>

              <Link to="/pharmacy" className="mt-quick-card">
                <span className="mt-quick-icon violet">
                  <Icon name="map" size={22} />
                </span>
                <span className="mt-quick-copy">
                  <strong>Find a pharmacy</strong>
                  <small>Open the pharmacy locator</small>
                </span>
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          </section>

          <footer className="mt-footer">
            <span>MedTrack · Health management made simpler</span>
            <span>Keep your health information up to date.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
