import {
    describe, it, expect, vi,
    beforeEach, afterEach,
  } from "vitest";
  
  import {
    render, screen, fireEvent, waitFor,
  } from "@testing-library/react";
  
  import DocumentUpload from "./DocumentUpload";
  import { authFetch, getCurrentUser } from "../auth";
  
  vi.mock("../auth", () => ({
    authFetch: vi.fn(),
    getCurrentUser: vi.fn(),
  }));
  
  describe("DocumentUpload - Documents clients", () => {
    const client = {
      id: 2,
      nom: "Dupont",
      prenom: "Jean",
    };
  
    const reponse = (data, ok = true) => ({
      ok,
      json: async () => data,
    });
  
    const fichier = (nom = "justificatif.pdf") =>
      new File(["document de test"], nom, {
        type: "application/pdf",
      });
  
    const afficher = () => {
      const setDocuments = vi.fn();
  
      render(
        <DocumentUpload setDocuments={setDocuments} />
      );
  
      return setDocuments;
    };
  
    const selectionner = (...files) => {
      fireEvent.change(
        screen.getByLabelText("Documents justificatifs"),
        {
          target: { files },
        }
      );
    };
  
    const envoyer = () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Télécharger les documents",
        })
      );
    };
  
    beforeEach(() => {
      vi.clearAllMocks();
      getCurrentUser.mockReturnValue(client);
      vi.spyOn(console, "error").mockImplementation(() => {});
    });
  
    afterEach(() => {
      vi.restoreAllMocks();
    });
  
    it("affiche le formulaire de téléchargement", () => {
      afficher();
  
      expect(
        screen.getByRole("heading", {
          name: "Télécharger mes documents",
        })
      ).toBeInTheDocument();
  
      expect(
        screen.getByLabelText("Documents justificatifs")
      ).toHaveAttribute("type", "file");
    });
  
    it("affiche les fichiers sélectionnés", () => {
      afficher();
  
      selectionner(
        fichier("carte-identite.pdf"),
        fichier("justificatif.pdf")
      );
  
      expect(
        screen.getByText("carte-identite.pdf")
      ).toBeInTheDocument();
  
      expect(
        screen.getByText("justificatif.pdf")
      ).toBeInTheDocument();
    });
  
    it("refuse un téléchargement sans fichier", async () => {
      afficher();
      envoyer();
  
      expect(
        await screen.findByText(
          "Veuillez sélectionner au moins un document."
        )
      ).toBeInTheDocument();
  
      expect(authFetch).not.toHaveBeenCalled();
    });
  
    it("refuse un téléchargement si le client est déconnecté", async () => {
      getCurrentUser.mockReturnValue(null);
  
      afficher();
      selectionner(fichier());
      envoyer();
  
      expect(
        await screen.findByText(
          "Vous devez être connecté pour télécharger un document."
        )
      ).toBeInTheDocument();
  
      expect(authFetch).not.toHaveBeenCalled();
    });
  
    it("télécharge un document et actualise la liste", async () => {
      const documents = [
        { id: 1, nom: "justificatif.pdf" },
      ];
  
      authFetch
        .mockResolvedValueOnce(
          reponse({ message: "Document enregistré." })
        )
        .mockResolvedValueOnce(
          reponse({ documents })
        );
  
      const setDocuments = afficher();
  
      selectionner(fichier());
      envoyer();
  
      await waitFor(() => {
        expect(setDocuments).toHaveBeenCalledWith(documents);
      });
  
      expect(authFetch).toHaveBeenCalledWith(
        "/api/documents",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      );
  
      const formData = authFetch.mock.calls[0][1].body;
  
      expect(formData.get("client_id")).toBe("2");
      expect(formData.get("type_document")).toBe("justificatif");
      expect(formData.get("document").name).toBe("justificatif.pdf");
  
      expect(authFetch).toHaveBeenCalledWith(
        "/api/documents/2"
      );
  
      expect(
        screen.getByText(
          "Vos documents ont été téléchargés et enregistrés avec succès."
        )
      ).toBeInTheDocument();
  
      expect(
        screen.queryByText("justificatif.pdf")
      ).not.toBeInTheDocument();
    });
  
    it("télécharge plusieurs documents successivement", async () => {
      authFetch
        .mockResolvedValueOnce(reponse({}))
        .mockResolvedValueOnce(reponse({}))
        .mockResolvedValueOnce(
          reponse({ documents: [] })
        );
  
      const setDocuments = afficher();
  
      selectionner(
        fichier("document-1.pdf"),
        fichier("document-2.pdf")
      );
  
      envoyer();
  
      await waitFor(() => {
        expect(setDocuments).toHaveBeenCalledWith([]);
      });
  
      expect(authFetch).toHaveBeenCalledTimes(3);
  
      expect(authFetch.mock.calls[0][0]).toBe("/api/documents");
      expect(authFetch.mock.calls[1][0]).toBe("/api/documents");
      expect(authFetch.mock.calls[2][0]).toBe("/api/documents/2");
    });
  
    it("affiche une erreur lorsque le serveur refuse le document", async () => {
      authFetch.mockResolvedValueOnce(
        reponse(
          { message: "Format de document refusé." },
          false
        )
      );
  
      const setDocuments = afficher();
  
      selectionner(fichier());
      envoyer();
  
      expect(
        await screen.findByText(
          "Format de document refusé."
        )
      ).toBeInTheDocument();
  
      expect(setDocuments).not.toHaveBeenCalled();
    });
  });