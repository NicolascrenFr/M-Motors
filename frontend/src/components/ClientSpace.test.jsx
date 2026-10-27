import {
    describe, it, expect, vi,
    beforeEach, afterEach,
  } from "vitest";
  
  import {
    render, screen, fireEvent, waitFor,
  } from "@testing-library/react";
  
  import ClientSpace from "./ClientSpace";
  import { authFetch } from "../auth";
  
  vi.mock("../auth", () => ({
    authFetch: vi.fn(),
  }));
  
  describe("ClientSpace - Espace client", () => {
    const client = {
      id: 2,
      nom: "Dupont",
      prenom: "Jean",
      email: "jean@example.com",
    };
  
    const dossier = {
      id: 10,
      vehicule: "Peugeot 308",
      type_financement: "LLD",
      duree: 36,
      statut: "En attente",
    };
  
    const reponse = (data, ok = true) => ({
      ok,
      json: async () => data,
    });
  
    const chargerEspace = (dossierClient = dossier) => {
      authFetch
        .mockResolvedValueOnce(reponse({ client }))
        .mockResolvedValueOnce(
          reponse({ dossier: dossierClient })
        );
    };
  
    beforeEach(() => {
      vi.clearAllMocks();
      localStorage.clear();
      vi.spyOn(console, "error").mockImplementation(() => {});
    });
  
    afterEach(() => {
      vi.restoreAllMocks();
      localStorage.clear();
    });
  
    it("demande une connexion si aucun client n'est identifié", () => {
      render(<ClientSpace />);
  
      expect(
        screen.getByText(
          "Connectez-vous pour accéder à votre espace client."
        )
      ).toBeInTheDocument();
  
      expect(authFetch).not.toHaveBeenCalled();
    });
  
    it("affiche le chargement de l'espace client", () => {
      localStorage.setItem("clientId", "2");
  
      authFetch.mockReturnValue(new Promise(() => {}));
  
      render(<ClientSpace />);
  
      expect(
        screen.getByText("Chargement de votre espace client...")
      ).toBeInTheDocument();
    });
  
    it("affiche les informations du client et de son dossier", async () => {
      localStorage.setItem("clientId", "2");
      chargerEspace();
  
      render(<ClientSpace />);
  
      expect(
        await screen.findByText("jean@example.com")
      ).toBeInTheDocument();
  
      expect(screen.getByText("Peugeot 308"))
        .toBeInTheDocument();
  
      expect(screen.getByText("LLD"))
        .toBeInTheDocument();
  
      expect(authFetch).toHaveBeenCalledWith(
        "/api/clients/2"
      );
  
      expect(authFetch).toHaveBeenCalledWith(
        "/api/dossiers/client/2"
      );
    });
  
    it("affiche un message si le client n'a aucun dossier", async () => {
      localStorage.setItem("clientId", "2");
      chargerEspace(null);
  
      render(<ClientSpace />);
  
      expect(
        await screen.findByText(
          "Aucun dossier de financement."
        )
      ).toBeInTheDocument();
    });
  
    it("affiche une erreur si les informations du client sont indisponibles", async () => {
      localStorage.setItem("clientId", "2");
  
      authFetch
        .mockResolvedValueOnce(
          reponse({ message: "Client introuvable." }, false)
        )
        .mockResolvedValueOnce(
          reponse({ dossier })
        );
  
      render(<ClientSpace />);
  
      expect(
        await screen.findByText("Client introuvable.")
      ).toBeInTheDocument();
    });
  
    it("actualise les informations après une modification du dossier", async () => {
      localStorage.setItem("clientId", "2");
  
      const dossierValide = {
        ...dossier,
        statut: "Dossier validé",
      };
  
      authFetch
        .mockResolvedValueOnce(reponse({ client }))
        .mockResolvedValueOnce(reponse({ dossier }))
        .mockResolvedValueOnce(reponse({ client }))
        .mockResolvedValueOnce(
          reponse({ dossier: dossierValide })
        );
  
      render(<ClientSpace />);
  
      await screen.findByText("Peugeot 308");
  
      window.dispatchEvent(
        new CustomEvent("dossier-updated")
      );
  
      await waitFor(() => {
        expect(
          screen.getByText("Dossier validé")
        ).toBeInTheDocument();
      });
  
      expect(authFetch).toHaveBeenCalledTimes(4);
    });
  
    it("permet d'accéder à la section des documents", async () => {
      localStorage.setItem("clientId", "2");
      chargerEspace();
  
      const documents = document.createElement("div");
      documents.id = "documents";
      document.body.appendChild(documents);
  
      const scrollMock = vi.fn();
      documents.scrollIntoView = scrollMock;
  
      try {
        render(<ClientSpace />);
  
        await screen.findByText("Peugeot 308");
  
        fireEvent.click(
          screen.getByRole("button", {
            name: "Consulter mes documents",
          })
        );
  
        expect(scrollMock).toHaveBeenCalledWith({
          behavior: "smooth",
        });
      } finally {
        documents.remove();
      }
    });
  });