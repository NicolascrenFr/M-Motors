import { useState } from "react";

function AdminEditVehicle({ vehicle, setVehicleList }) {
  const [formData, setFormData] = useState(vehicle);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:3000/api/vehicles/${formData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brand: formData.brand,
            model: formData.model,
            year: Number(formData.year),
            fuel: formData.fuel,
            transmission: formData.transmission,
            price: Number(formData.price),
            monthlyPrice: Number(formData.monthlyPrice),
            type: formData.type,
            image: formData.image || "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de modifier le véhicule."
        );
      }

      setVehicleList((previousVehicles) =>
        previousVehicles.map((currentVehicle) =>
          currentVehicle.id === data.vehicle.id
            ? {
                ...data.vehicle,
                price: Number(data.vehicle.price),
                monthlyPrice: Number(data.vehicle.monthly_price),
              }
            : currentVehicle
        )
      );

      alert("Le véhicule a été modifié.");
    } catch (error) {
      console.error("Erreur :", error);
      alert(error.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="admin-edit-vehicle-form"
      id="modifier-vehicule"
    >
      <h3>Modifier le véhicule</h3>

      <div className="form-group">
        <label htmlFor="edit-brand">Marque</label>
        <input
          type="text"
          id="edit-brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-model">Modèle</label>
        <input
          type="text"
          id="edit-model"
          name="model"
          value={formData.model}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-year">Année</label>
        <input
          type="number"
          id="edit-year"
          name="year"
          value={formData.year}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-fuel">Motorisation</label>
        <select
          id="edit-fuel"
          name="fuel"
          value={formData.fuel}
          onChange={handleChange}
          required
        >
          <option value="Essence">Essence</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybride">Hybride</option>
          <option value="Électrique">Électrique</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="edit-transmission">Transmission</label>
        <select
          id="edit-transmission"
          name="transmission"
          value={formData.transmission}
          onChange={handleChange}
          required
        >
          <option value="Manuelle">Manuelle</option>
          <option value="Automatique">Automatique</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="edit-price">Prix (€)</label>
        <input
          type="number"
          id="edit-price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-monthlyPrice">Prix mensuel (€)</label>
        <input
          type="number"
          id="edit-monthlyPrice"
          name="monthlyPrice"
          value={formData.monthlyPrice}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-type">Type</label>
        <select
          id="edit-type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="achat">Achat</option>
          <option value="location">Location</option>
        </select>
      </div>

      <button type="submit" className="financing-button">
        Enregistrer les modifications
      </button>
    </form>
  );
}

export default AdminEditVehicle;
