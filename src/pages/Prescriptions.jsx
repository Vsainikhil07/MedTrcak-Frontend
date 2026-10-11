
import { useState, useEffect } from "react";

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctor, setDoctor] = useState("");
  const [medicine, setMedicine] = useState("");
  const [date, setDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const API_URL = "http://localhost:8080/api/prescriptions";

  function getHeaders() {
    const token =
      localStorage.getItem("medtrackToken") ||
      sessionStorage.getItem("medtrackToken");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  const today = new Date();
  const maxDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  async function loadPrescriptions() {
    try {
      const response = await fetch(API_URL, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Loading failed (${response.status})`);
      }

      const data = await response.json();
      setPrescriptions(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      console.error("Load prescriptions error:", error);
      setMessage(
        error.message?.includes("Failed to fetch")
          ? "Cannot connect to the backend. Check Spring Boot."
          : error.message || "Could not load prescriptions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrescriptions();
  }, []);

  function resetForm() {
    setDoctor("");
    setMedicine("");
    setDate("");
    setInstructions("");
    setEditingId(null);
  }

  async function savePrescription(e) {
    e.preventDefault();

    if (!doctor.trim() || !medicine.trim() || !date) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (date > maxDate) {
      setMessage("Prescription date cannot be in the future.");
      return;
    }

    const prescriptionData = {
      doctorName: doctor.trim(),
      medicineName: medicine.trim(),
      instructions: instructions.trim(),
      prescriptionDate: date,
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
          body: JSON.stringify(prescriptionData),
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
      let savedPrescription = null;

      if (responseText) {
        try {
          savedPrescription = JSON.parse(responseText);
        } catch {
          savedPrescription = null;
        }
      }

      if (savedPrescription) {
        if (isEditing) {
          setPrescriptions((previous) =>
            previous.map((item) =>
              item.id === editingId ? savedPrescription : item
            )
          );
        } else {
          setPrescriptions((previous) => [
            ...previous,
            savedPrescription,
          ]);
        }
      } else {
        await loadPrescriptions();
      }

      setMessage(
        isEditing
          ? "Prescription updated successfully!"
          : "Prescription saved successfully!"
      );

      resetForm();
    } catch (error) {
      console.error("Save prescription error:", error);
      setMessage(
        error.message?.includes("Failed to fetch")
          ? "Cannot connect to the backend. Check Spring Boot and CORS."
          : error.message || "Failed to save prescription."
      );
    } finally {
      setSaving(false);
    }
  }

  function editPrescription(item) {
    setEditingId(item.id);
    setDoctor(item.doctorName || "");
    setMedicine(item.medicineName || "");
    setDate(item.prescriptionDate || "");
    setInstructions(item.instructions || "");
    setMessage("Update the details below and save your changes.");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deletePrescription(id) {
    if (
      !window.confirm("Are you sure you want to delete this prescription?")
    ) {
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
          `Delete failed (${response.status}). ${errorText}`
        );
      }

      setPrescriptions((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setMessage("Prescription deleted successfully!");
    } catch (error) {
      console.error("Delete prescription error:", error);
      setMessage(error.message || "Failed to delete prescription.");
    } finally {
      setDeletingId(null);
    }
  }

  const isSuccess = /successfully!/i.test(message);

  return (
    <div className="page prescriptions-page">
      <div className="prescriptions-heading">
        <div>
          <span className="prescriptions-eyebrow">
            HEALTH RECORDS
          </span>
          <h2>My Prescriptions</h2>
          <p className="subtitle">
            Keep your prescription information organized and easy to find.
          </p>
        </div>

        <div className="prescriptions-count">
          <span className="prescriptions-count-icon">▤</span>
          <div>
            <strong>{prescriptions.length}</strong>
            <span>Saved records</span>
          </div>
        </div>
      </div>

      <section className="prescription-form-card">
        <div className="prescription-section-heading">
          <div className="prescription-section-icon">＋</div>
          <div>
            <h3>
              {editingId !== null
                ? "Edit prescription"
                : "Add a prescription"}
            </h3>
            <p>
              Record the details from your doctor's prescription.
            </p>
          </div>
        </div>

        <form className="prescription-form" onSubmit={savePrescription}>
          <label>
            Doctor's name <span className="required-mark">*</span>
            <input
              type="text"
              placeholder="e.g. Dr. Kumar"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              required
            />
          </label>

          <label>
            Medicine / prescription details{" "}
            <span className="required-mark">*</span>
            <input
              type="text"
              placeholder="Enter medicine or details"
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
              required
            />
          </label>

          <label>
            Prescription date <span className="required-mark">*</span>
            <input
              type="date"
              value={date}
              max={maxDate}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label className="prescription-instructions-field">
            Instructions <span className="optional-mark">(optional)</span>
            <textarea
              placeholder="Add any instructions written on the prescription"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </label>

          <div className="prescription-form-actions">
            <button
              type="submit"
              className="primary-btn prescription-save-btn"
              disabled={saving || deletingId !== null}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                ? "Save changes"
                : "+ Add prescription"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="prescription-cancel-btn"
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
          className={`prescription-message ${
            isSuccess ? "success" : "notice"
          }`}
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

      <section className="prescription-list-section">
        <div className="prescription-list-heading">
          <div>
            <h3>Saved prescriptions</h3>
            <p>Your recorded prescription details.</p>
          </div>

          <span className="prescription-total-badge">
            {prescriptions.length} total
          </span>
        </div>

        {loading ? (
          <div className="prescription-state">
            <div className="prescription-loader" />
            <p>Loading your prescriptions...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="prescription-state">
            <div className="prescription-empty-icon">▤</div>
            <h4>No prescriptions yet</h4>
            <p>
              Add your first prescription using the form above.
            </p>
          </div>
        ) : (
          <div className="prescription-list">
            {prescriptions.map((item) => (
              <article className="prescription-card" key={item.id}>
                <div className="prescription-card-icon">▤</div>

                <div className="prescription-card-content">
                  <div className="prescription-card-title-row">
                    <h4>{item.medicineName}</h4>
                    <span className="prescription-record-label">
                      PRESCRIPTION
                    </span>
                  </div>

                  <div className="prescription-details-grid">
                    <div>
                      <span className="prescription-detail-label">
                        DOCTOR
                      </span>
                      <p>{item.doctorName || "Not specified"}</p>
                    </div>

                    <div>
                      <span className="prescription-detail-label">
                        PRESCRIPTION DATE
                      </span>
                      <p>{item.prescriptionDate || "Not specified"}</p>
                    </div>
                  </div>

                  {item.instructions && (
                    <div className="prescription-instructions">
                      <span>Instructions</span>
                      <p>{item.instructions}</p>
                    </div>
                  )}

                  <div className="prescription-card-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => editPrescription(item)}
                      disabled={saving || deletingId !== null}
                    >
                      <span aria-hidden="true">✎</span> Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deletePrescription(item.id)}
                      disabled={saving || deletingId !== null}
                    >
                      <span aria-hidden="true">⌫</span>
                      {deletingId === item.id
                        ? "Deleting..."
                        : "Delete"}
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

export default Prescriptions;
