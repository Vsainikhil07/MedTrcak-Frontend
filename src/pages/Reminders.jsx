
import { useState, useEffect } from "react";

function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [medicineName, setMedicineName] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const API_URL = "http://localhost:8080/api/reminders";

  function getHeaders() {
    const token =
      localStorage.getItem("medtrackToken") ||
      sessionStorage.getItem("medtrackToken");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function loadReminders() {
    try {
      const response = await fetch(API_URL, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Loading failed (${response.status}). ${
            errorText || "Check your backend."
          }`
        );
      }

      const data = await response.json();
      setReminders(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      console.error("Load reminders error:", error);
      setMessage(
        error.message?.includes("Failed to fetch")
          ? "Cannot connect to the backend. Check Spring Boot and CORS."
          : error.message || "Could not load reminders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReminders();
  }, []);

  function resetForm() {
    setMedicineName("");
    setReminderTime("");
    setFrequency("Daily");
    setEditingId(null);
  }

  async function saveReminder(event) {
    event.preventDefault();

    if (!medicineName.trim() || !reminderTime || !frequency) {
      setMessage("Please complete all fields.");
      return;
    }

    const reminderData = {
      medicineName: medicineName.trim(),
      reminderTime,
      frequency,
    };

    setSaving(true);
    setMessage("");

    try {
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: getHeaders(),
          body: JSON.stringify(reminderData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Save failed (${response.status}). ${
            errorText || "Check your backend."
          }`
        );
      }

      const responseText = await response.text();
      let savedReminder = null;

      if (responseText) {
        try {
          savedReminder = JSON.parse(responseText);
        } catch {
          savedReminder = null;
        }
      }

      if (savedReminder) {
        if (isEditing) {
          setReminders((previous) =>
            previous.map((item) =>
              item.id === editingId ? savedReminder : item
            )
          );
        } else {
          setReminders((previous) => [...previous, savedReminder]);
        }
      } else {
        await loadReminders();
      }

      setMessage(
        isEditing
          ? "Reminder updated successfully!"
          : "Reminder added successfully!"
      );

      resetForm();
    } catch (error) {
      console.error("Save reminder error:", error);
      setMessage(
        error.message?.includes("Failed to fetch")
          ? "Cannot connect to the backend. Check Spring Boot and CORS."
          : error.message || "Failed to save reminder."
      );
    } finally {
      setSaving(false);
    }
  }

  function editReminder(item) {
    setEditingId(item.id);
    setMedicineName(item.medicineName || "");
    setReminderTime(
      typeof item.reminderTime === "string"
        ? item.reminderTime.slice(0, 5)
        : ""
    );
    setFrequency(item.frequency || "Daily");
    setMessage("Update the details below and save your changes.");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteReminder(id) {
    if (!window.confirm("Are you sure you want to delete this reminder?")) {
      return;
    }

    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Delete failed (${response.status}). ${
            errorText || "Check your backend."
          }`
        );
      }

      setReminders((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setMessage("Reminder deleted successfully!");
    } catch (error) {
      console.error("Delete reminder error:", error);
      setMessage(error.message || "Failed to delete reminder.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatTime(time) {
    if (!time || typeof time !== "string") return "Time not set";

    const parts = time.split(":");
    if (parts.length < 2) return time;

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return time;
    }

    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const isSuccess = /successfully!/i.test(message);

  return (
    <div className="page reminders-page">
      <div className="reminders-heading">
        <div>
          <span className="reminders-eyebrow">DAILY MEDICATION</span>
          <h2>Medicine Reminders</h2>
          <p className="subtitle">
            Organize your medicine schedule in one simple place.
          </p>
        </div>

        <div className="reminders-count">
          <span className="reminders-count-icon">◷</span>
          <div>
            <strong>{reminders.length}</strong>
            <span>Saved reminders</span>
          </div>
        </div>
      </div>

      <section className="reminder-form-card">
        <div className="reminder-section-heading">
          <div className="reminder-section-icon">＋</div>
          <div>
            <h3>{editingId !== null ? "Edit reminder" : "Create a reminder"}</h3>
            <p>Choose the medicine, time, and frequency.</p>
          </div>
        </div>

        <form className="reminder-form" onSubmit={saveReminder}>
          <label>
            Medicine name <span className="reminder-required">*</span>
            <input
              type="text"
              placeholder="e.g. Medicine name"
              value={medicineName}
              onChange={(event) => setMedicineName(event.target.value)}
              required
            />
          </label>

          <label>
            Reminder time <span className="reminder-required">*</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
              required
            />
          </label>

          <label>
            Frequency <span className="reminder-required">*</span>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              required
            >
              <option value="Daily">Daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="Weekly">Weekly</option>
            </select>
          </label>

          <div className="reminder-form-actions">
            <button
              type="submit"
              className="primary-btn reminder-save-btn"
              disabled={saving || deletingId !== null}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                ? "Save changes"
                : "+ Add reminder"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="reminder-cancel-btn"
                onClick={() => {
                  resetForm();
                  setMessage("");
                }}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {message && (
        <div
          className={`reminder-message ${isSuccess ? "success" : "notice"}`}
          role="status"
          aria-live="polite"
        >
          <span>{isSuccess ? "✓" : "ℹ"}</span>
          <p>{message}</p>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      <section className="reminder-list-section">
        <div className="reminder-list-heading">
          <div>
            <h3>Your reminders</h3>
            <p>Review and manage your saved medicine schedules.</p>
          </div>

          <span className="reminder-total-badge">
            {reminders.length} total
          </span>
        </div>

        {loading ? (
          <div className="reminder-state">
            <div className="reminder-loader" />
            <p>Loading your reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="reminder-state">
            <div className="reminder-empty-icon">◷</div>
            <h4>No reminders yet</h4>
            <p>Add a reminder above to organize your medicine schedule.</p>
          </div>
        ) : (
          <div className="reminder-list">
            {reminders.map((item) => (
              <article className="reminder-card" key={item.id}>
                <div className="reminder-card-icon">◷</div>

                <div className="reminder-card-content">
                  <div className="reminder-card-title-row">
                    <h4>{item.medicineName}</h4>
                    <span className="reminder-frequency-badge">
                      {item.frequency}
                    </span>
                  </div>

                  <div className="reminder-time-panel">
                    <span className="reminder-time-symbol">◷</span>
                    <div>
                      <span className="reminder-detail-label">
                        REMINDER TIME
                      </span>
                      <strong>{formatTime(item.reminderTime)}</strong>
                    </div>
                  </div>

                  <div className="reminder-card-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => editReminder(item)}
                      disabled={saving || deletingId !== null}
                    >
                      <span aria-hidden="true">✎</span> Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteReminder(item.id)}
                      disabled={saving || deletingId !== null}
                    >
                      <span aria-hidden="true">⌫</span>
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Reminders;
