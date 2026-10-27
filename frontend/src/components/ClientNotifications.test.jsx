import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClientNotifications from "./ClientNotifications";
import { authFetch } from "../auth";

vi.mock("../auth", () => ({
  authFetch: vi.fn(),
}));

describe("ClientNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("demande de se connecter si aucun client n'est identifié", () => {
    render(<ClientNotifications />);

    expect(
      screen.getByText("Connectez-vous pour consulter vos notifications.")
    ).toBeInTheDocument();

    expect(authFetch).not.toHaveBeenCalled();
  });

  it("affiche un message si le client n'a aucune notification", async () => {
    localStorage.setItem("clientId", "2");

    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [] }),
    });

    render(<ClientNotifications />);

    expect(
      await screen.findByText(
        "Vous n'avez aucune notification pour le moment."
      )
    ).toBeInTheDocument();

    expect(authFetch).toHaveBeenCalledWith(
      "/api/notifications/client/2"
    );
  });

  it("affiche les notifications non lues du client", async () => {
    localStorage.setItem("clientId", "2");

    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [
          {
            id: 1,
            statut: "Accepté",
            message: "Votre dossier a été accepté.",
            lu: false,
            created_at: "2026-10-20T10:00:00",
          },
        ],
      }),
    });

    render(<ClientNotifications />);

    expect(
      await screen.findByText("Votre dossier a été accepté.")
    ).toBeInTheDocument();

    expect(screen.getByText("Nouveau")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Marquer comme lue" })
    ).toBeInTheDocument();
  });

  it("affiche une erreur lorsque le chargement échoue", async () => {
    localStorage.setItem("clientId", "2");

    vi.spyOn(console, "error").mockImplementation(() => {});

    authFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Erreur serveur" }),
    });

    render(<ClientNotifications />);

    expect(
      await screen.findByText("Erreur serveur")
    ).toBeInTheDocument();
  });

  it("permet de marquer une notification comme lue", async () => {
    localStorage.setItem("clientId", "2");

    authFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [
            {
              id: 1,
              statut: "En cours",
              message: "Votre dossier est en cours.",
              lu: false,
              created_at: "2026-10-20T10:00:00",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Notification lue" }),
      });

    render(<ClientNotifications />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Marquer comme lue",
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "Marquer comme lue",
        })
      ).not.toBeInTheDocument();
    });

    expect(authFetch).toHaveBeenCalledWith(
      "/api/notifications/1/read",
      { method: "PATCH" }
    );

    expect(screen.queryByText("Nouveau")).not.toBeInTheDocument();
  });

  it("actualise les notifications après leur création", async () => {
    localStorage.setItem("clientId", "2");

    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [] }),
    });

    render(<ClientNotifications />);

    await screen.findByText(
      "Vous n'avez aucune notification pour le moment."
    );

    window.dispatchEvent(new Event("notification-created"));

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledTimes(2);
    });
  });
});