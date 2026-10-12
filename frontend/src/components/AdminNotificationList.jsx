import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../auth";

function AdminNotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/notifications");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de récupérer les notifications."
        );
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleCreated = () => fetchNotifications();
    window.addEventListener("notification-created", handleCreated);

    return () => {
      window.removeEventListener("notification-created", handleCreated);
    };
  }, [fetchNotifications]);

  return (
    <section className="admin-notification-section">
      <div className="admin-notification-container">
        <h2>Historique des notifications</h2>

        {loading && <p>Chargement des notifications...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <p>Aucune notification enregistrée.</p>
        )}

        {!loading && !error && notifications.length > 0 && (
          <ul>
            {notifications.map((notification) => (
              <li key={notification.id}>
                <p>
                  <strong>
                    {notification.prenom} {notification.nom}
                  </strong>
                  {" — "}
                  {notification.email}
                </p>

                <p>
                  <strong>Véhicule :</strong> {notification.vehicule}
                </p>

                <p>
                  <strong>Statut du dossier :</strong> {notification.statut}
                </p>

                <p>{notification.message}</p>

                <p>
                  <strong>État :</strong>{" "}
                  {notification.lu ? "Lue par le client" : "Non lue"}
                </p>

                <small>
                  {new Date(notification.created_at).toLocaleString("fr-FR")}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default AdminNotificationList;