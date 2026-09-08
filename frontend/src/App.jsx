import { useEffect, useState } from "react";
import vehicles from "./data/vehicles";
import VehicleCard from "./components/VehicleCard";
import FinancingForm from "./components/FinancingForm";
import DocumentUpload from "./components/DocumentUpload";
import DocumentList from "./components/DocumentList";
import ClientSpace from "./components/ClientSpace";
import DossierStatus from "./components/DossierStatus";
import AdminDossiers from "./components/AdminDossiers";
import AdminAddVehicle from "./components/AdminAddVehicle";
import AdminEditVehicle from "./components/AdminEditVehicle";
import "./App.css";

function App() {

  const [documents, setDocuments] = useState([]);

  const [filter, setFilter] = useState("tous");

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [editingVehicle, setEditingVehicle] = useState(null);

  const [vehicleList, setVehicleList] = useState(vehicles);

  const handleDelete = (id) => {
    setVehicleList((previousVehicles) =>
      previousVehicles.filter((vehicle) => vehicle.id !== id)
    );
  };

  useEffect(() => {
    if (editingVehicle) {
      const editForm = document.getElementById("modifier-vehicule");

      if (editForm) {
        editForm.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [editingVehicle]);

  const filteredVehicles =
    filter === "tous"
      ? vehicleList
      : vehicleList.filter((vehicle) => vehicle.type === filter);

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            M-Motors
          </div>

          <nav>
            <a href="#accueil">Accueil</a>
            <a href="#catalogue">Catalogue</a>
            <a href="#financement">Financement</a>
            <a href="#documents">Documents</a>
            <a href="#espace-client">Espace client</a>
            <a href="#suivi-dossier">Suivi du dossier</a>
            
            <button className="login-button">
              Connexion
            </button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section id="accueil" className="hero">
        <div className="hero-content">
          <p className="hero-subtitle">
            M-MOTORS
          </p>

          <h1>
            Trouvez le véhicule
            <br />
            qui vous correspond
          </h1>

          <p>
            Achat ou location longue durée,
            <br />
            choisissez la solution adaptée à votre projet.
          </p>

          <a href="#catalogue" className="hero-button">
            Découvrir nos véhicules
          </a>
        </div>
      </section>

      {/* CATALOGUE */}
      <main id="catalogue" className="catalogue container">

        <div className="section-heading">
          <p>NOTRE CATALOGUE</p>

          <h2>
            Nos véhicules disponibles
          </h2>

          <span>
            Découvrez notre sélection de véhicules neufs et récents.
          </span>
        </div>

        {/* FILTRES */}
        <div className="filters">
          <button
            className={filter === "tous" ? "active" : ""}
            onClick={() => setFilter("tous")}
          >
            Tous
          </button>

          <button
            className={filter === "achat" ? "active" : ""}
            onClick={() => setFilter("achat")}
          >
            Achat
          </button>

          <button
            className={filter === "location" ? "active" : ""}
            onClick={() => setFilter("location")}
          >
            Location
          </button>
        </div>

        {/* VEHICULES */}
        <div className="vehicles-grid">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onDetails={setSelectedVehicle}
            onEdit={setEditingVehicle}
            onDelete={handleDelete}
            />
          ))}
        </div>
      </main>

      {/* FINANCEMENT */}
      <section id="financement" className="financing">
        <div className="container">
          <p>VOTRE PROJET</p>

          <h2>
            Un financement adapté à vos besoins
          </h2>

          <p>
            Achat ou location longue durée, M-Motors vous accompagne
            dans la constitution de votre dossier.
          </p>

          <button>
            Simuler mon projet
          </button>
        </div>
      </section>

      <FinancingForm />

      <DocumentUpload
        documents={documents}
        setDocuments={setDocuments}
      />

      <DocumentList documents={documents} />

      <ClientSpace />

      <DossierStatus />

      <AdminDossiers />

      <AdminAddVehicle setVehicleList={setVehicleList} />

      {editingVehicle && (
        <AdminEditVehicle
          vehicle={editingVehicle}
          setVehicleList={setVehicleList}
        />
      )}
  
      {/* MODAL VEHICULE */}
      {selectedVehicle && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedVehicle(null)}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setSelectedVehicle(null)}
            >
              ×
            </button>

            <img
              src={selectedVehicle.image}
              alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
            />

            <h2>
              {selectedVehicle.brand} {selectedVehicle.model}
            </h2>

            <p>
              Année : {selectedVehicle.year}
            </p>

            <p>
              Motorisation : {selectedVehicle.fuel}
            </p>

            <p>
              Transmission : {selectedVehicle.transmission}
            </p>

            <h3>
              {selectedVehicle.price.toLocaleString("fr-FR")} €
            </h3>

            <p>
              Location : {selectedVehicle.monthlyPrice} €/mois
            </p>

            <button>
              Créer mon dossier
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer>
        <div className="container">
          <strong>M-Motors</strong>
          <p>
            Votre partenaire automobile pour l'achat et la location.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default App;