function ClientSpace() {
    return (
      <section className="client-space-section" id="espace-client">
        <div className="client-space-container">
          <h2>Mon espace client</h2>
  
          <div className="client-info">
            <h3>Mes informations</h3>
            <p><strong>Nom :</strong> Dupont</p>
            <p><strong>Prénom :</strong> Jean</p>
            <p><strong>Email :</strong> jean.dupont@email.fr</p>
          </div>
  
          <div className="client-dossier">
            <h3>Mon dossier de financement</h3>
            <p><strong>Véhicule :</strong> Peugeot 308</p>
            <p><strong>Financement :</strong> Location</p>
            <p><strong>Durée :</strong> 36 mois</p>
            <p><strong>Statut :</strong> Dossier en cours d'étude</p>
          </div>
  
          <div className="client-documents">
            <h3>Mes documents</h3>
            <p>Consultez les documents associés à votre dossier.</p>
  
            <button type="button" className="financing-button">
              Consulter mes documents
            </button>
          </div>
        </div>
      </section>
    );
  }
  
  export default ClientSpace;
