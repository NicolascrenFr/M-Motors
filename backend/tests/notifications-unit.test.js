
const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../server");
const pool = require("../db");

const handler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/notifications" &&
    layer.route.methods.post
).route.stack[2].handle;

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

const validNotification = {
  dossier_id: 1,
  client_id: 2,
  message: "Votre dossier a été validé.",
};

test("UNIT notifications : champs obligatoires", async () => {
  const res = mockResponse();

  await handler({ body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(
    res.body.message,
    "dossier_id, client_id et message sont obligatoires."
  );
});

test("UNIT notifications : dossier introuvable", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({ rows: [] });

    const res = mockResponse();
    await handler({ body: validNotification }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Dossier introuvable.");
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT notifications : dossier d'un autre client", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({
      rows: [{ id: 1, client_id: 999, statut: "en_attente" }],
    });

    const res = mockResponse();
    await handler({ body: validNotification }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.message,
      "Le dossier ne correspond pas au client indiqué."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT notifications : création réussie", async () => {
  const originalQuery = pool.query;
  let calls = 0;

  try {
    pool.query = async (sql, params) => {
      calls++;

      if (calls === 1) {
        assert.match(sql, /FROM dossiers/);
        assert.deepEqual(params, [1]);

        return {
          rows: [{ id: 1, client_id: 2, statut: "validé" }],
        };
      }

      assert.match(sql, /INSERT INTO notifications/);
      assert.deepEqual(params, [
        1,
        2,
        "Votre dossier a été validé.",
      ]);

      return {
        rows: [{
          id: 10,
          dossier_id: 1,
          client_id: 2,
          message: validNotification.message,
        }],
      };
    };

    const res = mockResponse();
    await handler({ body: validNotification }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.notification.id, 10);
    assert.equal(
      res.body.message,
      "Notification envoyée avec succès."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT notifications : erreur SQL sur le dossier", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();
    await handler({ body: validNotification }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de créer la notification."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

test("UNIT notifications : erreur SQL à l'insertion", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;
  let calls = 0;

  try {
    pool.query = async () => {
      calls++;

      if (calls === 1) {
        return { rows: [{ id: 1, client_id: 2 }] };
      }

      throw new Error("Erreur insertion simulée");
    };
    console.error = () => {};

    const res = mockResponse();
    await handler({ body: validNotification }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de créer la notification."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


const adminListHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/notifications" &&
    layer.route.methods.get
).route.stack[2].handle;

const clientListHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/notifications/client/:client_id" &&
    layer.route.methods.get
).route.stack[1].handle;

const markReadHandler = app._router.stack.find(
  (layer) =>
    layer.route?.path === "/api/notifications/:id/read" &&
    layer.route.methods.patch
).route.stack[1].handle;

// GET /api/notifications : administrateur

test("UNIT notifications GET admin : liste récupérée", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql) => {
      assert.match(sql, /FROM notifications/);
      assert.match(sql, /INNER JOIN clients/);

      return {
        rows: [{ id: 1, message: "Notification test" }],
      };
    };

    const res = mockResponse();
    await adminListHandler({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.notifications.length, 1);
    assert.equal(res.body.notifications[0].id, 1);
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT notifications GET admin : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();
    await adminListHandler({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de récupérer les notifications."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

// GET /api/notifications/client/:client_id

test("UNIT notifications GET client : accès interdit", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => {
      throw new Error("La base ne doit pas être appelée");
    };

    const res = mockResponse();

    await clientListHandler({
      params: { client_id: "2" },
      user: { id: 1, role: "client" },
    }, res);

    assert.equal(res.statusCode, 403);
    assert.equal(
      res.body.message,
      "Accès interdit à ces documents."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT notifications GET client : liste récupérée", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /WHERE notifications.client_id = \$1/);
      assert.deepEqual(params, ["2"]);

      return {
        rows: [{ id: 5, client_id: 2, lu: false }],
      };
    };

    const res = mockResponse();

    await clientListHandler({
      params: { client_id: "2" },
      user: { id: 2, role: "client" },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.notifications.length, 1);
    assert.equal(res.body.notifications[0].id, 5);
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT notifications GET client : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await clientListHandler({
      params: { client_id: "2" },
      user: { id: 2, role: "client" },
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de récupérer les notifications."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

// PATCH /api/notifications/:id/read

test("UNIT notifications PATCH : marquage comme lu réussi", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /UPDATE notifications/);
      assert.deepEqual(params, ["5", 2]);

      return {
        rows: [{ id: 5, client_id: 2, lu: true }],
      };
    };

    const res = mockResponse();

    await markReadHandler({
      params: { id: "5" },
      user: { id: 2, role: "client" },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.notification.lu, true);
    assert.equal(
      res.body.message,
      "Notification marquée comme lue."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT notifications PATCH : notification introuvable", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({ rows: [] });

    const res = mockResponse();

    await markReadHandler({
      params: { id: "999" },
      user: { id: 2, role: "client" },
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(
      res.body.message,
      "Notification introuvable."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT notifications PATCH : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await markReadHandler({
      params: { id: "5" },
      user: { id: 2, role: "client" },
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Impossible de mettre à jour la notification."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

