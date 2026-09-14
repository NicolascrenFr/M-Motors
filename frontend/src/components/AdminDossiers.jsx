import { useEffect, useState } from "react";

function AdminDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/dossiers");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de récupérer les dossiers."
          );
        }

        setDossiers(data.dossiers);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des dossiers :",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDossiers();
  }, []);

  if (loading) {
    return (
      <section
        className="admin-dossiers-section"
        id="dossiers-clients"
      >
        <div className="admin-dossiers-container">
          <h2>Dossiers clients</h2>
          <p>Chargement des dossiers...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="admin-dossiers-section"
        id="dossiers-clients"
      >
        <div className="admin-dossiers-container">
          <h2>Dossiers clients</h2>
          <p className="error-message">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="admin-dossiers-section"
      id="dossiers-clients"
    >
      <div className="admin-dossiers-container">
        <h2>Dossiers clients</h2>

        <p>
          Consultez les dossiers de financement déposés par les clients.
        </p>

        {dossiers.length === 0 ? (
          <p>Aucun dossier de financement trouvé.</p>
        ) : (
          <div className="dossiers-list">
            {dossiers.map((dossier) => (
              <div className="dossier-card" key={dossier.id}>
                <h3>
                  {dossier.prenom} {dossier.nom}
                </h3>

                <p>
                  <strong>Email :</strong> {dossier.email}
                </p>

                <p>
                  <strong>Véhicule :</strong> {dossier.vehicule}
                </p>

                <p>
                  <strong>Financement :</strong>{" "}
                  {dossier.type_financement}
                </p>

                <p>
                  <strong>Durée :</strong> {dossier.duree} mois
                </p>

                <p>
                  <strong>Statut :</strong> {dossier.statut}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminDossiers;