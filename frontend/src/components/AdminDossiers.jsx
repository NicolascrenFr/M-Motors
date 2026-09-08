import { useState } from "react";

function AdminDossiers({ onSelectDossier }) {    const dossiers = [
      {
        id: 1,
        client: "Jean Dupont",
        email: "jean.dupont@email.fr",
        vehicle: "Peugeot 308",
        financing: "Location",
        duration: "36 mois",
        status: "En cours d'étude",
      },
      {
        id: 2,
        client: "Marie Martin",
        email: "marie.martin@email.fr",
        vehicle: "Renault Austral",
        financing: "Achat",
        duration: "48 mois",
        status: "Documents reçus",
      },
      {
        id: 3,
        client: "Pierre Durand",
        email: "pierre.durand@email.fr",
        vehicle: "Tesla Model 3",
        financing: "Location",
        duration: "60 mois",
        status: "Dossier créé",
      },
    ];
  
    const [dossiersList, setDossiersList] = useState(dossiers);

    const handleValidate = (id) => {
      setDossiersList((previousDossiers) =>
        previousDossiers.map((dossier) =>
          dossier.id === id
            ? { ...dossier, status: "Dossier validé" }
            : dossier
        )
      );
    };

const handleReject = (id) => {
  setDossiersList((previousDossiers) =>
    previousDossiers.map((dossier) =>
      dossier.id === id
        ? { ...dossier, status: "Dossier refusé" }
        : dossier
    )
  );
};

    return (
      <section className="admin-dossiers-section" id="dossiers-clients">
        <div className="admin-dossiers-container">
          <h2>Dossiers clients</h2>
  
          <p>
            Consultez les dossiers de financement déposés par les clients.
          </p>
  
          <div className="dossiers-list">
            {dossiersList.map((dossier) => (
              <div className="dossier-card" key={dossier.id}>
                <h3>{dossier.client}</h3>
  
                <p>
                  <strong>Email :</strong> {dossier.email}
                </p>
  
                <p>
                  <strong>Véhicule :</strong> {dossier.vehicle}
                </p>
  
                <p>
                  <strong>Financement :</strong> {dossier.financing}
                </p>
  
                <p>
                  <strong>Durée :</strong> {dossier.duration}
                </p>
  
                <p>
                  <strong>Statut :</strong> {dossier.status}
                </p>
                <div className="dossier-actions">
                <button
                  type="button"
                  onClick={() => handleValidate(dossier.id)}
                > 
                  Valider le dossier
                </button>

                <button
                  type="button"
                  onClick={() => handleReject(dossier.id)}
                >
                  Refuser le dossier
                </button>

                <button
                  type="button"
                  onClick={() => onSelectDossier(dossier)}
                >
                  Notifier le client
                </button>
              </div>
            </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  export default AdminDossiers;
