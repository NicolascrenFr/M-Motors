import {
    describe, it, expect, vi,
    beforeEach, afterEach,
  } from "vitest";
  
  import {
    render, screen, fireEvent, waitFor,
  } from "@testing-library/react";
  
  import DocumentList from "./DocumentList";
  import { authFetch, getCurrentUser } from "../auth";
  
  vi.mock("../auth", () => ({
    authFetch: vi.fn(),
    getCurrentUser: vi.fn(),
  }));
  
  describe("DocumentList - Documents clients", () => {
    const client = {
      id: 2,
      nom: "Dupont",
    };
  
    const documents = [
      {
        id: 10,
        nom_fichier: "identite.pdf",
        type_document: "justificatif",
        created_at: "2026-10-20T10:00:00Z",
      },
      {
        id: 11,
        nom_fichier: "domicile.pdf",
        type_document: "justificatif",
        created_at: "2026-10-21T10:00:00Z",
      },
    ];
  
    const reponse = (data, ok = true) => ({
      ok,
      json: async () => data,
    });
  
    beforeEach(() => {
      vi.clearAllMocks();
  
      getCurrentUser.mockReturnValue(client);
  
      vi.spyOn(console, "error").mockImplementation(() => {});
    });
  
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });
  
    it("affiche les documents du client connecté", async () => {
      authFetch.mockResolvedValueOnce(
        reponse({ documents })
      );
  
      render(<DocumentList />);
  
      expect(
        await screen.findByText("identite.pdf")
      ).toBeInTheDocument();
  
      expect(
        screen.getByText("domicile.pdf")
      ).toBeInTheDocument();
  
      expect(authFetch).toHaveBeenCalledWith(
        "/api/documents/2"
      );
    });
  
    it("affiche un message si aucun document n'existe", async () => {
      authFetch.mockResolvedValueOnce(
        reponse({ documents: [] })
      );
  
      render(<DocumentList />);
  
      expect(
        await screen.findByText("Aucun document envoyé.")
      ).toBeInTheDocument();
    });
  
    it("n'affiche rien si le client est déconnecté", async () => {
      getCurrentUser.mockReturnValue(null);
  
      const { container } = render(<DocumentList />);
  
      expect(container).toBeEmptyDOMElement();
      expect(authFetch).not.toHaveBeenCalled();
    });
  
    it("affiche une erreur si la récupération échoue", async () => {
      authFetch.mockResolvedValueOnce(
        reponse(
          { message: "Accès aux documents refusé." },
          false
        )
      );
  
      render(<DocumentList />);
  
      expect(
        await screen.findByText(
          "Accès aux documents refusé."
        )
      ).toBeInTheDocument();
    });
  
    it("affiche une erreur si le réseau est indisponible", async () => {
      authFetch.mockRejectedValueOnce(
        new Error("Erreur réseau")
      );
  
      render(<DocumentList />);
  
      expect(
        await screen.findByText("Erreur réseau")
      ).toBeInTheDocument();
    });
  
    it("télécharge un document avec succès", async () => {
      const blob = new Blob(["PDF de test"], {
        type: "application/pdf",
      });
  
      authFetch
        .mockResolvedValueOnce(reponse({ documents }))
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => blob,
        });
  
      const createObjectURL = vi.fn(
        () => "blob:document-test"
      );
  
      const revokeObjectURL = vi.fn();
  
      vi.stubGlobal("URL", {
        ...URL,
        createObjectURL,
        revokeObjectURL,
      });
  
      const clickSpy = vi.spyOn(
        HTMLAnchorElement.prototype,
        "click"
      ).mockImplementation(() => {});
  
      render(<DocumentList />);
  
      await screen.findByText("identite.pdf");
  
      fireEvent.click(
        screen.getAllByRole("button", {
          name: "Télécharger",
        })[0]
      );
  
      await waitFor(() => {
        expect(createObjectURL).toHaveBeenCalledWith(blob);
      });
  
      expect(authFetch).toHaveBeenCalledWith(
        "/api/documents/2/10/download"
      );
  
      expect(clickSpy).toHaveBeenCalled();
  
      expect(revokeObjectURL).toHaveBeenCalledWith(
        "blob:document-test"
      );
    });
  
    it("affiche une erreur si le téléchargement échoue", async () => {
      authFetch
        .mockResolvedValueOnce(reponse({ documents }))
        .mockResolvedValueOnce(
          reponse(
            { message: "Téléchargement refusé." },
            false
          )
        );
  
      render(<DocumentList />);
  
      await screen.findByText("identite.pdf");
  
      fireEvent.click(
        screen.getAllByRole("button", {
          name: "Télécharger",
        })[0]
      );
  
      expect(
        await screen.findByText("Téléchargement refusé.")
      ).toBeInTheDocument();
  
      expect(
        screen.queryAllByRole("button", {
          name: "Télécharger",
        })
      ).toHaveLength(0);
    });
  });