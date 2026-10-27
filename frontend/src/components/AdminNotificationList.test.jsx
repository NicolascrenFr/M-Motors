import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminNotificationList from "./AdminNotificationList";
import { authFetch } from "../auth";

vi.mock("../auth", () => ({
  authFetch: vi.fn(),
}));

describe("AdminNotificationList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche un message lorsqu'il n'y a aucune notification", async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [] }),
    });

    render(<AdminNotificationList />);

    expect(
      await screen.findByText("Aucune notification enregistrée.")
    ).toBeInTheDocument();
  });

  it("affiche les notifications enregistrées", async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [
          {
            id: 1,
            prenom: "Jean",
            nom: "Dupont",
            email: "jean@test.fr",
            vehicule: "Peugeot 208",
            statut: "Accepté",
            message: "Votre dossier est accepté.",
            lu: false,
            created_at: "2026-10-20T10:00:00",
          },
        ],
      }),
    });

    render(<AdminNotificationList />);

    expect(
      await screen.findByText("Jean Dupont")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Votre dossier est accepté.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Non lue")
    ).toBeInTheDocument();
  });

  it("affiche une erreur lorsque l'API échoue", async () => {
    authFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Erreur serveur",
      }),
    });

    render(<AdminNotificationList />);

    expect(
      await screen.findByText("Erreur serveur")
    ).toBeInTheDocument();
  });

  it("actualise les notifications après leur création", async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [] }),
    });

    render(<AdminNotificationList />);

    await screen.findByText("Aucune notification enregistrée.");

    window.dispatchEvent(new Event("notification-created"));

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledTimes(2);
    });
  });
});