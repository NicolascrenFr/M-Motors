import { useState } from "react";
import { authFetch } from "../auth";

function ProfileModal({ user, onClose, onUserUpdated }) {
  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await authFetch(
        "/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de modifier le profil."
        );
      }

      localStorage.setItem(
        "authUser",
        JSON.stringify(data.client)
      );

      localStorage.setItem(
        "clientId",
        String(data.client.id)
      );

      onUserUpdated(data.client);

      setMessage(data.message);
    } catch (error) {
      console.error(
        "Erreur modification profil :",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      onClick={onClose}
    >
      <div
        className="auth-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>

        <h2>Mon profil</h2>

        <p>
          Modifiez vos informations personnelles.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="profile-prenom">
              Prénom
            </label>

            <input
              type="text"
              id="profile-prenom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-nom">
              Nom
            </label>

            <input
              type="text"
              id="profile-nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-email">
              Adresse e-mail
            </label>

            <input
              type="email"
              id="profile-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {message && (
            <p className="success-message">
              {message}
            </p>
          )}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="financing-button"
            disabled={loading}
          >
            {loading
              ? "Enregistrement..."
              : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;