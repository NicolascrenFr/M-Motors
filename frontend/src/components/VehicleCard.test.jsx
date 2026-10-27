import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VehicleCard from "./VehicleCard";

describe("VehicleCard - Catalogue des véhicules", () => {
  const vehicle = {
    id: 1,
    brand: "Peugeot",
    model: "308",
    year: 2023,
    fuel: "Essence",
    transmission: "Automatique",
    price: 25000,
    monthlyPrice: 350,
    type: "achat",
    image: "/images/peugeot-308.jpg",
  };

  const renderCard = (overrides = {}) => {
    const props = {
      vehicle,
      onDetails: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      isAdmin: false,
      ...overrides,
    };

    render(<VehicleCard {...props} />);

    return props;
  };

  it("affiche les informations d'un véhicule à vendre", () => {
    renderCard();

    expect(screen.getByRole("heading", {
      name: "Peugeot 308",
    })).toBeInTheDocument();

    expect(screen.getByText("À vendre")).toBeInTheDocument();
    expect(screen.getByText(/25[\s\u202f]000 €|25000 €/)).toBeInTheDocument();

    expect(screen.getByRole("img", {
      name: "Peugeot 308",
    })).toHaveAttribute("src", "/images/peugeot-308.jpg");
  });

  it("affiche le tarif mensuel d'un véhicule en location", () => {
    renderCard({
      vehicle: { ...vehicle, type: "location" },
    });

    expect(screen.getByText("En location")).toBeInTheDocument();
    expect(screen.getByText("350 €/mois")).toBeInTheDocument();
  });

  it("permet de consulter les détails du véhicule", () => {
    const props = renderCard();

    fireEvent.click(screen.getByRole("button", {
      name: "Voir le véhicule",
    }));

    expect(props.onDetails).toHaveBeenCalledWith(vehicle);
  });

  it("masque les actions administrateur pour un client", () => {
    renderCard();

    expect(screen.queryByRole("button", {
      name: "Modifier le véhicule",
    })).not.toBeInTheDocument();

    expect(screen.queryByRole("button", {
      name: "Supprimer le véhicule",
    })).not.toBeInTheDocument();
  });

  it("permet à l'administrateur de modifier et supprimer un véhicule", () => {
    const props = renderCard({ isAdmin: true });

    fireEvent.click(screen.getByRole("button", {
      name: "Modifier le véhicule",
    }));

    expect(props.onEdit).toHaveBeenCalledWith(vehicle);

    fireEvent.click(screen.getByRole("button", {
      name: "Supprimer le véhicule",
    }));

    expect(props.onDelete).toHaveBeenCalledWith(vehicle.id);
  });
});