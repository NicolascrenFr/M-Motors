import { useEffect, useState } from "react";

function DocumentList() {
const [documents, setDocuments] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
const fetchDocuments = async () => {
try {
const response = await fetch(
"http://localhost:3000/api/documents/1"
);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Impossible de récupérer les documents."
      );
    }

    setDocuments(data.documents);
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

}, []);

return (
<section className="documents-list-section">
<div className="documents-container">
<h2>Mes documents envoyés</h2>

    {loading && <p>Chargement des documents...</p>}

    {error && (
      <p className="error-message">
        {error}
      </p>
    )}

    {!loading && !error && documents.length === 0 && (
      <p>Aucun document envoyé.</p>
    )}

    {!loading && !error && documents.length > 0 && (
      <ul>
        {documents.map((document) => (
          <li key={document.id}>
            <strong>{document.nom_fichier}</strong>
            {" - "}
            {document.type_document}
          </li>
        ))}
      </ul>
    )}
  </div>
</section>

);
}

export default DocumentList;