import PropTypes from "prop-types";

function VehicleCard({
  vehicle,
  onDetails,
  onEdit,
  onDelete,
  isAdmin,
}) {
      return (
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
                {vehicle.type === "location" && (
                  <div className="vehicle-monthly-price">
                    {vehicle.monthlyPrice} €/mois
                  </div>
                )}
              </span>
            </div>
    
            <div className="vehicle-actions">
              <button onClick={() => onDetails(vehicle)}>
                Voir le véhicule
              </button>

              {isAdmin && (
                <button onClick={() => onEdit(vehicle)}>
                  Modifier le véhicule
                </button>
              )}
            </div>

            {isAdmin && (
              <button onClick={() => onDelete(vehicle.id)}>
                Supprimer le véhicule
              </button>
            )}

          </div>
        </article>
      );
    }
  
    VehicleCard.propTypes = {
      vehicle: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        image: PropTypes.string,
        brand: PropTypes.string.isRequired,
        model: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        fuel: PropTypes.string,
        transmission: PropTypes.string,
        price: PropTypes.number.isRequired,
        monthlyPrice: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]),
      }).isRequired,
      onDetails: PropTypes.func.isRequired,
      onEdit: PropTypes.func.isRequired,
      onDelete: PropTypes.func.isRequired,
      isAdmin: PropTypes.bool.isRequired,
    };

  export default VehicleCard;