import { useState } from "react";

function FinancingForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    vehicle: "",
    financingType: "Achat",
    duration: "48",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Dossier de financement :", formData);

    alert("Votre dossier de financement a été créé.");
  };

  return (
    <section className="financing-section" id="financement">
      <div className="financing-container">
        <h2>Créer mon dossier de financement</h2>

        <p>
          Complétez le formulaire pour commencer votre demande de financement.
        </p>

        <form onSubmit={handleSubmit} className="financing-form">
          <div className="form-group">
            <label htmlFor="firstName">Prénom</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Nom</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
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
            <label htmlFor="vehicle">Véhicule</label>
            <select
              id="vehicle"
              name="vehicle"
              value={formData.vehicle}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez un véhicule</option>
              <option value="Peugeot 308">Peugeot 308</option>
              <option value="Renault Austral">Renault Austral</option>
              <option value="BMW Série 3">BMW Série 3</option>
              <option value="Tesla Model 3">Tesla Model 3</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="financingType">Type de financement</label>
            <select
              id="financingType"
              name="financingType"
              value={formData.financingType}
              onChange={handleChange}
            >
              <option value="Achat">Achat</option>
              <option value="Location">Location</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Durée</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
            >
              <option value="24">24 mois</option>
              <option value="36">36 mois</option>
              <option value="48">48 mois</option>
              <option value="60">60 mois</option>
            </select>
          </div>

          <button type="submit" className="financing-button">
            Créer mon dossier
          </button>
        </form>
      </div>
    </section>
  );
}

export default FinancingForm;
