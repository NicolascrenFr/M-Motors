function VehicleCard({ vehicle, onDetails, onEdit }) {    return (
      <article className="vehicle-card">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="vehicle-image"
        />
  
        <div className="vehicle-content">
          <span className="vehicle-type">
            {vehicle.type === "achat" ? "À vendre" : "En location"}
          </span>
  
          <h3>
            {vehicle.brand} {vehicle.model}
          </h3>
  
          <p>
            {vehicle.year} · {vehicle.fuel} · {vehicle.transmission}
          </p>
  
          <div className="vehicle-prices">
            <strong>{vehicle.price.toLocaleString("fr-FR")} €</strong>
  
            <span>
              {vehicle.monthlyPrice} €/mois
            </span>
          </div>
  
          <div className="vehicle-actions">
            <button onClick={() => onDetails(vehicle)}>
              Voir le véhicule
            </button>

            <button onClick={() => onEdit(vehicle)}>
              Modifier le véhicule
            </button>
          </div>

        </div>
      </article>
    );
  }
  
  export default VehicleCard;