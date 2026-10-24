const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const pool = require("../db");
const app = require("../server");

const clientToken = jwt.sign(
  { id: 1, role: "client" },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);

const adminToken = jwt.sign(
  { id: 2, role: "admin" },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);

const validDossier = {
  vehicule: "Peugeot 208",
  type_financement: "LLD",
  duree: 36,
};

async function request(method, path, body, token) {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const headers = { connection: "close" };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const response = await fetch(
      `http://127.0.0.1:${server.address().port}${path}`,
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

async function withMockQuery(mock, callback) {
  const originalQuery = pool.query;
  pool.query = mock;

  try {
    return await callback();
  } finally {
    pool.query = originalQuery;
  }
}

test("POST dossier : refus sans token", async () => {
  const response = await request("POST", "/api/dossiers", validDossier);
  assert.equal(response.status, 401);
});

test("POST dossier : champs obligatoires", async () => {
  const response = await request(
    "POST", "/api/dossiers", {}, clientToken
  );

  assert.equal(response.status, 400);
});

test("POST dossier : création réussie", async () => {
  await withMockQuery(async (sql, params) => {
    assert.match(sql, /INSERT INTO dossiers/);
    assert.deepEqual(params, [1, "Peugeot 208", "LLD", 36]);

    return {
      rows: [{
        id: 10,
        client_id: 1,
        ...validDossier,
        statut: "En attente",
      }],
    };
  }, async () => {
    const response = await request(
      "POST", "/api/dossiers", validDossier, clientToken
    );

    assert.equal(response.status, 201);
    assert.equal(response.data.dossier.client_id, 1);
  });
});

test("POST dossier : erreur SQL", async () => {
  const originalError = console.error;
  console.error = () => {};

  try {
    await withMockQuery(async () => {
      throw new Error("Erreur SQL simulée");
    }, async () => {
      const response = await request(
        "POST", "/api/dossiers", validDossier, clientToken
      );

      assert.equal(response.status, 500);
    });
  } finally {
    console.error = originalError;
  }
});

test("GET dossier client : refus sans token", async () => {
  const response = await request(
    "GET", "/api/dossiers/client/1"
  );

  assert.equal(response.status, 401);
});

test("GET dossier client : accès interdit à un autre client", async () => {
  const response = await request(
    "GET", "/api/dossiers/client/99", undefined, clientToken
  );

  assert.equal(response.status, 403);
});

test("GET dossier client : récupération réussie", async () => {
  await withMockQuery(async (sql, params) => {
    assert.match(sql, /FROM dossiers/);
    assert.deepEqual(params, ["1"]);

    return {
      rows: [{
        id: 10,
        client_id: 1,
        ...validDossier,
      }],
    };
  }, async () => {
    const response = await request(
      "GET", "/api/dossiers/client/1", undefined, clientToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.dossier.id, 10);
  });
});

test("GET dossier client : aucun dossier", async () => {
  await withMockQuery(async () => ({ rows: [] }), async () => {
    const response = await request(
      "GET", "/api/dossiers/client/1", undefined, clientToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.dossier, null);
  });
});

test("GET dossiers admin : refus pour un client", async () => {
  const response = await request(
    "GET", "/api/dossiers", undefined, clientToken
  );

  assert.equal(response.status, 403);
});

test("GET dossiers admin : liste récupérée", async () => {
  await withMockQuery(async () => ({
    rows: [{ id: 10, client_id: 1 }],
  }), async () => {
    const response = await request(
      "GET", "/api/dossiers", undefined, adminToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.dossiers.length, 1);
  });
});

test("PUT statut dossier : refus sans token", async () => {
  const response = await request(
    "PUT",
    "/api/dossiers/10/statut",
    { statut: "Dossier validé" }
  );

  assert.equal(response.status, 401);
});

test("PUT statut dossier : refus pour un client", async () => {
  const response = await request(
    "PUT",
    "/api/dossiers/10/statut",
    { statut: "Dossier validé" },
    clientToken
  );

  assert.equal(response.status, 403);
});

test("PUT statut dossier : statut invalide", async () => {
  const response = await request(
    "PUT",
    "/api/dossiers/10/statut",
    { statut: "Inconnu" },
    adminToken
  );

  assert.equal(response.status, 400);
});

test("PUT statut dossier : dossier introuvable", async () => {
  await withMockQuery(async () => ({ rows: [] }), async () => {
    const response = await request(
      "PUT",
      "/api/dossiers/999/statut",
      { statut: "Dossier validé" },
      adminToken
    );

    assert.equal(response.status, 404);
  });
});

test("PUT statut dossier : mise à jour réussie", async () => {
  await withMockQuery(async (sql, params) => {
    assert.match(sql, /UPDATE dossiers/);
    assert.deepEqual(params, ["Dossier validé", "10"]);

    return {
      rows: [{
        id: 10,
        client_id: 1,
        statut: "Dossier validé",
      }],
    };
  }, async () => {
    const response = await request(
      "PUT",
      "/api/dossiers/10/statut",
      { statut: "Dossier validé" },
      adminToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.dossier.statut, "Dossier validé");
  });
});