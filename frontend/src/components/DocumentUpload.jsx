import { useState } from "react";

function DocumentUpload() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (event) => {
    const files = Array.from(event.target.files);

    setDocuments(files);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (documents.length === 0) {
      setError("Veuillez sélectionner au moins un document.");
      return;
    }

    setIsUploading(true);
    setMessage("");
    setError("");

    try {
      for (const document of documents) {
        const formData = new FormData();

        formData.append("client_id", "1");
        formData.append("type_document", "justificatif");
        formData.append("document", document);

        const response = await fetch(
          "http://localhost:3000/api/documents",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Erreur lors de l'envoi du document."
          );
        }
      }

      setMessage("Vos documents ont été envoyés avec succès.");
      setDocuments([]);
    } catch (error) {
      console.error("Erreur :", error);
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="documents-section" id="documents">
      <div className="documents-container">
        <h2>Télécharger mes documents</h2>

        <p>
          Sélectionnez les documents nécessaires à votre dossier de
          financement.
        </p>

        <form onSubmit={handleSubmit} className="documents-form">
          <div className="form-group">
            <label htmlFor="documents">
              Documents justificatifs
            </label>

            <input
              type="file"
              id="documents"
              name="documents"
              multiple
              accept=".pdf,.jpg,.jpeg"
              onChange={handleChange}
            />
          </div>

          {documents.length > 0 && (
            <div className="documents-list">
              <h3>Documents sélectionnés :</h3>

              <ul>
                {documents.map((document, index) => (
                  <li key={`${document.name}-${index}`}>
                    {document.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {message && (
            <p className="success-message">
              {message}
            </p>
          )}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="financing-button"
            disabled={isUploading}
          >
            {isUploading
              ? "Envoi en cours..."
              : "Télécharger les documents"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default DocumentUpload;