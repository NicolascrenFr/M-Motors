import { useEffect, useState } from "react";
import { authFetch, getCurrentUser } from "../auth";

function FinancingForm() {
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    firstName: currentUser?.prenom || "",
    lastName: currentUser?.nom || "",
    email: currentUser?.email || "",
    phone: "",
    vehicle: "",
    financingType: "Achat",
    duration: "48",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getCurrentUser();

    if (user) {
      setFormData((previousData) => ({
        ...previousData,
        firstName: user.prenom || "",
        lastName: user.nom || "",
        email: user.email || "",
      }));
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const user = getCurrentUser();

    if (!user) {
      setError(
        "Vous devez être connecté pour créer un dossier."
      );

      setLoading(false);
      return;
    }

    try {
      const response = await authFetch(
        "/api/dossiers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: user.id,
            vehicule: formData.vehicle,
            type_financement: formData.financingType,
            duree: Number(formData.duration),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de créer le dossier de financement."
        );
      }

      setMessage(
        "Votre dossier de financement a été créé avec succès."
      );

      /*
       * Informe automatiquement ClientSpace et
       * DossierStatus qu'un nouveau dossier existe.
       */
      window.dispatchEvent(
        new CustomEvent("dossier-updated", {
          detail: data.dossier,
        })
      );

      /*
       * On conserve les informations du client
       * mais on réinitialise les choix du dossier.
       */
      setFormData((previousData) => ({
        ...previousData,
        phone: "",
        vehicle: "",
        financingType: "Achat",
        duration: "48",
      }));
    } catch (error) {
      console.error(
        "Erreur lors de la création du dossier :",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <section
        className="financing-section"
        id="financement-form"
      >
        <div className="financing-container">
          <h2>Créer mon dossier de financement</h2>

          <p>
            Connectez-vous pour créer votre dossier de financement.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="financing-section"
      id="financement-form"
    >
      <div className="financing-container">
        <h2>Créer mon dossier de financement</h2>

        <p>
          Complétez le formulaire pour commencer votre demande
          de financement.
        </p>

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

        <form
          onSubmit={handleSubmit}
          className="financing-form"
        >
          <div className="form-group">
            <label htmlFor="firstName">
              Prénom
            </label>

            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">
              Nom
            </label>

            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Adresse e-mail
            </label>

            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Téléphone
            </label>

            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicle">
              Véhicule
            </label>

            <select
              id="vehicle"
              name="vehicle"
              value={formData.vehicle}
              onChange={handleChange}
              required
            >
              <option value="">
                Sélectionnez un véhicule
              </option>

              <option value="Peugeot 308">
                Peugeot 308
              </option>

              <option value="Renault Austral">
                Renault Austral
              </option>

              <option value="BMW Série 3">
                BMW Série 3
              </option>

              <option value="Tesla Model 3">
                Tesla Model 3
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="financingType">
              Choix du financement
            </label>

            <select
              id="financingType"
              name="financingType"
              value={formData.financingType}
              onChange={handleChange}
              required
            >
              <option value="Achat">
                Acheter le véhicule
              </option>

              <option value="Location">
                Louer le véhicule
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">
              Durée
            </label>

            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
            >
              <option value="24">
                24 mois
              </option>

              <option value="36">
                36 mois
              </option>

              <option value="48">
                48 mois
              </option>

              <option value="60">
                60 mois
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="financing-button"
            disabled={loading}
          >
            {loading
              ? "Création du dossier..."
              : "Créer mon dossier"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default FinancingForm;