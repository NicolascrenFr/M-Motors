import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FinancingForm from "./FinancingForm";
import { authFetch, getCurrentUser } from "../auth";

vi.mock("../auth", () => ({
  authFetch: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe("FinancingForm", () => {
  const client = {
    id: 2,
    prenom: "Jean",
    nom: "Dupont",
    email: "jean@test.fr",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockReturnValue(client);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const remplirFormulaire = () => {
    fireEvent.change(screen.getByLabelText("Téléphone"), {
      target: { value: "0612345678" },
    });

    fireEvent.change(screen.getByLabelText("Véhicule"), {
      target: { value: "Peugeot 308" },
    });
  };

  it("demande une connexion si aucun utilisateur n'est connecté", () => {
    getCurrentUser.mockReturnValue(null);

    render(<FinancingForm />);

    expect(
      screen.getByText(
        "Connectez-vous pour créer votre dossier de financement."
      )
    ).toBeInTheDocument();

    expect(authFetch).not.toHaveBeenCalled();
  });

  it("préremplit les informations du client connecté", () => {
    render(<FinancingForm />);

    expect(screen.getByLabelText("Prénom")).toHaveValue("Jean");
    expect(screen.getByLabelText("Nom")).toHaveValue("Dupont");
    expect(screen.getByLabelText("Adresse e-mail")).toHaveValue(
      "jean@test.fr"
    );

    expect(screen.getByLabelText("Prénom")).toHaveAttribute("readonly");
  });

  it("affiche les choix de financement par défaut", () => {
    render(<FinancingForm />);

    expect(screen.getByLabelText("Choix du financement")).toHaveValue(
      "Achat"
    );

    expect(screen.getByLabelText("Durée")).toHaveValue("48");

    expect(
      screen.getByRole("button", { name: "Créer mon dossier" })
    ).toBeInTheDocument();
  });

  it("permet de choisir la location et une durée de 36 mois", () => {
    render(<FinancingForm />);

    fireEvent.change(screen.getByLabelText("Choix du financement"), {
      target: { value: "Location" },
    });

    fireEvent.change(screen.getByLabelText("Durée"), {
      target: { value: "36" },
    });

    expect(screen.getByLabelText("Choix du financement")).toHaveValue(
      "Location"
    );

    expect(screen.getByLabelText("Durée")).toHaveValue("36");
  });

  it("crée un dossier de financement avec succès", async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        dossier: { id: 10, statut: "Dossier créé" },
      }),
    });

    const evenement = vi.fn();
    window.addEventListener("dossier-updated", evenement);

    try {
      render(<FinancingForm />);
      remplirFormulaire();

      fireEvent.click(
        screen.getByRole("button", { name: "Créer mon dossier" })
      );

      expect(
        await screen.findByText(
          "Votre dossier de financement a été créé avec succès."
        )
      ).toBeInTheDocument();

      expect(authFetch).toHaveBeenCalledWith(
        "/api/dossiers",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            client_id: 2,
            vehicule: "Peugeot 308",
            type_financement: "Achat",
            duree: 48,
          }),
        })
      );

      expect(evenement).toHaveBeenCalledTimes(1);

      expect(screen.getByLabelText("Véhicule")).toHaveValue("");
      expect(screen.getByLabelText("Durée")).toHaveValue("48");
    } finally {
      window.removeEventListener("dossier-updated", evenement);
    }
  });

  it("affiche une erreur si la création du dossier échoue", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    authFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Création refusée",
      }),
    });

    render(<FinancingForm />);
    remplirFormulaire();

    fireEvent.click(
      screen.getByRole("button", { name: "Créer mon dossier" })
    );

    expect(
      await screen.findByText("Création refusée")
    ).toBeInTheDocument();
  });

  it("réinitialise les choix après une création réussie", async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        dossier: { id: 11 },
      }),
    });

    render(<FinancingForm />);
    remplirFormulaire();

    fireEvent.change(screen.getByLabelText("Choix du financement"), {
      target: { value: "Location" },
    });

    fireEvent.change(screen.getByLabelText("Durée"), {
      target: { value: "60" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Créer mon dossier" })
    );

    await screen.findByText(
      "Votre dossier de financement a été créé avec succès."
    );

    expect(screen.getByLabelText("Téléphone")).toHaveValue("");
    expect(screen.getByLabelText("Véhicule")).toHaveValue("");
    expect(screen.getByLabelText("Choix du financement")).toHaveValue(
      "Achat"
    );
    expect(screen.getByLabelText("Durée")).toHaveValue("48");
  });
});