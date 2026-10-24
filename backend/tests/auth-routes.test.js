const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const pool = require("../db");
const app = require("../server");

async function request(path, body) {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}${path}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          connection: "close",
        },
        body: JSON.stringify(body),
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

// INSCRIPTION

test("REGISTER : champs obligatoires", async () => {
  const response = await request("/api/auth/register", {});
  assert.equal(response.status, 400);
});

test("REGISTER : mot de passe trop court", async () => {
  const response = await request("/api/auth/register", {
    nom: "Test",
    prenom: "Client",
    email: "test@example.com",
    password: "123",
  });

  assert.equal(response.status, 400);
});

test("REGISTER : adresse e-mail déjà utilisée", async () => {
  await withMockQuery(
    async () => ({ rows: [{ id: 1 }] }),
    async () => {
      const response = await request("/api/auth/register", {
        nom: "Test",
        prenom: "Client",
        email: "test@example.com",
        password: "password123",
      });

      assert.equal(response.status, 409);
    }
  );
});

test("REGISTER : création réussie", async () => {
  let calls = 0;

  await withMockQuery(async (sql, params) => {
    calls++;

    if (calls === 1) {
      assert.deepEqual(params, ["test@example.com"]);
      return { rows: [] };
    }

    assert.match(sql, /INSERT INTO clients/);
    assert.equal(params[0], "Test");
    assert.equal(params[1], "Client");
    assert.equal(params[2], "test@example.com");
    assert.equal(await bcrypt.compare("password123", params[3]), true);

    return {
      rows: [{
        id: 10,
        nom: "Test",
        prenom: "Client",
        email: "test@example.com",
        role: "client",
      }],
    };
  }, async () => {
    const response = await request("/api/auth/register", {
      nom: " Test ",
      prenom: " Client ",
      email: " TEST@EXAMPLE.COM ",
      password: "password123",
    });

    assert.equal(response.status, 201);
    assert.equal(response.data.client.id, 10);
    assert.equal(
      jwt.verify(response.data.token, process.env.JWT_SECRET).id,
      10
    );
    assert.equal(calls, 2);
  });
});

// CONNEXION

test("LOGIN : champs obligatoires", async () => {
  const response = await request("/api/auth/login", {});
  assert.equal(response.status, 400);
});

test("LOGIN : utilisateur introuvable", async () => {
  await withMockQuery(
    async () => ({ rows: [] }),
    async () => {
      const response = await request("/api/auth/login", {
        email: "inconnu@example.com",
        password: "password123",
      });

      assert.equal(response.status, 401);
    }
  );
});

test("LOGIN : mot de passe incorrect", async () => {
  const hash = await bcrypt.hash("bonmotdepasse", 4);

  await withMockQuery(
    async () => ({
      rows: [{
        id: 10,
        email: "test@example.com",
        password_hash: hash,
        role: "client",
      }],
    }),
    async () => {
      const response = await request("/api/auth/login", {
        email: "test@example.com",
        password: "mauvaismotdepasse",
      });

      assert.equal(response.status, 401);
    }
  );
});

test("LOGIN : connexion réussie", async () => {
  const hash = await bcrypt.hash("password123", 4);

  await withMockQuery(
    async () => ({
      rows: [{
        id: 10,
        nom: "Test",
        email: "test@example.com",
        password_hash: hash,
        role: "client",
      }],
    }),
    async () => {
      const response = await request("/api/auth/login", {
        email: "test@example.com",
        password: "password123",
      });

      assert.equal(response.status, 200);
      assert.ok(response.data.token);
      assert.equal(response.data.client.id, 10);
      assert.equal(
        Object.hasOwnProperty.call(
          response.data.client,
          "password_hash"
        ),
        false
      );
    }
  );
});

const clientToken = jwt.sign(
  { id: 1, role: "client" },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);

async function profileRequest(method, path, body, token) {
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

// CONSULTATION DU PROFIL

test("ME : refus sans token", async () => {
  const response = await profileRequest("GET", "/api/auth/me");
  assert.equal(response.status, 401);
});

test("ME : profil récupéré", async () => {
  await withMockQuery(async (sql, params) => {
    assert.match(sql, /FROM clients/);
    assert.deepEqual(params, [1]);

    return {
      rows: [{
        id: 1,
        nom: "Test",
        prenom: "Client",
        email: "test@example.com",
        role: "client",
      }],
    };
  }, async () => {
    const response = await profileRequest(
      "GET", "/api/auth/me", undefined, clientToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.client.id, 1);
  });
});

test("ME : client introuvable", async () => {
  await withMockQuery(async () => ({ rows: [] }), async () => {
    const response = await profileRequest(
      "GET", "/api/auth/me", undefined, clientToken
    );

    assert.equal(response.status, 404);
  });
});

// MODIFICATION DU PROFIL

test("PROFILE : refus sans token", async () => {
  const response = await profileRequest(
    "PUT",
    "/api/auth/profile",
    { nom: "Test", prenom: "Client", email: "test@example.com" }
  );

  assert.equal(response.status, 401);
});

test("PROFILE : champs obligatoires", async () => {
  const response = await profileRequest(
    "PUT", "/api/auth/profile", {}, clientToken
  );

  assert.equal(response.status, 400);
});

test("PROFILE : adresse e-mail déjà utilisée", async () => {
  await withMockQuery(async () => ({
    rows: [{ id: 99 }],
  }), async () => {
    const response = await profileRequest(
      "PUT",
      "/api/auth/profile",
      {
        nom: "Test",
        prenom: "Client",
        email: "existant@example.com",
      },
      clientToken
    );

    assert.equal(response.status, 409);
  });
});

test("PROFILE : modification réussie", async () => {
  let calls = 0;

  await withMockQuery(async (sql, params) => {
    calls++;

    if (calls === 1) {
      assert.deepEqual(params, ["test@example.com", 1]);
      return { rows: [] };
    }

    assert.match(sql, /UPDATE clients/);
    assert.deepEqual(params, [
      "Nouveau",
      "Prenom",
      "test@example.com",
      1,
    ]);

    return {
      rows: [{
        id: 1,
        nom: "Nouveau",
        prenom: "Prenom",
        email: "test@example.com",
      }],
    };
  }, async () => {
    const response = await profileRequest(
      "PUT",
      "/api/auth/profile",
      {
        nom: " Nouveau ",
        prenom: " Prenom ",
        email: " TEST@EXAMPLE.COM ",
      },
      clientToken
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.client.nom, "Nouveau");
    assert.equal(calls, 2);
  });
});

// MOT DE PASSE OUBLIÉ

test("FORGOT PASSWORD : email obligatoire", async () => {
  const response = await request("/api/auth/forgot-password", {});
  assert.equal(response.status, 400);
});

test("FORGOT PASSWORD : email inconnu", async () => {
  await withMockQuery(
    async () => ({ rows: [] }),
    async () => {
      const response = await request("/api/auth/forgot-password", {
        email: "inconnu@example.com",
      });

      assert.equal(response.status, 200);
      assert.match(response.data.message, /Si cette adresse existe/);
      assert.equal(response.data.resetToken, undefined);
    }
  );
});

test("FORGOT PASSWORD : email connu", async () => {
  let calls = 0;

  await withMockQuery(async (sql, params) => {
    calls++;

    if (calls === 1) {
      assert.deepEqual(params, ["test@example.com"]);
      return { rows: [{ id: 1 }] };
    }

    assert.match(sql, /UPDATE clients/);
    assert.equal(params[0].length, 64);
    assert.ok(params[1] instanceof Date);
    assert.equal(params[2], 1);

    return { rows: [] };
  }, async () => {
    const response = await request("/api/auth/forgot-password", {
      email: " TEST@EXAMPLE.COM ",
    });

    assert.equal(response.status, 200);
    assert.match(response.data.message, /Si cette adresse existe/);
    assert.equal(calls, 2);
  });
});

// RÉINITIALISATION DU MOT DE PASSE

test("RESET PASSWORD : champs obligatoires", async () => {
  const response = await request("/api/auth/reset-password", {});
  assert.equal(response.status, 400);
});

test("RESET PASSWORD : mot de passe trop court", async () => {
  const response = await request("/api/auth/reset-password", {
    token: "token-fictif",
    password: "123",
  });

  assert.equal(response.status, 400);
});

test("RESET PASSWORD : token invalide", async () => {
  await withMockQuery(
    async () => ({ rows: [] }),
    async () => {
      const response = await request("/api/auth/reset-password", {
        token: "token-invalide",
        password: "nouveaumotdepasse123",
      });

      assert.equal(response.status, 400);
      assert.match(response.data.message, /invalide ou expiré/);
    }
  );
});

test("RESET PASSWORD : réinitialisation réussie", async () => {
  let calls = 0;

  await withMockQuery(async (sql, params) => {
    calls++;

    if (calls === 1) {
      assert.match(sql, /reset_token_hash/);
      assert.equal(params[0].length, 64);

      return { rows: [{ id: 1 }] };
    }

    assert.match(sql, /UPDATE clients/);
    assert.equal(
      await bcrypt.compare("nouveaumotdepasse123", params[0]),
      true
    );
    assert.equal(params[1], 1);

    return { rows: [] };
  }, async () => {
    const response = await request("/api/auth/reset-password", {
      token: "token-fictif",
      password: "nouveaumotdepasse123",
    });

    assert.equal(response.status, 200);
    assert.equal(
      response.data.message,
      "Mot de passe réinitialisé avec succès."
    );
    assert.equal(calls, 2);
  });
});

test("RESET PASSWORD : erreur SQL simulée", async () => {
  const originalError = console.error;
  console.error = () => {};

  try {
    await withMockQuery(
      async () => {
        throw new Error("Erreur SQL simulée");
      },
      async () => {
        const response = await request("/api/auth/reset-password", {
          token: "token-fictif",
          password: "nouveaumotdepasse123",
        });

        assert.equal(response.status, 500);
      }
    );
  } finally {
    console.error = originalError;
  }
});