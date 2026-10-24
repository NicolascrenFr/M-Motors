const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const pool = require("../db");
const app = require("../server");
const { encrypt } = require("../crypto");

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

async function request(method, path, token) {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const headers = { connection: "close" };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `http://127.0.0.1:${server.address().port}${path}`,
      { method, headers }
    );

    const contentType = response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
      ? await response.json()
      : Buffer.from(await response.arrayBuffer());

    return {
      status: response.status,
      data,
      headers: response.headers,
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

// LISTE DES DOCUMENTS

test("GET documents : refus sans token", async () => {
  const response = await request("GET", "/api/documents/1");
  assert.equal(response.status, 401);
});

test("GET documents : refus pour un autre client", async () => {
  const response = await request(
    "GET", "/api/documents/99", clientToken
  );

  assert.equal(response.status, 403);
});

test("GET documents : liste du client", async () => {
  await withMockQuery(async (sql, params) => {
    assert.match(sql, /FROM documents/);
    assert.deepEqual(params, ["1"]);

    return {
      rows: [{
        id: 10,
        nom_fichier: "test.pdf",
        type_document: "justificatif",
      }],
    };
  }, async () => {
    const response = await request(
      "GET", "/api/documents/1", clientToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.documents.length, 1);
  });
});

test("GET documents : liste vide", async () => {
  await withMockQuery(async () => ({ rows: [] }), async () => {
    const response = await request(
      "GET", "/api/documents/1", clientToken
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.data.documents, []);
  });
});

test("GET documents : accès administrateur", async () => {
  await withMockQuery(async () => ({ rows: [] }), async () => {
    const response = await request(
      "GET", "/api/documents/1", adminToken
    );

    assert.equal(response.status, 200);
  });
});

// TÉLÉCHARGEMENT DES DOCUMENTS

test("DOWNLOAD document : refus sans token", async () => {
  const response = await request(
    "GET", "/api/documents/1/10/download"
  );

  assert.equal(response.status, 401);
});

test("DOWNLOAD document : refus pour un autre client", async () => {
  const response = await request(
    "GET", "/api/documents/99/10/download", clientToken
  );

  assert.equal(response.status, 403);
});

test("DOWNLOAD document : document introuvable", async () => {
  await withMockQuery(async () => ({ rows: [] }), async () => {
    const response = await request(
      "GET", "/api/documents/1/999/download", clientToken
    );

    assert.equal(response.status, 404);
  });
});

test("DOWNLOAD document : déchiffrement réussi", async () => {
  const contenuOriginal = Buffer.from("Document de test M-Motors");

  const { encrypted, iv, authTag } = encrypt(contenuOriginal);

  await withMockQuery(async (sql, params) => {
    assert.match(sql, /FROM documents/);
    assert.deepEqual(params, ["10", "1"]);

    return {
      rows: [{
        id: 10,
        client_id: 1,
        nom_fichier: "test.pdf",
        contenu_chiffre: encrypted,
        iv,
        auth_tag: authTag,
      }],
    };
  }, async () => {
    const response = await request(
      "GET", "/api/documents/1/10/download", clientToken
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.data, contenuOriginal);
    assert.match(
      response.headers.get("content-disposition"),
      /test\.pdf/
    );
  });
});

test("DOWNLOAD document : contenu chiffré invalide", async () => {
  const originalError = console.error;
  console.error = () => {};

  try {
    await withMockQuery(async () => ({
      rows: [{
        id: 10,
        client_id: 1,
        nom_fichier: "test.pdf",
        contenu_chiffre: Buffer.from("invalide"),
        iv: Buffer.alloc(12),
        auth_tag: Buffer.alloc(16),
      }],
    }), async () => {
      const response = await request(
        "GET", "/api/documents/1/10/download", clientToken
      );

      assert.equal(response.status, 500);
    });
  } finally {
    console.error = originalError;
  }
});

// UPLOAD DES DOCUMENTS

test("POST document : refus sans token", async () => {
  const response = await request("POST", "/api/documents");
  assert.equal(response.status, 401);
});

test("POST document : fichier manquant", async () => {
  const response = await request(
    "POST", "/api/documents", clientToken
  );

  assert.equal(response.status, 400);
});