
const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../server");
const pool = require("../db");

const route = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/vehicles" &&
    layer.route.methods.get
);

const handler = route.route.stack[0].handle;

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

test("UNIT GET vehicles : liste récupérée", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({
      rows: [{ id: 1, brand: "Renault", model: "Clio" }],
    });

    const res = mockResponse();

    await handler({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.vehicles.length, 1);
    assert.equal(res.body.vehicles[0].brand, "Renault");
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT GET vehicles : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await handler({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de récupérer les véhicules."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


const addHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/vehicles" &&
    layer.route.methods.post
).route.stack[2].handle;

const validVehicle = {
  brand: "Renault",
  model: "Clio",
  year: 2022,
  fuel: "Essence",
  transmission: "Manuelle",
  price: 15000,
  monthlyPrice: 250,
  type: "achat",
  image: "clio.jpg",
};

test("UNIT POST vehicles : champs obligatoires", async () => {
  const res = mockResponse();

  await addHandler({ body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(
    res.body.message,
    "Tous les champs du véhicule sont obligatoires."
  );
});

test("UNIT POST vehicles : ajout réussi", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /INSERT INTO vehicles/);
      assert.equal(params[0], "Renault");
      assert.equal(params[2], 2022);
      assert.equal(params[5], 15000);
      assert.equal(params[6], 250);

      return {
        rows: [{ id: 1, brand: "Renault", model: "Clio" }],
      };
    };

    const res = mockResponse();

    await addHandler({ body: validVehicle }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.vehicle.id, 1);
    assert.equal(
      res.body.message,
      "Véhicule ajouté avec succès."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT POST vehicles : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await addHandler({ body: validVehicle }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible d'ajouter le véhicule."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


const editHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/vehicles/:id" &&
    layer.route.methods.put
).route.stack[2].handle;

test("UNIT PUT vehicles : champs obligatoires", async () => {
  const res = mockResponse();

  await editHandler(
    { params: { id: "1" }, body: {} },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(
    res.body.message,
    "Tous les champs du véhicule sont obligatoires."
  );
});

test("UNIT PUT vehicles : modification réussie", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /UPDATE vehicles/);
      assert.equal(params[0], "Renault");
      assert.equal(params[2], 2022);
      assert.equal(params[5], 15000);
      assert.equal(params[6], 250);
      assert.equal(params[9], "1");

      return {
        rows: [{ id: 1, brand: "Renault", model: "Clio" }],
      };
    };

    const res = mockResponse();

    await editHandler(
      { params: { id: "1" }, body: validVehicle },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.vehicle.id, 1);
    assert.equal(
      res.body.message,
      "Véhicule modifié avec succès."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT PUT vehicles : véhicule introuvable", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({ rows: [] });

    const res = mockResponse();

    await editHandler(
      { params: { id: "999" }, body: validVehicle },
      res
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Véhicule introuvable.");
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT PUT vehicles : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await editHandler(
      { params: { id: "1" }, body: validVehicle },
      res
    );

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de modifier le véhicule."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


const deleteHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/vehicles/:id" &&
    layer.route.methods.delete
).route.stack[2].handle;

test("UNIT DELETE vehicles : suppression réussie", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /DELETE FROM vehicles/);
      assert.deepEqual(params, ["1"]);

      return {
        rows: [{ id: 1, brand: "Renault", model: "Clio" }],
      };
    };

    const res = mockResponse();

    await deleteHandler({ params: { id: "1" } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.vehicle.id, 1);
    assert.equal(
      res.body.message,
      "Véhicule supprimé avec succès."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT DELETE vehicles : véhicule introuvable", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({ rows: [] });

    const res = mockResponse();

    await deleteHandler({ params: { id: "999" } }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Véhicule introuvable.");
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT DELETE vehicles : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await deleteHandler({ params: { id: "1" } }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de supprimer le véhicule."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


