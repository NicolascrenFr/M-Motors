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

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:3000/api/vehicles",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brand: vehicle.brand,
            model: vehicle.model,
            year: Number(vehicle.year),
            fuel: vehicle.fuel,
            transmission: vehicle.transmission,
            price: Number(vehicle.price),
            monthlyPrice: Number(vehicle.monthlyPrice),
            type: vehicle.type,
            image:
              "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible d'ajouter le véhicule."
        );
      }

      setVehicleList((previousVehicles) => [
        ...previousVehicles,
        {
          ...data.vehicle,
          price: Number(data.vehicle.price),
          monthlyPrice: Number(data.vehicle.monthly_price),
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
    } catch (error) {
      console.error("Erreur :", error);
      alert(error.message);
    }
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
