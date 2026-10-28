
const test = require("node:test");
const assert = require("node:assert/strict");

const authRouter = require("../auth");
const pool = require("../db");

const registerHandler = authRouter.stack.find(
  (layer) =>
    layer.route?.path === "/register" &&
    layer.route.methods.post
).route.stack[0].handle;

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

const validClient = {
  nom: "Dupont",
  prenom: "Jean",
  email: "jean@example.com",
  password: "MotDePasse123",
};

test("UNIT register : champs obligatoires", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => {
      throw new Error("La base ne doit pas être appelée");
    };

    const res = mockResponse();
    await registerHandler({ body: {} }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.message,
      "Tous les champs sont obligatoires."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT register : mot de passe trop court", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => {
      throw new Error("La base ne doit pas être appelée");
    };

    const res = mockResponse();

    await registerHandler({
      body: { ...validClient, password: "1234567" },
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.message,
      "Le mot de passe doit contenir au moins 8 caractères."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT register : adresse e-mail déjà utilisée", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /SELECT id FROM clients/);
      assert.deepEqual(params, ["jean@example.com"]);

      return { rows: [{ id: 1 }] };
    };

    const res = mockResponse();

    await registerHandler({ body: validClient }, res);

    assert.equal(res.statusCode, 409);
    assert.equal(
      res.body.message,
      "Cette adresse e-mail est déjà utilisée."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT register : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await registerHandler({ body: validClient }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Erreur serveur lors de la création du compte."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


test("UNIT register : création réussie et JWT valide", async () => {
  const originalQuery = pool.query;
  const jwt = require("jsonwebtoken");
  let calls = 0;

  try {
    pool.query = async (sql, params) => {
      calls++;

      if (calls === 1) {
        assert.match(sql, /SELECT id FROM clients/);
        assert.deepEqual(params, ["jean@example.com"]);
        return { rows: [] };
      }

      assert.match(sql, /INSERT INTO clients/);
      assert.deepEqual(params.slice(0, 3), [
        "Dupont",
        "Jean",
        "jean@example.com",
      ]);

      // Vérifie que le mot de passe est haché.
      const bcrypt = require("bcryptjs");
      assert.equal(
        await bcrypt.compare(validClient.password, params[3]),
        true
      );

      return {
        rows: [{
          id: 10,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
          role: "client",
        }],
      };
    };

    const res = mockResponse();

    await registerHandler({
      body: {
        ...validClient,
        nom: " Dupont ",
        prenom: " Jean ",
        email: " JEAN@EXAMPLE.COM ",
      },
    }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.client.id, 10);
    assert.equal(res.body.message, "Compte créé avec succès.");

    const decoded = jwt.verify(
      res.body.token,
      process.env.JWT_SECRET
    );

    assert.equal(decoded.id, 10);
    assert.equal(decoded.email, "jean@example.com");
    assert.equal(decoded.role, "client");
    assert.equal(decoded.exp - decoded.iat, 7200);
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT register : contrainte SQL 23505", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    let calls = 0;

    pool.query = async () => {
      calls++;

      if (calls === 1) {
        return { rows: [] };
      }

      const error = new Error("E-mail déjà utilisé");
      error.code = "23505";
      throw error;
    };

    console.error = () => {};

    const res = mockResponse();
    await registerHandler({ body: validClient }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 409);
    assert.equal(
      res.body.message,
      "Cette adresse e-mail est déjà utilisée."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


const loginHandler = authRouter.stack.find(
  (layer) =>
    layer.route?.path === "/login" &&
    layer.route.methods.post
).route.stack[0].handle;

test("UNIT login : champs obligatoires", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => {
      throw new Error("La base ne doit pas être appelée");
    };

    const res = mockResponse();
    await loginHandler({ body: {} }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.message,
      "L'e-mail et le mot de passe sont obligatoires."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT login : e-mail inconnu", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /FROM clients/);
      assert.deepEqual(params, ["jean@example.com"]);
      return { rows: [] };
    };

    const res = mockResponse();

    await loginHandler({
      body: {
        email: " JEAN@EXAMPLE.COM ",
        password: "MotDePasse123",
      },
    }, res);

    assert.equal(res.statusCode, 401);
    assert.equal(
      res.body.message,
      "E-mail ou mot de passe incorrect."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT login : compte sans mot de passe", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({
      rows: [{ id: 2, email: "jean@example.com" }],
    });

    const res = mockResponse();

    await loginHandler({
      body: validClient,
    }, res);

    assert.equal(res.statusCode, 401);
    assert.equal(
      res.body.message,
      "E-mail ou mot de passe incorrect."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT login : mot de passe incorrect", async () => {
  const originalQuery = pool.query;
  const bcrypt = require("bcryptjs");

  try {
    const passwordHash = await bcrypt.hash("BonMotDePasse123", 4);

    pool.query = async () => ({
      rows: [{
        id: 2,
        email: "jean@example.com",
        role: "client",
        password_hash: passwordHash,
      }],
    });

    const res = mockResponse();

    await loginHandler({
      body: {
        email: "jean@example.com",
        password: "MauvaisMotDePasse",
      },
    }, res);

    assert.equal(res.statusCode, 401);
    assert.equal(
      res.body.message,
      "E-mail ou mot de passe incorrect."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT login : connexion réussie et JWT valide", async () => {
  const originalQuery = pool.query;
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");

  try {
    const passwordHash = await bcrypt.hash("MotDePasse123", 4);

    pool.query = async (sql, params) => {
      assert.match(sql, /FROM clients/);
      assert.deepEqual(params, ["jean@example.com"]);

      return {
        rows: [{
          id: 2,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
          role: "client",
          password_hash: passwordHash,
        }],
      };
    };

    const res = mockResponse();

    await loginHandler({
      body: {
        email: " JEAN@EXAMPLE.COM ",
        password: "MotDePasse123",
      },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, "Connexion réussie.");
    assert.equal(res.body.client.id, 2);
    assert.equal(
      Object.hasOwnProperty.call(res.body.client, "password_hash"),
      false
    );

    const decoded = jwt.verify(
      res.body.token,
      process.env.JWT_SECRET
    );

    assert.equal(decoded.id, 2);
    assert.equal(decoded.role, "client");
    assert.equal(decoded.exp - decoded.iat, 7200);
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT login : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await loginHandler({
      body: validClient,
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Erreur serveur lors de la connexion."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


const meHandler = authRouter.stack.find(
  (layer) =>
    layer.route?.path === "/me" &&
    layer.route.methods.get
).route.stack[1].handle;

const profileHandler = authRouter.stack.find(
  (layer) =>
    layer.route?.path === "/profile" &&
    layer.route.methods.put
).route.stack[1].handle;

// GET /me

test("UNIT GET me : profil récupéré", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /FROM clients/);
      assert.deepEqual(params, [2]);

      return {
        rows: [{
          id: 2,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
        }],
      };
    };

    const res = mockResponse();

    await meHandler({ user: { id: 2 } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.client.id, 2);
    assert.equal(res.body.client.nom, "Dupont");
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT GET me : client introuvable", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => ({ rows: [] });

    const res = mockResponse();

    await meHandler({ user: { id: 999 } }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Client introuvable.");
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT GET me : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await meHandler({ user: { id: 2 } }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Erreur serveur.");
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

// PUT /profile

test("UNIT PUT profile : champs obligatoires", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async () => {
      throw new Error("La base ne doit pas être appelée");
    };

    const res = mockResponse();

    await profileHandler({
      user: { id: 2 },
      body: {},
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.message,
      "Le nom, le prénom et l'e-mail sont obligatoires."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT PUT profile : e-mail déjà utilisé", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /FROM clients/);
      assert.deepEqual(params, ["jean@example.com", 2]);

      return { rows: [{ id: 3 }] };
    };

    const res = mockResponse();

    await profileHandler({
      user: { id: 2 },
      body: validClient,
    }, res);

    assert.equal(res.statusCode, 409);
    assert.equal(
      res.body.message,
      "Cette adresse e-mail est déjà utilisée."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT PUT profile : modification réussie", async () => {
  const originalQuery = pool.query;
  let calls = 0;

  try {
    pool.query = async (sql, params) => {
      calls++;

      if (calls === 1) {
        assert.match(sql, /FROM clients/);
        assert.deepEqual(params, ["jean@example.com", 2]);
        return { rows: [] };
      }

      assert.match(sql, /UPDATE clients/);
      assert.deepEqual(params, [
        "Dupont",
        "Jean",
        "jean@example.com",
        2,
      ]);

      return {
        rows: [{
          id: 2,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
        }],
      };
    };

    const res = mockResponse();

    await profileHandler({
      user: { id: 2 },
      body: {
        nom: " Dupont ",
        prenom: " Jean ",
        email: " JEAN@EXAMPLE.COM ",
      },
    }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.client.id, 2);
    assert.equal(
      res.body.message,
      "Profil modifié avec succès."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT PUT profile : erreur SQL lors de la vérification", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await profileHandler({
      user: { id: 2 },
      body: validClient,
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Erreur serveur lors de la modification du profil."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

test("UNIT PUT profile : erreur SQL lors de la modification", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;
  let calls = 0;

  try {
    pool.query = async () => {
      calls++;

      if (calls === 1) {
        return { rows: [] };
      }

      throw new Error("Erreur UPDATE simulée");
    };

    console.error = () => {};

    const res = mockResponse();

    await profileHandler({
      user: { id: 2 },
      body: validClient,
    }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 500);
    assert.equal(
      res.body.message,
      "Erreur serveur lors de la modification du profil."
    );
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});


const crypto = require("node:crypto");

const forgotHandler = authRouter.stack.find(
  (layer) =>
    layer.route?.path === "/forgot-password" &&
    layer.route.methods.post
).route.stack[0].handle;

const resetHandler = authRouter.stack.find(
  (layer) =>
    layer.route?.path === "/reset-password" &&
    layer.route.methods.post
).route.stack[0].handle;

const genericResetMessage =
  "Si cette adresse existe, une procédure de réinitialisation a été préparée.";

// POST /forgot-password

test("UNIT forgot-password : e-mail obligatoire", async () => {
  const res = mockResponse();

  await forgotHandler({ body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "L'e-mail est obligatoire.");
});

test("UNIT forgot-password : adresse inconnue", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /SELECT id FROM clients/);
      assert.deepEqual(params, ["inconnu@example.com"]);
      return { rows: [] };
    };

    const res = mockResponse();

    await forgotHandler({
      body: { email: " INCONNU@EXAMPLE.COM " },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, genericResetMessage);
    assert.equal(res.body.resetToken, undefined);
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT forgot-password : token généré et haché", async () => {
  const originalQuery = pool.query;
  const originalFlag = process.env.RETURN_RESET_TOKEN;
  let calls = 0;

  try {
    process.env.RETURN_RESET_TOKEN = "true";

    pool.query = async (sql, params) => {
      calls++;

      if (calls === 1) {
        assert.deepEqual(params, ["jean@example.com"]);
        return { rows: [{ id: 2 }] };
      }

      assert.match(sql, /UPDATE clients/);
      assert.match(params[0], /^[a-f0-9]{64}$/);
      assert.ok(params[1] instanceof Date);
      assert.equal(params[2], 2);

      return { rowCount: 1 };
    };

    const res = mockResponse();

    await forgotHandler({
      body: { email: " JEAN@EXAMPLE.COM " },
    }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, genericResetMessage);
    assert.match(res.body.resetToken, /^[a-f0-9]{64}$/);
  } finally {
    pool.query = originalQuery;

    if (originalFlag === undefined) {
      delete process.env.RETURN_RESET_TOKEN;
    } else {
      process.env.RETURN_RESET_TOKEN = originalFlag;
    }
  }
});

test("UNIT forgot-password : erreur SQL", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await forgotHandler({
      body: { email: "jean@example.com" },
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Erreur serveur.");
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

// POST /reset-password

test("UNIT reset-password : champs obligatoires", async () => {
  const res = mockResponse();

  await resetHandler({ body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(
    res.body.message,
    "Le token et le nouveau mot de passe sont obligatoires."
  );
});

test("UNIT reset-password : mot de passe trop court", async () => {
  const res = mockResponse();

  await resetHandler({
    body: { token: "token-test", password: "1234567" },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(
    res.body.message,
    "Le mot de passe doit contenir au moins 8 caractères."
  );
});

test("UNIT reset-password : token invalide ou expiré", async () => {
  const originalQuery = pool.query;

  try {
    pool.query = async (sql, params) => {
      assert.match(sql, /reset_token_expires_at > NOW\(\)/);

      const expectedHash = crypto
        .createHash("sha256")
        .update("token-invalide")
        .digest("hex");

      assert.deepEqual(params, [expectedHash]);

      return { rows: [] };
    };

    const res = mockResponse();

    await resetHandler({
      body: {
        token: "token-invalide",
        password: "NouveauMotDePasse123",
      },
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.message,
      "Le lien de réinitialisation est invalide ou expiré."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT reset-password : réinitialisation réussie", async () => {
  const originalQuery = pool.query;
  const bcrypt = require("bcryptjs");
  let calls = 0;

  try {
    pool.query = async (sql, params) => {
      calls++;

      if (calls === 1) {
        assert.match(sql, /SELECT id/);
        return { rows: [{ id: 2 }] };
      }

      assert.match(sql, /UPDATE clients/);
      assert.match(sql, /reset_token_hash = NULL/);
      assert.equal(params[1], 2);

      assert.equal(
        await bcrypt.compare("NouveauMotDePasse123", params[0]),
        true
      );

      return { rowCount: 1 };
    };

    const res = mockResponse();

    await resetHandler({
      body: {
        token: "token-valide",
        password: "NouveauMotDePasse123",
      },
    }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 200);
    assert.equal(
      res.body.message,
      "Mot de passe réinitialisé avec succès."
    );
  } finally {
    pool.query = originalQuery;
  }
});

test("UNIT reset-password : erreur SQL sur le token", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;

  try {
    pool.query = async () => {
      throw new Error("Erreur SQL simulée");
    };
    console.error = () => {};

    const res = mockResponse();

    await resetHandler({
      body: {
        token: "token-test",
        password: "NouveauMotDePasse123",
      },
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Erreur serveur.");
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});

test("UNIT reset-password : erreur SQL sur la mise à jour", async () => {
  const originalQuery = pool.query;
  const originalError = console.error;
  let calls = 0;

  try {
    pool.query = async () => {
      calls++;

      if (calls === 1) {
        return { rows: [{ id: 2 }] };
      }

      throw new Error("Erreur UPDATE simulée");
    };

    console.error = () => {};

    const res = mockResponse();

    await resetHandler({
      body: {
        token: "token-test",
        password: "NouveauMotDePasse123",
      },
    }, res);

    assert.equal(calls, 2);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Erreur serveur.");
  } finally {
    pool.query = originalQuery;
    console.error = originalError;
  }
});