import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DossierStatus from "./DossierStatus";
import { authFetch } from "../auth";

vi.mock("../auth", () => ({
  authFetch: vi.fn(),
}));

describe("DossierStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockDossier = (statut) => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        dossier: { id: 1, statut },
      }),
    });
  };

  it("demande une connexion si aucun client n'est identifié", () => {
    render(<DossierStatus />);

    expect(
      screen.getByText("Connectez-vous pour consulter votre dossier.")
    ).toBeInTheDocument();

    expect(authFetch).not.toHaveBeenCalled();
  });

  it("affiche un message lorsqu'aucun dossier n'existe", async () => {
    localStorage.setItem("clientId", "2");

    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ dossier: null }),
    });

    render(<DossierStatus />);

    expect(
      await screen.findByText("Aucun dossier de financement trouvé.")
    ).toBeInTheDocument();

    expect(authFetch).toHaveBeenCalledWith(
      "/api/dossiers/client/2"
    );
  });

  it("affiche le statut Dossier créé", async () => {
    localStorage.setItem("clientId", "2");
    mockDossier("Dossier créé");

    render(<DossierStatus />);

    expect(
      await screen.findByText("Votre demande a bien été enregistrée.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Statut actuel")
    ).toBeInTheDocument();
  });

  it("affiche le statut Documents reçus", async () => {
    localStorage.setItem("clientId", "2");
    mockDossier("Documents reçus");

    render(<DossierStatus />);

    expect(
      await screen.findByText(
        "Les documents nécessaires ont été transmis."
      )
    ).toBeInTheDocument();
  });

  it("affiche le statut En cours d'étude", async () => {
    localStorage.setItem("clientId", "2");
    mockDossier("En cours d'étude");

    render(<DossierStatus />);

    expect(
      await screen.findByText(
        "Votre dossier est actuellement en cours d'étude."
      )
    ).toBeInTheDocument();
  });

  it("affiche un message lorsque le dossier est validé", async () => {
    localStorage.setItem("clientId", "2");
    mockDossier("Dossier validé");

    render(<DossierStatus />);

    expect(
      await screen.findByText(/Votre dossier a été validé/)
    ).toBeInTheDocument();

    expect(
      screen.getByText("Votre dossier a été accepté.")
    ).toBeInTheDocument();
  });

  it("affiche un message lorsque le dossier est refusé", async () => {
    localStorage.setItem("clientId", "2");
    mockDossier("Dossier refusé");

    render(<DossierStatus />);

    expect(
        await screen.findByText("⚠️ Votre dossier a été refusé.")
      ).toBeInTheDocument();
  });

  it("affiche une erreur lorsque l'API échoue", async () => {
    localStorage.setItem("clientId", "2");

    vi.spyOn(console, "error").mockImplementation(() => {});

    authFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Erreur serveur",
      }),
    });

    render(<DossierStatus />);

    expect(
      await screen.findByText("Erreur serveur")
    ).toBeInTheDocument();
  });

  it("actualise le dossier après une modification", async () => {
    localStorage.setItem("clientId", "2");
    mockDossier("Dossier créé");

    render(<DossierStatus />);

    await screen.findByText("Statut actuel");

    fireEvent(
      window,
      new Event("dossier-updated")
    );

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledTimes(2);
    });
  });
});