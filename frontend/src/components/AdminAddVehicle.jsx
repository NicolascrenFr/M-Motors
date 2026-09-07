import { useState } from "react";

function AdminAddVehicle({ setVehicleList }) {
  const [vehicle, setVehicle] = useState({
    brand: "",
    model: "",
    year: "",
    fuel: "",
    transmission: "",
    price: "",
    monthlyPrice: "",
    type: "achat",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setVehicle({
      ...vehicle,
      [name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Nouveau véhicule :", vehicle);

    setVehicleList((previousVehicles) => [
        ...previousVehicles,
        {
          ...vehicle,
          id: Date.now(),
          year: Number(vehicle.year),
          price: Number(vehicle.price),
          monthlyPrice: Number(vehicle.monthlyPrice),
        },
      ]);

    alert("Le véhicule a été ajouté au catalogue.");

    setVehicle({
      brand: "",
      model: "",
      year: "",
      fuel: "",
      transmission: "",
      price: "",
      monthlyPrice: "",
      type: "achat",
    });
  };

  return (
    <section className="admin-add-vehicle-section">
      <div className="admin-add-vehicle-container">
        <h2>Ajouter un véhicule</h2>

        <p>
          Ajoutez un nouveau véhicule au catalogue M-Motors.
        </p>

        <form onSubmit={handleSubmit} className="admin-add-vehicle-form">
          <div className="form-group">
            <label htmlFor="brand">Marque</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={vehicle.brand}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Modèle</label>
            <input
              type="text"
              id="model"
              name="model"
              value={vehicle.model}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Année</label>
            <input
              type="number"
              id="year"
              name="year"
              value={vehicle.year}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="fuel">Motorisation</label>
            <select
              id="fuel"
              name="fuel"
              value={vehicle.fuel}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez une motorisation</option>
              <option value="Essence">Essence</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybride">Hybride</option>
              <option value="Électrique">Électrique</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="transmission">Transmission</label>
            <select
              id="transmission"
              name="transmission"
              value={vehicle.transmission}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez une transmission</option>
              <option value="Manuelle">Manuelle</option>
              <option value="Automatique">Automatique</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="price">Prix (€)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={vehicle.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="monthlyPrice">
              Prix mensuel (€)
            </label>
            <input
              type="number"
              id="monthlyPrice"
              name="monthlyPrice"
              value={vehicle.monthlyPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={vehicle.type}
              onChange={handleChange}
              required
            >
              <option value="achat">Achat</option>
              <option value="location">Location</option>
            </select>
          </div>

          <button type="submit" className="financing-button">
            Ajouter le véhicule
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminAddVehicle;