
const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../server");
const pool = require("../db");

const handler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/dossiers" &&
    layer.route.methods.post
).route.stack[1].handle;

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

const validDossier = {
  vehicule: "Renault Clio",
  type_financement: "LOA",
  duree: 36,
};

test("UNIT dossiers POST : champs obligatoires", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => {
      throw new Error("La base ne doit pas être appelée");
    };

    const res = mockResponse();

    await handler({
      user: { id: 2 },
      body: {},
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.message,
      "client_id, vehicule, type_financement et duree sont obligatoires."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT dossiers POST : création réussie", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /INSERT INTO dossiers/);
      assert.deepEqual(params, [
        2,
        "Renault Clio",
        "LOA",
        36,
      ]);

      return {
        rows: [{
          id: 10,
          client_id: 2,
          ...validDossier,
          statut: "en_attente",
        }],
      };
    };

    const res = mockResponse();

    await handler({
      user: { id: 2 },
      body: {
        ...validDossier,
        client_id: 999,
      },
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.dossier.id, 10);
    assert.equal(res.body.dossier.client_id, 2);
    assert.equal(
      res.body.message,
      "Dossier de financement créé avec succès."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT dossiers POST : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await handler({
      user: { id: 2 },
      body: validDossier,
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de créer le dossier de financement."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


const clientDossierHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/dossiers/client/:client_id" &&
    layer.route.methods.get
).route.stack[1].handle;

const adminDossiersHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/dossiers" &&
    layer.route.methods.get
).route.stack[2].handle;

const updateStatutHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/dossiers/:id/statut" &&
    layer.route.methods.put
).route.stack[2].handle;

// GET /api/dossiers/client/:client_id

test("UNIT dossiers GET client : accès interdit", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => {
      throw new Error("La base ne doit pas être appelée");
    };

    const res = mockResponse();

    await clientDossierHandler({
      params: { client_id: "2" },
      user: { id: 1, role: "client" },
    }, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Accès interdit à ces données.");
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT dossiers GET client : dossier récupéré", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /FROM dossiers/);
      assert.match(sql, /LIMIT 1/);
      assert.deepEqual(params, ["2"]);

      return {
        rows: [{ id: 10, client_id: 2, statut: "en_attente" }],
      };
    };

    const res = mockResponse();

    await clientDossierHandler({
      params: { client_id: "2" },
      user: { id: 2, role: "client" },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.dossier.id, 10);
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT dossiers GET client : aucun dossier", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({ rows: [] });

    const res = mockResponse();

    await clientDossierHandler({
      params: { client_id: "2" },
      user: { id: 2, role: "client" },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.dossier, null);
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT dossiers GET client : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await clientDossierHandler({
      params: { client_id: "2" },
      user: { id: 2, role: "client" },
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Impossible de récupérer le dossier.");
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

// GET /api/dossiers : administrateur

test("UNIT dossiers GET admin : liste récupérée", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql) => {
      assert.match(sql, /FROM dossiers/);
      assert.match(sql, /INNER JOIN clients/);

      return {
        rows: [{ id: 10, client_id: 2, statut: "Dossier validé" }],
      };
    };

    const res = mockResponse();
    await adminDossiersHandler({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.dossiers.length, 1);
    assert.equal(res.body.dossiers[0].id, 10);
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT dossiers GET admin : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();
    await adminDossiersHandler({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de récupérer les dossiers clients."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

// PUT /api/dossiers/:id/statut

test("UNIT dossiers PUT statut : statut invalide", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => {
      throw new Error("La base ne doit pas être appelée");
    };

    const res = mockResponse();

    await updateStatutHandler({
      params: { id: "10" },
      body: { statut: "En attente" },
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Statut invalide.");
  } finally {
    pool.query = originalQuery;
  }
});

for (const statut of ["Dossier validé", "Dossier refusé"]) {
  test(`UNIT dossiers PUT statut : ${statut}`, async () => {
    const originalQuery = pool.query;

    try {
      pool.query = async (sql, params) => {
        assert.match(sql, /UPDATE dossiers/);
        assert.deepEqual(params, [statut, "10"]);

        return {
          rows: [{ id: 10, client_id: 2, statut }],
        };
      };

      const res = mockResponse();

      await updateStatutHandler({
        params: { id: "10" },
        body: { statut },
      }, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.dossier.statut, statut);
      assert.equal(
        res.body.message,
        "Statut du dossier mis à jour."
      );
    } finally {
      pool.query = originalQuery;
    }
  });
}

test("UNIT dossiers PUT statut : dossier introuvable", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({ rows: [] });

    const res = mockResponse();

    await updateStatutHandler({
      params: { id: "999" },
      body: { statut: "Dossier validé" },
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Dossier introuvable.");
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT dossiers PUT statut : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await updateStatutHandler({
      params: { id: "10" },
      body: { statut: "Dossier validé" },
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de mettre à jour le statut du dossier."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});