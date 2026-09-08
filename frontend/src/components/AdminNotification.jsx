import { useState } from "react";

function AdminNotification({ dossier }) {
  const [messageSent, setMessageSent] = useState(false);

  const handleSendNotification = () => {
    setMessageSent(true);
  };

  if (!dossier) {
    return null;
  }

  const isAccepted = dossier.status === "Dossier validé";

  const message = isAccepted
    ? `Bonjour ${dossier.client},

Votre dossier de financement pour le véhicule ${dossier.vehicle} a été accepté.

Vous pouvez maintenant poursuivre votre démarche auprès de M-Motors.

Cordialement,
M-Motors`
    : `Bonjour ${dossier.client},

Votre dossier de financement pour le véhicule ${dossier.vehicle} a été refusé après étude.

Nous vous invitons à contacter M-Motors pour obtenir davantage d'informations.

Cordialement,
M-Motors`;

  return (
    <section className="admin-notification-section">
      <div className="admin-notification-container">
        <h2>Notifier le client</h2>

        <p>
          Résultat du dossier de <strong>{dossier.client}</strong>
        </p>

        <p>
          <strong>Statut :</strong> {dossier.status}
        </p>

        <div className="notification-preview">
          <h3>Message qui sera envoyé</h3>

          <p>{message}</p>
        </div>

        <button
          type="button"
          onClick={handleSendNotification}
          className="financing-button"
        >
          Envoyer le message au client
        </button>

        {messageSent && (
          <p className="notification-success">
            Le message a bien été envoyé au client.
          </p>
        )}
      </div>
    </section>
  );
}

export default AdminNotification;