function DossierStatus() {
    return (
    <section
        id="suivi-dossier"
        className="dossier-status-section"
    >        
        <div className="dossier-status-container">
          <h2>Suivi de mon dossier</h2>
  
          <p>
            Consultez l'avancement de votre dossier de financement.
          </p>
  
          <div className="dossier-status">
            <div className="status-step active">
              <span>1</span>
              <div>
                <h3>Dossier créé</h3>
                <p>Votre demande a bien été enregistrée.</p>
              </div>
            </div>
  
            <div className="status-step active">
              <span>2</span>
              <div>
                <h3>Documents reçus</h3>
                <p>Les documents nécessaires ont été transmis.</p>
              </div>
            </div>
  
            <div className="status-step current">
              <span>3</span>
              <div>
                <h3>Étude du dossier</h3>
                <p>Votre dossier est actuellement en cours d'étude.</p>
              </div>
            </div>
  
            <div className="status-step">
              <span>4</span>
              <div>
                <h3>Décision</h3>
                <p>La décision concernant votre dossier sera affichée ici.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  export default DossierStatus;
