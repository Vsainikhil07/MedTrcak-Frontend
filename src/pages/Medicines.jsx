
import { useState, useEffect } from "react";

const API_URL = "http://localhost:8080/api/medicines";

function getHeaders() {
  const token =
    localStorage.getItem("medtrackToken") ||
    sessionStorage.getItem("medtrackToken");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function loadMedicines() {
    try {
      const response = await fetch(API_URL, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Loading failed (${response.status}). ${errorText}`
        );
      }

      const data = await response.json();
      setMedicines(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      console.error("Load medicines error:", error);
      setMessage(
        error.message?.includes("Failed to fetch")
          ? "Cannot connect to the backend. Check whether Spring Boot is running."
          : error.message || "Could not load medicines."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicines();
  }, []);

  function resetForm() {
    setName("");
    setDosage("");
    setFrequency("Once daily");
    setEditingId(null);
  }

  async function saveMedicine(e) {
    e.preventDefault();

    if (!name.trim() || !dosage.trim()) {
      setMessage("Please enter the medicine name and dosage.");
      return;
    }

    const isEditing = editingId !== null;

    const medicineData = {
      name: name.trim(),
      dosage: dosage.trim(),
      quantity: 1,
      frequency,
    };

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: getHeaders(),
          body: JSON.stringify(medicineData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Save failed (${response.status}). ${errorText}`
        );
      }

      const responseText = await response.text();
      let savedMedicine = null;

      if (responseText) {
        try {
          savedMedicine = JSON.parse(responseText);
        } catch {
          savedMedicine = null;
        }
      }

      if (savedMedicine) {
        if (isEditing) {
          setMedicines((previous) =>
            previous.map((medicine) =>
              medicine.id === editingId
                ? savedMedicine
                : medicine
            )
          );
        } else {
          setMedicines((previous) => [
            ...previous,
            savedMedicine,
          ]);
        }
      } else {
        await loadMedicines();
      }

      setMessage(
        isEditing
          ? "Medicine updated successfully!"
          : "Medicine added successfully!"
      );

      resetForm();
    } catch (error) {
      console.error("Save medicine error:", error);
      setMessage(error.message || "Failed to save medicine.");
    } finally {
      setSaving(false);
    }
  }

  function editMedicine(medicine) {
    setEditingId(medicine.id);
    setName(medicine.name || "");
    setDosage(medicine.dosage || "");
    setFrequency(medicine.frequency || "Once daily");
    setMessage("Update the details below and save your changes.");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteMedicine(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this medicine?"
    );

    if (!confirmed) return;

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

      setMedicines((previous) =>
        previous.filter((medicine) => medicine.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setMessage("Medicine deleted successfully!");
    } catch (error) {
      console.error("Delete medicine error:", error);
      setMessage(error.message || "Failed to delete medicine.");
    } finally {
      setDeletingId(null);
    }
  }

  const isSuccess = /successfully!/i.test(message);

  return (
    <div className="page medicines-page">
      <div className="medicines-heading">
        <div>
          <span className="medicines-eyebrow">
            HEALTH MANAGEMENT
          </span>
          <h2>My Medicines</h2>
          <p className="subtitle">
            Keep your medicine details organized in one place.
          </p>
        </div>

        <div className="medicines-count">
          <span className="medicines-count-icon">✚</span>
          <div>
            <strong>{medicines.length}</strong>
            <span>
              Medicine{medicines.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <section className="medicine-form-card">
        <div className="medicine-section-heading">
          <div className="medicine-section-icon">✚</div>
          <div>
            <h3>
              {editingId !== null ? "Edit medicine" : "Add a medicine"}
            </h3>
            <p>
              {editingId !== null
                ? "Update the information for this medicine."
                : "Enter the details you want to keep track of."}
            </p>
          </div>
        </div>

        <form onSubmit={saveMedicine} className="medicine-form">
          <label>
            Medicine name
            <input
              type="text"
              placeholder="e.g. Paracetamol"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Dosage
            <input
              type="text"
              placeholder="e.g. 500 mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              required
            />
          </label>

          <label>
            Frequency
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option>Once daily</option>
              <option>Twice daily</option>
              <option>Three times daily</option>
              <option>As prescribed</option>
            </select>
          </label>

          <div className="medicine-form-actions">
            <button
              type="submit"
              className="primary-btn medicine-save-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                ? "Save changes"
                : "+ Add medicine"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="medicine-cancel-btn"
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
          className={`medicine-message ${
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

      <section className="medicine-list-section">
        <div className="medicine-list-heading">
          <div>
            <h3>Your medicine list</h3>
            <p>View and manage your saved medicines.</p>
          </div>
          <span className="medicine-total-badge">
            {medicines.length} total
          </span>
        </div>

        {loading ? (
          <div className="medicine-state">
            <div className="medicine-loader" />
            <p>Loading your medicines...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="medicine-state medicine-empty-state">
            <div className="medicine-empty-icon">＋</div>
            <h4>No medicines yet</h4>
            <p>Add your first medicine using the form above.</p>
          </div>
        ) : (
          <div className="medicine-list">
            {medicines.map((medicine) => (
              <article className="medicine-item" key={medicine.id}>
                <div className="medicine-item-icon">✚</div>

                <div className="medicine-item-details">
                  <strong>{medicine.name}</strong>
                  <p>{medicine.dosage}</p>
                  <span className="medicine-frequency">
                    {medicine.frequency || "Frequency not set"}
                  </span>
                </div>

                <div className="medicine-item-actions">
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => editMedicine(medicine)}
                    disabled={saving || deletingId !== null}
                  >
                    <span aria-hidden="true">✎</span>
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => deleteMedicine(medicine.id)}
                    disabled={deletingId !== null || saving}
                  >
                    <span aria-hidden="true">⌫</span>
                    {deletingId === medicine.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Medicines;
