function DocumentList({ documents }) {
    return (
      <section className="documents-list-section">
        <div className="documents-container">
          <h2>Mes documents envoyés</h2>
  
          {documents.length === 0 ? (
            <p>Aucun document envoyé.</p>
          ) : (
            <ul>
              {documents.map((document, index) => (
                <li key={`${document.name}-${index}`}>
                  {document.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }
  
  export default DocumentList;