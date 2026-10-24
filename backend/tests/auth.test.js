const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const {
  authenticateToken,
  requireAdmin,
} = require("../auth");

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

test("JWT : accès refusé sans token", () => {
  const req = { headers: {} };
  const res = mockResponse();
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Authentification requise.");
  assert.equal(nextCalled, false);
});

test("JWT : accès refusé avec un token invalide", () => {
  const req = {
    headers: {
      authorization: "Bearer token-invalide",
    },
  };

  const res = mockResponse();
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Session invalide ou expirée.");
  assert.equal(nextCalled, false);
});

test("JWT : accès autorisé avec un token valide", () => {
  const token = jwt.sign(
    {
      id: 1,
      email: "client@example.com",
      role: "client",
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  const res = mockResponse();
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 1);
  assert.equal(req.user.role, "client");
});

test("Admin : accès refusé sans utilisateur authentifié", () => {
  const req = {};
  const res = mockResponse();
  let nextCalled = false;

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Admin : accès refusé à un simple client", () => {
  const req = {
    user: { id: 1, role: "client" },
  };

  const res = mockResponse();
  let nextCalled = false;

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Accès réservé aux administrateurs.");
  assert.equal(nextCalled, false);
});

test("Admin : accès autorisé à un administrateur", () => {
  const req = {
    user: { id: 2, role: "admin" },
  };

  const res = mockResponse();
  let nextCalled = false;

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});