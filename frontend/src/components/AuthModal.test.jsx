import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import AuthModal from "./AuthModal";

describe("AuthModal - Authentification", () => {
  const renderModal = () => {
    return render(
      <AuthModal
        onClose={vi.fn()}
        onAuthenticated={vi.fn()}
      />
    );
  };

  it("affiche le formulaire de connexion", () => {
    renderModal();

    expect(
      screen.getByRole("button", { name: "Se connecter" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Adresse e-mail")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Mot de passe")
    ).toBeInTheDocument();
  });

  it("permet d'afficher le formulaire d'inscription", () => {
    renderModal();

    fireEvent.click(
      screen.getByRole("button", { name: "Créer un compte" })
    );

    expect(
      screen.getByRole("heading", { name: "Créer mon compte" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Prénom")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Nom")
    ).toBeInTheDocument();
  });

  it("permet de revenir au formulaire de connexion", () => {
    renderModal();

    fireEvent.click(
      screen.getByRole("button", { name: "Créer un compte" })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "J'ai déjà un compte",
      })
    );

    expect(
      screen.getByRole("button", { name: "Se connecter" })
    ).toBeInTheDocument();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("connecte un client avec des identifiants valides", async () => {
    const client = { client_id: 1, email: "client@test.fr" };
    const onClose = vi.fn();
    const onAuthenticated = vi.fn();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "token-test",
        client,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthModal
        onClose={onClose}
        onAuthenticated={onAuthenticated}
      />
    );

    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "client@test.fr" },
    });

    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "motdepasse123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Se connecter" })
    );

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(client);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "client@test.fr",
          password: "motdepasse123",
        }),
      })
    );
  });

  it("affiche une erreur lorsque la connexion est refusée", async () => {
    const onClose = vi.fn();
    const onAuthenticated = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: "Identifiants incorrects.",
        }),
      })
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <AuthModal
        onClose={onClose}
        onAuthenticated={onAuthenticated}
      />
    );

    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "client@test.fr" },
    });

    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "mauvais123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Se connecter" })
    );

    expect(
      await screen.findByText("Identifiants incorrects.")
    ).toBeInTheDocument();

    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
  //test inscription reussie//
  it("inscrit un nouveau client", async () => {
    const client = {
      client_id: 3,
      email: "nouveau@test.fr",
    };
  
    const onAuthenticated = vi.fn();
    const onClose = vi.fn();
  
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "token-inscription",
        client,
      }),
    });
  
    vi.stubGlobal("fetch", fetchMock);
  
    render(
      <AuthModal
        onClose={onClose}
        onAuthenticated={onAuthenticated}
      />
    );
  
    fireEvent.click(
      screen.getByRole("button", { name: "Créer un compte" })
    );
  
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Jean" },
    });
  
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Dupont" },
    });
  
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "nouveau@test.fr" },
    });
  
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "motdepasse123" },
    });
  
    fireEvent.click(
      screen.getByRole("button", { name: "Créer mon compte" })
    );
  
    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(client);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/register"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          nom: "Dupont",
          prenom: "Jean",
          email: "nouveau@test.fr",
          password: "motdepasse123",
        }),
      })
    );
  });
  //test demande de reinitialisation du mot de passe//
  it("permet de demander une réinitialisation du mot de passe", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Demande de réinitialisation enregistrée.",
        resetToken: "token-reset-test",
      }),
    });
  
    vi.stubGlobal("fetch", fetchMock);
  
    renderModal();
  
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mot de passe oublié ?",
      })
    );
  
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "client@test.fr" },
    });
  
    fireEvent.click(
      screen.getByRole("button", {
        name: "Réinitialiser mon mot de passe",
      })
    );
  
    expect(
      await screen.findByRole("heading", {
        name: "Nouveau mot de passe",
      })
    ).toBeInTheDocument();
  
    expect(
      screen.getByLabelText("Token de réinitialisation")
    ).toHaveValue("token-reset-test");
  
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/forgot-password"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "client@test.fr",
        }),
      })
    );
  });
  //test modification du mot de passe//
  it("permet de définir un nouveau mot de passe", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Demande enregistrée.",
          resetToken: "token-reset-test",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Mot de passe modifié avec succès.",
        }),
      });
  
    vi.stubGlobal("fetch", fetchMock);
  
    renderModal();
  
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mot de passe oublié ?",
      })
    );
  
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "client@test.fr" },
    });
  
    fireEvent.click(
      screen.getByRole("button", {
        name: "Réinitialiser mon mot de passe",
      })
    );
  
    await screen.findByRole("heading", {
      name: "Nouveau mot de passe",
    });
  
    fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), {
      target: { value: "nouveauMotDePasse123" },
    });
  
    fireEvent.click(
      screen.getByRole("button", {
        name: "Définir le nouveau mot de passe",
      })
    );
  
    expect(
      await screen.findByText("Mot de passe modifié avec succès.")
    ).toBeInTheDocument();
  
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/auth/reset-password"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "token-reset-test",
          password: "nouveauMotDePasse123",
        }),
      })
    );
  });
});