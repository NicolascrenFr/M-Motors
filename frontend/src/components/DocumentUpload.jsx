// Aucun import nécessaire

function DocumentUpload({ documents, setDocuments }) {

  const handleChange = (event) => {
    const files = Array.from(event.target.files);
    setDocuments((previousDocuments) => [
        ...previousDocuments,
        ...files,
      ]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (documents.length === 0) {
      alert("Veuillez sélectionner au moins un document.");
      return;
    }

    console.log("Documents sélectionnés :", documents);

    alert("Vos documents ont été sélectionnés.");
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
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png"
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

          <button type="submit" className="financing-button">
            Télécharger les documents
          </button>
        </form>
      </div>
    </section>
  );
}

export default DocumentUpload;