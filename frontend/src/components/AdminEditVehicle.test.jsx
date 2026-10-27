import {
    describe, it, expect, vi, afterEach,
  } from "vitest";
  
  import {
    render, screen, fireEvent, waitFor,
  } from "@testing-library/react";
  
  import AdminEditVehicle from "./AdminEditVehicle";
  
  describe("AdminEditVehicle - Administration", () => {
    const vehicle = {
      id: 5,
      brand: "Peugeot",
      model: "308",
      year: 2022,
      fuel: "Essence",
      transmission: "Manuelle",
      price: 22000,
      monthlyPrice: 300,
      image: "/images/308.jpg",
      type: "achat",
    };
  
    const renderForm = (setVehicleList = vi.fn()) => {
      render(
        <AdminEditVehicle
          vehicle={vehicle}
          setVehicleList={setVehicleList}
        />
      );
      return setVehicleList;
    };
  
    const modifierVehicule = () => {
      fireEvent.change(screen.getByLabelText("Marque"), {
        target: { value: "Renault" },
      });
  
      fireEvent.change(screen.getByLabelText("Modèle"), {
        target: { value: "Clio" },
      });
  
      fireEvent.change(screen.getByLabelText("Prix (€)"), {
        target: { value: "18000" },
      });
    };
  
    const soumettre = () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Enregistrer les modifications",
        })
      );
    };
  
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      localStorage.clear();
    });
  // test formulaire//
    it("affiche les informations du véhicule à modifier", () => {
      renderForm();
  
      expect(
        screen.getByRole("heading", {
          name: "Modifier le véhicule",
        })
      ).toBeInTheDocument();
  
      expect(screen.getByLabelText("Marque")).toHaveValue("Peugeot");
      expect(screen.getByLabelText("Modèle")).toHaveValue("308");
      expect(screen.getByLabelText("Prix (€)")).toHaveValue(22000);
    });
  // test modification des champs//
    it("permet de modifier les champs du véhicule", () => {
      renderForm();
      modifierVehicule();
  
      expect(screen.getByLabelText("Marque")).toHaveValue("Renault");
      expect(screen.getByLabelText("Modèle")).toHaveValue("Clio");
      expect(screen.getByLabelText("Prix (€)")).toHaveValue(18000);
    });
  // test envoie des requetes PUT avec JWT//
    it("envoie une requête PUT avec le token JWT", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          vehicle: { ...vehicle, brand: "Renault", model: "Clio" },
        }),
      });
  
      vi.stubGlobal("fetch", fetchMock);
      vi.stubGlobal("alert", vi.fn());
      localStorage.setItem("authToken", "token-admin");
  
      renderForm();
      modifierVehicule();
      soumettre();
  
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
  
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/vehicles/5",
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            Authorization: "Bearer token-admin",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            ...vehicle,
            brand: "Renault",
            model: "Clio",
            price: "18000",
          }),
        })
      );
    });
  //test mise a jour de la liste//
    it("met à jour la liste après une modification réussie", async () => {
      const updatedVehicle = {
        ...vehicle,
        brand: "Renault",
        model: "Clio",
      };
  
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            vehicle: updatedVehicle,
          }),
        })
      );
      vi.stubGlobal("alert", vi.fn());
  
      const setVehicleList = renderForm();
      modifierVehicule();
      soumettre();
  
      await waitFor(() => {
        expect(setVehicleList).toHaveBeenCalledTimes(1);
      });
  
      const updater = setVehicleList.mock.calls[0][0];
      const autreVehicule = { id: 9, brand: "Citroën" };
  
      expect(updater([vehicle, autreVehicule])).toEqual([
        updatedVehicle,
        autreVehicule,
      ]);
  
      expect(window.alert).toHaveBeenCalledWith(
        "Le véhicule a été modifié."
      );
    });
  // test erreurs API//
    it("affiche une erreur si la modification est refusée", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: async () => ({
            message: "Modification non autorisée.",
          }),
        })
      );
  
      vi.stubGlobal("alert", vi.fn());
      vi.spyOn(console, "error").mockImplementation(() => {});
  
      const setVehicleList = renderForm();
      soumettre();
  
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Modification non autorisée."
        );
      });
  
      expect(setVehicleList).not.toHaveBeenCalled();
    });
  });