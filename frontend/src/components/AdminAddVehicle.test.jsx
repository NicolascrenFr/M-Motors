import {
    describe,
    it,
    expect,
    vi,
    afterEach,
  } from "vitest";
  
  import {
    render,
    screen,
    fireEvent,
    waitFor,
  } from "@testing-library/react";
  
  import AdminAddVehicle from "./AdminAddVehicle";
  
  describe("AdminAddVehicle - Administration", () => {
    const remplirFormulaire = () => {
      fireEvent.change(screen.getByLabelText("Marque"), {
        target: { value: "Renault" },
      });
  
      fireEvent.change(screen.getByLabelText("Modèle"), {
        target: { value: "Clio" },
      });
  
      fireEvent.change(screen.getByLabelText("Année"), {
        target: { value: "2024" },
      });
  
      fireEvent.change(screen.getByLabelText("Motorisation"), {
        target: { value: "Essence" },
      });
  
      fireEvent.change(screen.getByLabelText("Transmission"), {
        target: { value: "Manuelle" },
      });
  
      fireEvent.change(screen.getByLabelText("Prix (€)"), {
        target: { value: "18000" },
      });
  
      fireEvent.change(screen.getByLabelText("Prix mensuel (€)"), {
        target: { value: "250" },
      });
  
      fireEvent.change(screen.getByLabelText("Image du véhicule"), {
        target: { value: "/images/clio.jpg" },
      });
  
      fireEvent.change(screen.getByLabelText("Type"), {
        target: { value: "location" },
      });
    };
  
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      localStorage.clear();
    });
 //test affichage du formulaire// 
    it("affiche le formulaire d'ajout de véhicule", () => {
      render(<AdminAddVehicle setVehicleList={vi.fn()} />);
  
      expect(
        screen.getByRole("heading", {
          name: "Ajouter un véhicule",
        })
      ).toBeInTheDocument();
  
      expect(screen.getByLabelText("Marque")).toBeInTheDocument();
      expect(screen.getByLabelText("Modèle")).toBeInTheDocument();
      expect(screen.getByLabelText("Prix (€)")).toBeInTheDocument();
    });
  //test saisie des donnees//
    it("permet de saisir les informations du véhicule", () => {
      render(<AdminAddVehicle setVehicleList={vi.fn()} />);
  
      remplirFormulaire();
  
      expect(screen.getByLabelText("Marque")).toHaveValue("Renault");
      expect(screen.getByLabelText("Modèle")).toHaveValue("Clio");
      expect(screen.getByLabelText("Année")).toHaveValue(2024);
      expect(screen.getByLabelText("Type")).toHaveValue("location");
    });
  // test authentification envoi au JWT//
    it("envoie les données du véhicule avec le token JWT", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          vehicle: { id: 10, brand: "Renault", model: "Clio" },
        }),
      });
  
      vi.stubGlobal("fetch", fetchMock);
      vi.stubGlobal("alert", vi.fn());
      vi.spyOn(console, "log").mockImplementation(() => {});
  
      localStorage.setItem("authToken", "token-admin");
  
      render(<AdminAddVehicle setVehicleList={vi.fn()} />);
  
      remplirFormulaire();
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Ajouter le véhicule",
        })
      );
  
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
  
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/vehicles",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token-admin",
          }),
          body: JSON.stringify({
            brand: "Renault",
            model: "Clio",
            year: "2024",
            fuel: "Essence",
            transmission: "Manuelle",
            price: "18000",
            monthlyPrice: "250",
            image: "/images/clio.jpg",
            type: "location",
          }),
        })
      );
    });
  //test ajout véhicule réussi//
    it("met à jour la liste après un ajout réussi", async () => {
      const nouveauVehicule = {
        id: 10,
        brand: "Renault",
        model: "Clio",
      };
  
      const setVehicleList = vi.fn();
  
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            vehicle: nouveauVehicule,
          }),
        })
      );
  
      vi.stubGlobal("alert", vi.fn());
      vi.spyOn(console, "log").mockImplementation(() => {});
  
      render(<AdminAddVehicle setVehicleList={setVehicleList} />);
  
      remplirFormulaire();
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Ajouter le véhicule",
        })
      );
  
      await waitFor(() => {
        expect(setVehicleList).toHaveBeenCalledTimes(1);
      });
  
      const updater = setVehicleList.mock.calls[0][0];
  
      expect(updater([{ id: 1 }])).toEqual([
        { id: 1 },
        nouveauVehicule,
      ]);
  
      expect(window.alert).toHaveBeenCalledWith(
        "Le véhicule a été ajouté au catalogue."
      );
  
      expect(screen.getByLabelText("Marque")).toHaveValue("");
      expect(screen.getByLabelText("Type")).toHaveValue("achat");
    });
  // test gestion erreurs API//
    it("affiche une erreur lorsque l'API refuse l'ajout", async () => {
      const setVehicleList = vi.fn();
  
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: async () => ({
            message: "Accès administrateur refusé.",
          }),
        })
      );
  
      vi.stubGlobal("alert", vi.fn());
      vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
  
      render(<AdminAddVehicle setVehicleList={setVehicleList} />);
  
      remplirFormulaire();
  
      fireEvent.click(
        screen.getByRole("button", {
          name: "Ajouter le véhicule",
        })
      );
  
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Accès administrateur refusé."
        );
      });
  
      expect(setVehicleList).not.toHaveBeenCalled();
    });
  });