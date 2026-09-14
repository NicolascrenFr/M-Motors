import { useEffect, useState } from "react";

function AdminDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

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

  useEffect(() => {
    fetchDossiers();
  }, []);

  const updateStatus = async (id, statut) => {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3000/api/dossiers/${id}/statut`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            statut,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de modifier le statut."
        );
      }

      setDossiers((previousDossiers) =>
        previousDossiers.map((dossier) =>
          dossier.id === id
            ? {
                ...dossier,
                statut: data.dossier.statut,
              }
            : dossier
        )
      );
      
      window.dispatchEvent(
        new CustomEvent("dossier-updated", {
          detail: data.dossier,
        })
      );
      
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut :",
        error
      );

      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

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

  return (
    <section
      className="admin-dossiers-section"
      id="dossiers-clients"
    >
      <div className="admin-dossiers-container">
        <h2>Dossiers clients</h2>

        <p>
          Consultez et traitez les dossiers de financement déposés
          par les clients.
        </p>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

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

                <div className="dossier-actions">
                  <button
                    type="button"
                    onClick={() =>
                      updateStatus(dossier.id, "Dossier validé")
                    }
                    disabled={
                      updatingId === dossier.id ||
                      dossier.statut === "Dossier validé"
                    }
                  >
                    Valider le dossier
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateStatus(dossier.id, "Dossier refusé")
                    }
                    disabled={
                      updatingId === dossier.id ||
                      dossier.statut === "Dossier refusé"
                    }
                  >
                    Refuser le dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminDossiers;