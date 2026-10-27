import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
  } from "vitest";
  
  import {
    apiUrl,
    getToken,
    getCurrentUser,
    saveSession,
    clearSession,
    authFetch,
  } from "./auth";
  
  describe("auth.js - Gestion de l'authentification", () => {
    beforeEach(() => {
      localStorage.clear();
    });
  
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });
  
    it("construit correctement une URL API", () => {
      expect(apiUrl("/api/vehicles")).toBe(
        "http://localhost:3000/api/vehicles"
      );
    });
  
    it("retourne null sans token", () => {
      expect(getToken()).toBeNull();
    });
  
    it("récupère le token enregistré", () => {
      localStorage.setItem("authToken", "token-test");
  
      expect(getToken()).toBe("token-test");
    });
  
    it("retourne null sans utilisateur connecté", () => {
      expect(getCurrentUser()).toBeNull();
    });
  
    it("récupère l'utilisateur connecté", () => {
      const client = { id: 1, email: "client@test.fr" };
  
      localStorage.setItem(
        "authUser",
        JSON.stringify(client)
      );
  
      expect(getCurrentUser()).toEqual(client);
    });
  
    it("retourne null si les données utilisateur sont invalides", () => {
      localStorage.setItem("authUser", "JSON-invalide");
  
      vi.spyOn(console, "error").mockImplementation(() => {});
  
      expect(getCurrentUser()).toBeNull();
    });
  
    it("enregistre une session client", () => {
      const client = { id: 2, email: "client@test.fr" };
  
      saveSession("token-test", client);
  
      expect(localStorage.getItem("authToken")).toBe(
        "token-test"
      );
  
      expect(getCurrentUser()).toEqual(client);
  
      expect(localStorage.getItem("clientId")).toBe("2");
    });
  
    it("supprime les informations de session", () => {
      saveSession("token-test", { id: 2 });
  
      clearSession();
  
      expect(localStorage.getItem("authToken")).toBeNull();
      expect(localStorage.getItem("authUser")).toBeNull();
      expect(localStorage.getItem("clientId")).toBeNull();
    });
  
    it("ajoute le token aux requêtes authentifiées", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
      });
  
      vi.stubGlobal("fetch", fetchMock);
  
      localStorage.setItem("authToken", "token-test");
  
      await authFetch("/api/dossiers", {
        method: "GET",
      });
  
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/dossiers"),
        expect.objectContaining({
          method: "GET",
          headers: {
            Authorization: "Bearer token-test",
          },
        })
      );
    });
  
    it("effectue une requête sans token", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
      });
  
      vi.stubGlobal("fetch", fetchMock);
  
      await authFetch("/api/vehicles");
  
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/vehicles"),
        expect.objectContaining({
          headers: {},
        })
      );
    });
  });