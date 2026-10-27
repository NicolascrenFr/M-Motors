import {
    describe, it, expect, vi,
    beforeEach, afterEach,
  } from "vitest";
  
  import {
    render, screen, fireEvent, waitFor,
  } from "@testing-library/react";
  
  import AdminDossiers from "./AdminDossiers";
  import { authFetch } from "../auth";
  
  vi.mock("../auth", () => ({
    authFetch: vi.fn(),
  }));
  
  describe("AdminDossiers - Gestion des dossiers clients", () => {
    const dossier = {
      id: 1,
      prenom: "Jean",
      nom: "Dupont",
      email: "jean@example.com",
      vehicule: "Peugeot 308",
      type_financement: "LLD",
      duree: 36,
      statut: "En attente",
    };
  
    const reponse = (data, ok = true) => ({
      ok,
      json: async () => data,
    });
  
    const chargerDossiers = (dossiers = [dossier]) => {
      authFetch.mockResolvedValue(
        reponse({ dossiers })
      );
    };
  
    const afficher = () => {
      const onSelectDossier = vi.fn();
      const onViewDossier = vi.fn();
  
      render(
        <AdminDossiers
          onSelectDossier={onSelectDossier}
          onViewDossier={onViewDossier}
        />
      );
  
      return { onSelectDossier, onViewDossier };
    };
  
    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(console, "error").mockImplementation(() => {});
    });
  
    afterEach(() => {
      vi.restoreAllMocks();
    });
  
    it("affiche le chargement des dossiers", () => {
      authFetch.mockReturnValue(new Promise(() => {}));
  
      afficher();
  
      expect(
        screen.getByText("Chargement des dossiers...")
      ).toBeInTheDocument();
    });
  
    it("affiche les dossiers récupérés depuis l'API", async () => {
      chargerDossiers();
      afficher();
  
      expect(
        await screen.findByRole("heading", {
          name: "Jean Dupont",
        })
      ).toBeInTheDocument();
  
      expect(screen.getByText("jean@example.com"))
        .toBeInTheDocument();
  
      expect(screen.getByText("Peugeot 308"))
        .toBeInTheDocument();
  
      expect(authFetch).toHaveBeenCalledWith(
        "/api/dossiers"
      );
    });
  
    it("affiche un message lorsque la liste est vide", async () => {
      chargerDossiers([]);
      afficher();
  
      expect(
        await screen.findByText(
          "Aucun dossier de financement trouvé."
        )
      ).toBeInTheDocument();
    });
  
    it("affiche une erreur si le chargement échoue", async () => {
      authFetch.mockResolvedValue(
        reponse(
          { message: "Erreur de chargement." },
          false
        )
      );
  
      afficher();
  
      expect(
        await screen.findByText("Erreur de chargement.")
      ).toBeInTheDocument();
    });
  
    it("permet de consulter un dossier", async () => {
      chargerDossiers();
      const { onViewDossier } = afficher();
  
      await screen.findByText("Jean Dupont");
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Consulter le dossier",
        })
      );
  
      expect(onViewDossier).toHaveBeenCalledWith(dossier);
    });
  
    it("valide un dossier et permet de notifier le client", async () => {
      const dossierValide = {
        ...dossier,
        statut: "Dossier validé",
      };
  
      authFetch
        .mockResolvedValueOnce(
          reponse({ dossiers: [dossier] })
        )
        .mockResolvedValueOnce(
          reponse({ dossier: dossierValide })
        )
        .mockResolvedValue(
          reponse({ dossiers: [dossierValide] })
        );
  
      const { onSelectDossier } = afficher();
  
      await screen.findByText("Jean Dupont");
  
      const notifier = screen.getByRole("button", {
        name: "Notifier le client",
      });
  
      expect(notifier).toBeDisabled();
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Valider le dossier",
        })
      );
  
      await waitFor(() => {
        expect(authFetch).toHaveBeenCalledWith(
          "/api/dossiers/1/statut",
          expect.objectContaining({
            method: "PUT",
            body: JSON.stringify({
              statut: "Dossier validé",
            }),
          })
        );
      });
  
      await waitFor(() => {
        expect(notifier).toBeEnabled();
      });
  
      fireEvent.click(notifier);
  
      expect(onSelectDossier).toHaveBeenCalledWith(
        dossierValide
      );
    });
  
    it("refuse un dossier et affiche une erreur si nécessaire", async () => {
      authFetch
        .mockResolvedValueOnce(
          reponse({ dossiers: [dossier] })
        )
        .mockResolvedValueOnce(
          reponse(
            { message: "Modification refusée." },
            false
          )
        );
  
      afficher();
  
      await screen.findByText("Jean Dupont");
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Refuser le dossier",
        })
      );
  
      expect(
        await screen.findByText("Modification refusée.")
      ).toBeInTheDocument();
  
      expect(
        screen.getByRole("button", {
          name: "Notifier le client",
        })
      ).toBeDisabled();
    });
  });