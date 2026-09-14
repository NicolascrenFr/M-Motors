import { useEffect, useState } from "react";

function getCurrentClientId() {
  const clientId = localStorage.getItem("clientId");

  return clientId || "1";
}

function DossierStatus() {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const clientId = getCurrentClientId();

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/dossiers/client/${clientId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de récupérer le dossier."
          );
        }

        setDossier(data.dossier);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du dossier :",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDossier();
  }, [clientId]);

  const statut = dossier?.statut || "";

  const getCurrentStep = () => {
    switch (statut) {
      case "Dossier créé":
        return 1;
      case "Documents reçus":
        return 2;
      case "En cours d'étude":
        return 3;
      case "Dossier validé":
      case "Dossier refusé":
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getCurrentStep();

  const steps = [
    {
      label: "Dossier créé",
      description: "Votre demande a bien été enregistrée.",
    },
    {
      label: "Documents reçus",
      description: "Les documents nécessaires ont été transmis.",
    },
    {
      label: "Étude du dossier",
      description: "Votre dossier est actuellement en cours d'étude.",
    },
    {
      label:
        statut === "Dossier validé" || statut === "Dossier refusé"
          ? statut
          : "Décision",
      description:
        statut === "Dossier validé"
          ? "Votre dossier a été accepté."
          : statut === "Dossier refusé"
          ? "Votre dossier a été refusé."
          : "La décision concernant votre dossier sera affichée ici.",
    },
  ];

  if (loading) {
    return (
      <section className="dossier-status-section" id="suivi-dossier">
        <div className="dossier-status-container">
          <h2>Suivi de mon dossier</h2>
          <p>Chargement de votre dossier...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dossier-status-section" id="suivi-dossier">
        <div className="dossier-status-container">
          <h2>Suivi de mon dossier</h2>
          <p className="error-message">{error}</p>
        </div>
      </section>
    );
  }

  if (!dossier) {
    return (
      <section className="dossier-status-section" id="suivi-dossier">
        <div className="dossier-status-container">
          <h2>Suivi de mon dossier</h2>
          <p>Aucun dossier de financement trouvé.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dossier-status-section" id="suivi-dossier">
      <div className="dossier-status-container">
        <h2>Suivi de mon dossier</h2>

        <p>
          Consultez l'avancement de votre dossier de financement.
        </p>

        <div className="current-status-box">
          <span>Statut actuel</span>
          <strong>{statut}</strong>
        </div>

        <div className="dossier-status">
          {steps.map((step, index) => {
            const stepNumber = index + 1;

            let className = "status-step";

            if (stepNumber < currentStep) {
              className += " completed";
            }

            if (stepNumber === currentStep) {
              className += " current";
            }

            return (
              <div className={className} key={step.label}>
                <span>{stepNumber}</span>

                <div>
                  <h3>{step.label}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {statut === "Dossier validé" && (
          <div className="status-message success">
            ✅ Votre dossier a été validé.
          </div>
        )}

        {statut === "Dossier refusé" && (
          <div className="status-message rejected">
            ⚠️ Votre dossier a été refusé.
          </div>
        )}
      </div>
    </section>
  );
}

export default DossierStatus;