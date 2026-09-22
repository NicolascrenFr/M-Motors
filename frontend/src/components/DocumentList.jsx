import { useEffect, useState } from "react";
import { authFetch, getCurrentUser } from "../auth";

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!currentUser) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      try {
        const response = await authFetch(
          `/api/documents/${currentUser.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Impossible de récupérer les documents."
          );
        }

        setDocuments(data.documents);
        setError("");
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des documents :",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [currentUser?.id]);

  if (!currentUser) {
    return null;
  }

  return (
    <section className="documents-list-section">
      <div className="documents-container">
        <h2>Mes documents envoyés</h2>

        {loading && (
          <p>
            Chargement de vos documents...
          </p>
        )}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          documents.length === 0 && (
            <p>
              Aucun document envoyé.
            </p>
          )}

        {!loading &&
          !error &&
          documents.length > 0 && (
            <ul>
              {documents.map((document) => (
                <li key={document.id}>
                  <strong>
                    {document.nom_fichier}
                  </strong>

                  {" — "}

                  {document.type_document}

                  {" — "}

                  {new Date(
                    document.created_at
                  ).toLocaleString("fr-FR")}
                </li>
              ))}
            </ul>
          )}
      </div>
    </section>
  );
}

export default DocumentList;