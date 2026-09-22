import { useRef, useState } from "react";
import { authFetch, getCurrentUser } from "../auth";

function DocumentUpload({ documents, setDocuments }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const files = Array.from(event.target.files || []);

    setSelectedFiles(files);
    setMessage("");
    setError("");
  };

  const refreshDocuments = async (clientId) => {
    const response = await authFetch(
      `/api/documents/${clientId}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Impossible de récupérer les documents."
      );
    }

    setDocuments(data.documents);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (selectedFiles.length === 0) {
      setError(
        "Veuillez sélectionner au moins un document."
      );
      return;
    }

    const currentUser = getCurrentUser();

    if (!currentUser) {
      setError(
        "Vous devez être connecté pour télécharger un document."
      );
      return;
    }

    setLoading(true);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();

        formData.append(
          "client_id",
          String(currentUser.id)
        );

        formData.append(
          "type_document",
          "justificatif"
        );

        formData.append(
          "document",
          file
        );

        const response = await authFetch(
          "/api/documents",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Impossible de télécharger ${file.name}.`
          );
        }
      }

      await refreshDocuments(currentUser.id);

      setSelectedFiles([]);
      setMessage(
        "Vos documents ont été téléchargés et enregistrés avec succès."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(
        "Erreur lors du téléchargement des documents :",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="documents-section"
      id="documents"
    >
      <div className="documents-container">
        <h2>Télécharger mes documents</h2>

        <p>
          Sélectionnez les documents nécessaires à votre dossier
          de financement.
        </p>

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

        <form
          onSubmit={handleSubmit}
          className="documents-form"
        >
          <div className="form-group">
            <label htmlFor="documents">
              Documents justificatifs
            </label>

            <input
              ref={fileInputRef}
              type="file"
              id="documents"
              name="documents"
              multiple
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="documents-list">
              <h3>
                Documents sélectionnés :
              </h3>

              <ul>
                {selectedFiles.map(
                  (file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                    >
                      {file.name}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          <button
            type="submit"
            className="financing-button"
            disabled={loading}
          >
            {loading
              ? "Téléchargement..."
              : "Télécharger les documents"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default DocumentUpload;