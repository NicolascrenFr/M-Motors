const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const pool = require("../db");
const app = require("../server");

const adminToken = jwt.sign(
  { id: 2, role: "admin" },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);

const clientToken = jwt.sign(
  { id: 1, role: "client" },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);

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

test("POST notification : refus sans token", async () => {
  const response = await request("POST", "/api/notifications", {});
  assert.equal(response.status, 401);
});

test("POST notification : refus pour un client", async () => {
  const response = await request(
    "POST", "/api/notifications", {}, clientToken
  );
  assert.equal(response.status, 403);
});

test("POST notification : champs obligatoires", async () => {
  const response = await request(
    "POST", "/api/notifications", {}, adminToken
  );
  assert.equal(response.status, 400);
});

test("POST notification : dossier introuvable", async () => {
  const originalQuery = pool.query;
  pool.query = async () => ({ rows: [] });

  try {
    const response = await request(
      "POST",
      "/api/notifications",
      { dossier_id: 10, client_id: 1, message: "Test" },
      adminToken
    );

    assert.equal(response.status, 404);
  } finally {
    pool.query = originalQuery;
  }
});

test("POST notification : dossier d'un autre client", async () => {
  const originalQuery = pool.query;

  pool.query = async () => ({
    rows: [{ id: 10, client_id: 99, statut: "en cours" }],
  });

  try {
    const response = await request(
      "POST",
      "/api/notifications",
      { dossier_id: 10, client_id: 1, message: "Test" },
      adminToken
    );

    assert.equal(response.status, 400);
  } finally {
    pool.query = originalQuery;
  }
});

test("POST notification : création réussie", async () => {
  const originalQuery = pool.query;
  let calls = 0;

  pool.query = async () => {
    calls++;

    if (calls === 1) {
      return {
        rows: [{ id: 10, client_id: 1, statut: "en cours" }],
      };
    }

    return {
      rows: [{
        id: 5,
        dossier_id: 10,
        client_id: 1,
        message: "Test",
        lu: false,
      }],
    };
  };

  try {
    const response = await request(
      "POST",
      "/api/notifications",
      { dossier_id: 10, client_id: 1, message: "Test" },
      adminToken
    );

    assert.equal(response.status, 201);
    assert.equal(response.data.notification.id, 5);
    assert.equal(calls, 2);
  } finally {
    pool.query = originalQuery;
  }
});

test("GET notifications admin : refus sans token", async () => {
  const response = await request("GET", "/api/notifications");
  assert.equal(response.status, 401);
});

test("GET notifications admin : liste récupérée", async () => {
  const originalQuery = pool.query;

  pool.query = async () => ({
    rows: [{ id: 5, message: "Test" }],
  });

  try {
    const response = await request(
      "GET", "/api/notifications", undefined, adminToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.notifications.length, 1);
  } finally {
    pool.query = originalQuery;
  }
});

test("GET notifications client : accès interdit à un autre client", async () => {
  const response = await request(
    "GET",
    "/api/notifications/client/99",
    undefined,
    clientToken
  );

  assert.equal(response.status, 403);
});

test("GET notifications client : liste récupérée", async () => {
  const originalQuery = pool.query;

  pool.query = async () => ({
    rows: [{ id: 5, client_id: 1, message: "Test" }],
  });

  try {
    const response = await request(
      "GET",
      "/api/notifications/client/1",
      undefined,
      clientToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.notifications.length, 1);
  } finally {
    pool.query = originalQuery;
  }
});

test("PATCH notification : notification introuvable", async () => {
  const originalQuery = pool.query;

  pool.query = async () => ({ rows: [] });

  try {
    const response = await request(
      "PATCH",
      "/api/notifications/999/read",
      undefined,
      clientToken
    );

    assert.equal(response.status, 404);
  } finally {
    pool.query = originalQuery;
  }
});

test("PATCH notification : marquée comme lue", async () => {
  const originalQuery = pool.query;

  pool.query = async (sql, params) => {
    assert.match(sql, /UPDATE notifications/);
    assert.deepEqual(params, ["5", 1]);

    return {
      rows: [{
        id: 5,
        client_id: 1,
        message: "Test",
        lu: true,
      }],
    };
  };

  try {
    const response = await request(
      "PATCH",
      "/api/notifications/5/read",
      undefined,
      clientToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.notification.lu, true);
  } finally {
    pool.query = originalQuery;
  }
});