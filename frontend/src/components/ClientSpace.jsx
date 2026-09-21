import { useEffect, useState } from "react";

function getCurrentClientId() {
  return localStorage.getItem("clientId");
}

function ClientSpace() {
  const [client, setClient] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const clientId = getCurrentClientId();
  if (!clientId) {
    return (
      <section
        className="client-space-section"
        id="espace-client"
      >
        <div className="client-space-container">
          <h2>Mon espace client</h2>
          <p>
            Connectez-vous pour accéder à votre espace client.
          </p>
        </div>
      </section>
    );
  }

  useEffect(() => {
    const fetchClientSpace = async () => {
      try {
        const [clientResponse, dossierResponse] = await Promise.all([
          fetch(`http://localhost:3000/api/clients/${clientId}`),
          fetch(`http://localhost:3000/api/dossiers/client/${clientId}`),
        ]);
  
        const clientData = await clientResponse.json();
        const dossierData = await dossierResponse.json();
  
        if (!clientResponse.ok) {
          throw new Error(
            clientData.message ||
              "Impossible de récupérer les informations du client."
          );
        }
  
        if (!dossierResponse.ok) {
          throw new Error(
            dossierData.message ||
              "Impossible de récupérer le dossier."
          );
        }
  
        setClient(clientData.client);
        setDossier(dossierData.dossier);
      } catch (error) {
        console.error(
          "Erreur lors du chargement de l'espace client :",
          error
        );
  
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchClientSpace();
  
    const handleDossierUpdated = () => {
      fetchClientSpace();
    };
  
    window.addEventListener(
      "dossier-updated",
      handleDossierUpdated
    );
  
    return () => {
      window.removeEventListener(
        "dossier-updated",
        handleDossierUpdated
      );
    };
  }, [clientId]);

  if (loading) {
    return (
      <section className="client-space-section" id="espace-client">
        <div className="client-space-container">
          <h2>Mon espace client</h2>
          <p>Chargement de votre espace client...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="client-space-section" id="espace-client">
        <div className="client-space-container">
          <h2>Mon espace client</h2>
          <p className="error-message">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="client-space-section" id="espace-client">
      <div className="client-space-container">
        <h2>Mon espace client</h2>

        {client && (
          <div className="client-info">
            <h3>Mes informations</h3>

            <p>
              <strong>Nom :</strong> {client.nom}
            </p>

            <p>
              <strong>Prénom :</strong> {client.prenom}
            </p>

            <p>
              <strong>Email :</strong> {client.email}
            </p>
          </div>
        )}

        <div className="client-dossier">
          <h3>Mon dossier de financement</h3>

          {dossier ? (
            <>
              <p>
                <strong>Véhicule :</strong> {dossier.vehicule}
              </p>

              <p>
                <strong>Financement :</strong> {dossier.type_financement}
              </p>

              <p>
                <strong>Durée :</strong> {dossier.duree} mois
              </p>

              <p>
                <strong>Statut :</strong> {dossier.statut}
              </p>
            </>
          ) : (
            <p>Aucun dossier de financement.</p>
          )}
        </div>

        <div className="client-documents">
          <h3>Mes documents</h3>

          <p>
            Consultez les documents associés à votre dossier.
          </p>

          <button
            type="button"
            className="financing-button"
            onClick={() => {
              document
                .getElementById("documents")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Consulter mes documents
          </button>
        </div>
      </div>
    </section>
  );
}

export default ClientSpace;