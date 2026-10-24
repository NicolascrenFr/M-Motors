const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const pool = require("../db");
const app = require("../server");

async function request(method, path, body, token) {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const port = server.address().port;

    const headers = {
        connection: "close",
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const response = await fetch(
      `http://127.0.0.1:${port}${path}`,
      {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }
    );

    return {
      status: response.status,
      data: await response.json(),
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test("GET véhicules : retourne la liste", async () => {
  const originalQuery = pool.query;

  pool.query = async () => ({
    rows: [
      {
        id: 1,
        brand: "Renault",
        model: "Clio",
      },
    ],
  });

  try {
    const response = await request("GET", "/api/vehicles");

    assert.equal(response.status, 200);
    assert.equal(response.data.vehicles.length, 1);
    assert.equal(response.data.vehicles[0].brand, "Renault");
  } finally {
    pool.query = originalQuery;
  }
});

test("GET véhicules : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  pool.query = async () => {
    throw new Error("Erreur SQL simulée");
  };

  console.error = () => {};

  try {
    const response = await request("GET", "/api/vehicles");

    assert.equal(response.status, 500);
    assert.equal(
      response.data.message,
      "Impossible de récupérer les véhicules."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

test("POST véhicules : accès refusé sans token", async () => {
  const response = await request(
    "POST",
    "/api/vehicles",
    {}
  );

  assert.equal(response.status, 401);
});

test("POST véhicules : accès refusé à un client", async () => {
  const token = jwt.sign(
    { id: 1, role: "client" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  const response = await request(
    "POST",
    "/api/vehicles",
    {},
    token
  );

  assert.equal(response.status, 403);
});

test("POST véhicules : champs obligatoires", async () => {
  const token = jwt.sign(
    { id: 2, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  const response = await request(
    "POST",
    "/api/vehicles",
    {},
    token
  );

  assert.equal(response.status, 400);
  assert.equal(
    response.data.message,
    "Tous les champs du véhicule sont obligatoires."
  );
});

const adminToken = jwt.sign(
    { id: 2, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
  
  const validVehicle = {
    brand: "Peugeot",
    model: "208",
    year: 2023,
    fuel: "Essence",
    transmission: "Manuelle",
    price: 18000,
    monthlyPrice: 250,
    type: "Citadine",
    image: "peugeot.jpg",
  };
  
  test("POST véhicules : création réussie", async () => {
    const originalQuery = pool.query;
  
    pool.query = async (sql, params) => {
      assert.match(sql, /INSERT INTO vehicles/);
      assert.equal(params[0], "Peugeot");
  
      return {
        rows: [{ id: 10, ...validVehicle }],
      };
    };
  
    try {
      const response = await request(
        "POST",
        "/api/vehicles",
        validVehicle,
        adminToken
      );
  
      assert.equal(response.status, 201);
      assert.equal(
        response.data.message,
        "Véhicule ajouté avec succès."
      );
      assert.equal(response.data.vehicle.id, 10);
    } finally {
      pool.query = originalQuery;
    }
  });
  
  test("POST véhicules : erreur SQL", async () => {
    const originalQuery = pool.query;
    const originalError = console.error;
  
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
  
    console.error = () => {};
  
    try {
      const response = await request(
        "POST",
        "/api/vehicles",
        validVehicle,
        adminToken
      );
  
      assert.equal(response.status, 500);
      assert.equal(
        response.data.message,
        "Impossible d'ajouter le véhicule."
      );
    } finally {
      pool.query = originalQuery;
      console.error = originalError;
    }
  });
  
  test("PUT véhicules : accès refusé sans token", async () => {
    const response = await request(
      "PUT",
      "/api/vehicles/10",
      validVehicle
    );
  
    assert.equal(response.status, 401);
  });
  
  test("PUT véhicules : modification réussie", async () => {
    const originalQuery = pool.query;
  
    pool.query = async (sql, params) => {
      assert.match(sql, /UPDATE vehicles/);
      assert.equal(params[9], "10");
  
      return {
        rows: [{ id: 10, ...validVehicle }],
      };
    };
  
    try {
      const response = await request(
        "PUT",
        "/api/vehicles/10",
        validVehicle,
        adminToken
      );
  
      assert.equal(response.status, 200);
      assert.equal(
        response.data.message,
        "Véhicule modifié avec succès."
      );
    } finally {
      pool.query = originalQuery;
    }
  });
  
  test("PUT véhicules : véhicule introuvable", async () => {
    const originalQuery = pool.query;
  
    pool.query = async () => ({
      rows: [],
    });
  
    try {
      const response = await request(
        "PUT",
        "/api/vehicles/999",
        validVehicle,
        adminToken
      );
  
      assert.equal(response.status, 404);
      assert.equal(
        response.data.message,
        "Véhicule introuvable."
      );
    } finally {
      pool.query = originalQuery;
    }
  });
  
  test("DELETE véhicules : accès refusé sans token", async () => {
    const response = await request(
      "DELETE",
      "/api/vehicles/10"
    );
  
    assert.equal(response.status, 401);
  });
  
  test("DELETE véhicules : suppression réussie", async () => {
    const originalQuery = pool.query;
  
    pool.query = async (sql, params) => {
      assert.match(sql, /DELETE FROM vehicles/);
      assert.deepEqual(params, ["10"]);
  
      return {
        rows: [
          { id: 10, brand: "Peugeot", model: "208" },
        ],
      };
    };
  
    try {
      const response = await request(
        "DELETE",
        "/api/vehicles/10",
        undefined,
        adminToken
      );
  
      assert.equal(response.status, 200);
      assert.equal(
        response.data.message,
        "Véhicule supprimé avec succès."
      );
      assert.equal(response.data.vehicle.id, 10);
    } finally {
      pool.query = originalQuery;
    }
  });
  
  test("DELETE véhicules : véhicule introuvable", async () => {
    const originalQuery = pool.query;
  
    pool.query = async () => ({
      rows: [],
    });
  
    try {
      const response = await request(
        "DELETE",
        "/api/vehicles/999",
        undefined,
        adminToken
      );
  
      assert.equal(response.status, 404);
      assert.equal(
        response.data.message,
        "Véhicule introuvable."
      );
    } finally {
      pool.query = originalQuery;
    }
  });