import { useState } from "react";

function AdminNotification({ dossier }) {
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState("");

  if (!dossier) {
    return null;
  }

  const clientName = `${dossier.prenom} ${dossier.nom}`;

  const isAccepted = dossier.statut === "Dossier validé";
  const isRejected = dossier.statut === "Dossier refusé";

  const canNotify = isAccepted || isRejected;

  const message = isAccepted
    ? `Bonjour ${clientName},

Votre dossier de financement pour le véhicule ${dossier.vehicule} a été accepté.

Vous pouvez maintenant poursuivre votre démarche auprès de M-Motors.

Cordialement,
M-Motors`
    : `Bonjour ${clientName},

Votre dossier de financement pour le véhicule ${dossier.vehicule} a été refusé après étude.

Nous vous invitons à contacter M-Motors pour obtenir davantage d'informations.

Cordialement,
M-Motors`;

  const handleSendNotification = async () => {
    if (!canNotify) {
      setError(
        "Le dossier doit être validé ou refusé avant d'envoyer une notification."
      );
      return;
    }

    setSending(true);
    setMessageSent(false);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:3000/api/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dossier_id: dossier.id,
            client_id: dossier.client_id,
            message,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible d'envoyer la notification."
        );
      }

      setMessageSent(true);

      window.dispatchEvent(
        new CustomEvent("notification-created", {
          detail: data.notification,
        })
      );
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la notification :",
        error
      );

      setError(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="admin-notification-section"
      id="notification-client"
    >
      <div className="admin-notification-container">
        <h2>Notifier le client</h2>

        <p>
          Résultat du dossier de{" "}
          <strong>{clientName}</strong>
        </p>

        <p>
          <strong>Statut :</strong> {dossier.statut}
        </p>

        <div className="notification-preview">
          <h3>Message à envoyer</h3>

          <p className="notification-message">
            {message}
          </p>
        </div>

        {!canNotify && (
          <p className="error-message">
            Une notification peut être envoyée uniquement après
            la validation ou le refus du dossier.
          </p>
        )}

        <button
          type="button"
          onClick={handleSendNotification}
          className="financing-button"
          disabled={!canNotify || sending || messageSent}
        >
          {sending
            ? "Envoi en cours..."
            : messageSent
            ? "Notification envoyée"
            : "Envoyer le message au client"}
        </button>

        {messageSent && (
          <p className="notification-success">
            La notification a été enregistrée et est maintenant
            disponible dans l'espace client.
          </p>
        )}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

export default AdminNotification;
