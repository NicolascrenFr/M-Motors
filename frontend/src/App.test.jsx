import {
    describe, it, expect, vi,
    beforeEach, afterEach,
  } from "vitest";
  
  import {
    render, screen, fireEvent, waitFor,
  } from "@testing-library/react";
  
  import App from "./App";
  import { getCurrentUser, clearSession } from "./auth";
  
  vi.mock("./auth", () => ({
    apiUrl: (path) => `http://localhost:3000${path}`,
    getCurrentUser: vi.fn(),
    clearSession: vi.fn(),
  }));
  
  vi.mock("./components/VehicleCard", () => ({
    default: ({
      vehicle,
      onDetails,
      onEdit,
      onDelete,
      isAdmin,
    }) => (
      <div>
        <button
          type="button"
          onClick={() => onDetails(vehicle)}
        >
          {vehicle.brand} {vehicle.model}
        </button>
  
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => onEdit(vehicle)}
            >
              Modifier {vehicle.model}
            </button>
  
            <button
              type="button"
              onClick={() => onDelete(vehicle.id)}
            >
              Supprimer {vehicle.model}
            </button>
          </>
        )}
      </div>
    ),
  }));
  
  vi.mock("./components/FinancingForm", () => ({
    default: () => <div>Formulaire financement</div>,
  }));
  
  vi.mock("./components/DocumentUpload", () => ({
    default: () => <div>DocumentUpload</div>,
  }));
  
  vi.mock("./components/DocumentList", () => ({
    default: () => <div>DocumentList</div>,
  }));
  
  vi.mock("./components/ClientSpace", () => ({
    default: () => <div>ClientSpace</div>,
  }));
  
  vi.mock("./components/DossierStatus", () => ({
    default: () => <div>DossierStatus</div>,
  }));
  
  vi.mock("./components/ClientNotifications", () => ({
    default: () => <div>ClientNotifications</div>,
  }));
  
  vi.mock("./components/AdminDossiers", () => ({
    default: () => <div>AdminDossiers</div>,
  }));
  
  vi.mock("./components/AdminNotification", () => ({
    default: () => <div>AdminNotification</div>,
  }));
  
  vi.mock("./components/AdminNotificationList", () => ({
    default: () => <div>AdminNotificationList</div>,
  }));
  
  vi.mock("./components/AdminAddVehicle", () => ({
    default: () => <div>AdminAddVehicle</div>,
  }));
  
  vi.mock("./components/AdminEditVehicle", () => ({
    default: () => <div>AdminEditVehicle</div>,
  }));
  
  vi.mock("./components/AuthModal", () => ({
    default: ({ onClose }) => (
      <div>
        <p>Fenêtre de connexion</p>
        <button onClick={onClose}>
          Fermer connexion
        </button>
      </div>
    ),
  }));
  
  vi.mock("./components/ProfileModal", () => ({
    default: () => <div>ProfileModal</div>,
  }));
  
  describe("App - M-Motors", () => {
    const vehicules = [
      {
        id: 1,
        brand: "Peugeot",
        model: "208",
        year: 2024,
        fuel: "Essence",
        transmission: "Manuelle",
        price: 18000,
        monthly_price: 250,
        type: "achat",
        image: "/208.jpg",
      },
      {
        id: 2,
        brand: "Renault",
        model: "Clio",
        year: 2025,
        fuel: "Hybride",
        transmission: "Automatique",
        price: 22000,
        monthly_price: 300,
        type: "location",
        image: "/clio.jpg",
      },
    ];
  
    beforeEach(() => {
      vi.clearAllMocks();
  
      getCurrentUser.mockReturnValue(null);
  
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            vehicles: vehicules,
          }),
        })
      );
    });
  
    afterEach(() => {
      vi.unstubAllGlobals();
    });
  
    it("affiche le catalogue des véhicules", async () => {
      render(<App />);
  
      expect(
        await screen.findByText("Peugeot 208")
      ).toBeInTheDocument();
  
      expect(
        screen.getByText("Renault Clio")
      ).toBeInTheDocument();
  
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/vehicles"
      );
    });
  
    it("filtre les véhicules disponibles à l'achat", async () => {
      render(<App />);
  
      await screen.findByText("Peugeot 208");
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Achat",
        })
      );
  
      expect(
        screen.getByText("Peugeot 208")
      ).toBeInTheDocument();
  
      expect(
        screen.queryByText("Renault Clio")
      ).not.toBeInTheDocument();
    });
  
    it("filtre les véhicules en location", async () => {
      render(<App />);
  
      await screen.findByText("Peugeot 208");
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Location",
        })
      );
  
      expect(
        screen.getByText("Renault Clio")
      ).toBeInTheDocument();
  
      expect(
        screen.queryByText("Peugeot 208")
      ).not.toBeInTheDocument();
    });
  
    it("rétablit tous les véhicules", async () => {
      render(<App />);
  
      await screen.findByText("Peugeot 208");
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Achat",
        })
      );
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Tous",
        })
      );
  
      expect(
        screen.getByText("Peugeot 208")
      ).toBeInTheDocument();
  
      expect(
        screen.getByText("Renault Clio")
      ).toBeInTheDocument();
    });
  
    it("ouvre et ferme les détails d'un véhicule", async () => {
      render(<App />);
  
      fireEvent.click(
        await screen.findByText("Peugeot 208")
      );
  
      expect(
        screen.getByText("Année : 2024")
      ).toBeInTheDocument();
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "×",
        })
      );
  
      expect(
        screen.queryByText("Année : 2024")
      ).not.toBeInTheDocument();
    });
  
    it("ouvre la connexion depuis le menu", async () => {
      render(<App />);
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Connexion",
        })
      );
  
      expect(
        screen.getByText("Fenêtre de connexion")
      ).toBeInTheDocument();
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Fermer connexion",
        })
      );
  
      expect(
        screen.queryByText("Fenêtre de connexion")
      ).not.toBeInTheDocument();
    });
  
    it("demande une connexion pour simuler un financement", async () => {
      render(<App />);
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Simuler mon projet",
        })
      );
  
      expect(
        screen.getByText("Fenêtre de connexion")
      ).toBeInTheDocument();
    });
    it("affiche les fonctionnalités administrateur", async () => {
        getCurrentUser.mockReturnValue({
          id: 1,
          prenom: "Admin",
          role: "admin",
        });
      
        render(<App />);
      
        await screen.findByText("Peugeot 208");
      
        expect(
          screen.getByText("AdminDossiers")
        ).toBeInTheDocument();
      
        expect(
          screen.getByText("AdminAddVehicle")
        ).toBeInTheDocument();
      
        expect(
          screen.getByRole("button", {
            name: "Supprimer 208",
          })
        ).toBeInTheDocument();
      });
      
      it("annule la suppression d'un véhicule", async () => {
        getCurrentUser.mockReturnValue({
          id: 1,
          role: "admin",
        });
      
        const confirmMock = vi.fn(() => false);
        vi.stubGlobal("confirm", confirmMock);
      
        render(<App />);
      
        await screen.findByText("Peugeot 208");
      
        fireEvent.click(
          screen.getByRole("button", {
            name: "Supprimer 208",
          })
        );
      
        expect(confirmMock).toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(1);
      
        expect(
          screen.getByText("Peugeot 208")
        ).toBeInTheDocument();
      });
      
      it("supprime un véhicule après confirmation", async () => {
        getCurrentUser.mockReturnValue({
          id: 1,
          role: "admin",
        });
      
        vi.stubGlobal("confirm", vi.fn(() => true));
        vi.stubGlobal("alert", vi.fn());
      
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ vehicles: vehicules }),
        }).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: "Supprimé" }),
        });
      
        render(<App />);
      
        await screen.findByText("Peugeot 208");
      
        fireEvent.click(
          screen.getByRole("button", {
            name: "Supprimer 208",
          })
        );
      
        await waitFor(() => {
          expect(
            screen.queryByText("Peugeot 208")
          ).not.toBeInTheDocument();
        });
      
        expect(fetch).toHaveBeenCalledWith(
          "http://localhost:3000/api/vehicles/1",
          expect.objectContaining({
            method: "DELETE",
          })
        );
      
        expect(
          screen.getByText("Renault Clio")
        ).toBeInTheDocument();
      });
      
      it("affiche une erreur si la suppression échoue", async () => {
        getCurrentUser.mockReturnValue({
          id: 1,
          role: "admin",
        });
      
        vi.stubGlobal("confirm", vi.fn(() => true));
      
        const alertMock = vi.fn();
        vi.stubGlobal("alert", alertMock);
      
        vi.spyOn(console, "error").mockImplementation(() => {});
      
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ vehicles: vehicules }),
        }).mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            message: "Suppression refusée.",
          }),
        });
      
        render(<App />);
      
        await screen.findByText("Peugeot 208");
      
        fireEvent.click(
          screen.getByRole("button", {
            name: "Supprimer 208",
          })
        );
      
        await waitFor(() => {
          expect(alertMock).toHaveBeenCalledWith(
            "Suppression refusée."
          );
        });
      
        expect(
          screen.getByText("Peugeot 208")
        ).toBeInTheDocument();
      });
      
      it("ouvre le formulaire de modification d'un véhicule", async () => {
        getCurrentUser.mockReturnValue({
          id: 1,
          role: "admin",
        });
      
        render(<App />);
      
        await screen.findByText("Peugeot 208");
      
        fireEvent.click(
          screen.getByRole("button", {
            name: "Modifier 208",
          })
        );
      
        expect(
          screen.getByText("AdminEditVehicle")
        ).toBeInTheDocument();
      });
      it("déconnecte le client", async () => {
        getCurrentUser.mockReturnValue({
          id: 2,
          prenom: "Jean",
          role: "client",
        });
      
        vi.stubGlobal("scrollTo", vi.fn());
      
        render(<App />);
      
        expect(
          screen.getByText("Bonjour Jean")
        ).toBeInTheDocument();
      
        fireEvent.click(
          screen.getByRole("button", {
            name: "Déconnexion",
          })
        );
      
        expect(clearSession).toHaveBeenCalled();
      
        expect(
          screen.getByRole("button", {
            name: "Connexion",
          })
        ).toBeInTheDocument();
      
        expect(
          screen.queryByText("Bonjour Jean")
        ).not.toBeInTheDocument();
      });
      
      it("ouvre le profil du client connecté", async () => {
        getCurrentUser.mockReturnValue({
          id: 2,
          prenom: "Jean",
          role: "client",
        });
      
        render(<App />);
      
        fireEvent.click(
          screen.getByRole("button", {
            name: "Mon profil",
          })
        );
      
        expect(
          screen.getByText("ProfileModal")
        ).toBeInTheDocument();
      });
  });