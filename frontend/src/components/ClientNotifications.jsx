import { useEffect, useState } from "react";

function getCurrentClientId() {
  return localStorage.getItem("clientId");
}

function ClientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const clientId = getCurrentClientId();
  if (!clientId) {
    return (
      <section
        className="client-notifications-section"
        id="notifications"
      >
        <div className="client-notifications-container">
          <h2>Mes notifications</h2>
          <p>
            Connectez-vous pour consulter vos notifications.
          </p>
        </div>
      </section>
    );
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/notifications/client/${clientId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de récupérer les notifications."
        );
      }

      setNotifications(data.notifications);
      setError("");
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notifications :",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNotificationCreated = () => {
      fetchNotifications();
    };

    window.addEventListener(
      "notification-created",
      handleNotificationCreated
    );

    return () => {
      window.removeEventListener(
        "notification-created",
        handleNotificationCreated
      );
    };
  }, [clientId]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/notifications/${id}/read`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de marquer la notification comme lue."
        );
      }

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                lu: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Erreur lors de la lecture de la notification :",
        error
      );
    }
  };

  if (loading) {
    return (
      <section
        className="client-notifications-section"
        id="notifications"
      >
        <div className="client-notifications-container">
          <h2>Mes notifications</h2>
          <p>Chargement de vos notifications...</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="client-notifications-section"
      id="notifications"
    >
      <div className="client-notifications-container">
        <h2>Mes notifications</h2>

        <p>
          Retrouvez ici les informations concernant vos dossiers
          de financement.
        </p>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {!error && notifications.length === 0 && (
          <div className="notification-empty">
            <p>
              Vous n'avez aucune notification pour le moment.
            </p>
          </div>
        )}

        <div className="notifications-list">
          {notifications.map((notification) => (
            <article
              className={`notification-card ${
                notification.lu ? "read" : "unread"
              }`}
              key={notification.id}
            >
              <div className="notification-card-header">
                <strong>
                  {notification.statut}
                </strong>

                {!notification.lu && (
                  <span className="notification-badge">
                    Nouveau
                  </span>
                )}
              </div>

              <p className="notification-message">
                {notification.message}
              </p>

              <small>
                Reçu le{" "}
                {new Date(
                  notification.created_at
                ).toLocaleString("fr-FR")}
              </small>

              {!notification.lu && (
                <button
                  type="button"
                  onClick={() =>
                    markAsRead(notification.id)
                  }
                >
                  Marquer comme lue
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ClientNotifications;
