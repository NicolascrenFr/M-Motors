const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET est absent du fichier .env");
}

/**
 * Génère un JWT à partir du client.
 */
function createToken(client) {
  return jwt.sign(
    {
      id: client.id,
      email: client.email,
    },
    JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );
}

/**
 * Middleware d'authentification.
 */
function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentification requise.",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Session invalide ou expirée.",
    });
  }
}

/**
 * US03 / US01
 * Création d'un compte.
 */
router.post("/register", async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingClient = await pool.query(
      "SELECT id FROM clients WHERE email = $1",
      [normalizedEmail]
    );

    if (existingClient.rows.length > 0) {
      return res.status(409).json({
        message: "Cette adresse e-mail est déjà utilisée.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
        INSERT INTO clients (nom, prenom, email, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nom, prenom, email, created_at
      `,
      [
        nom.trim(),
        prenom.trim(),
        normalizedEmail,
        passwordHash,
      ]
    );

    const client = result.rows[0];

    const token = createToken(client);

    return res.status(201).json({
      message: "Compte créé avec succès.",
      token,
      client,
    });
  } catch (error) {
    console.error("Erreur inscription :", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Cette adresse e-mail est déjà utilisée.",
      });
    }

    return res.status(500).json({
      message: "Erreur serveur lors de la création du compte.",
    });
  }
});

/**
 * US02 / US04
 * Connexion.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "L'e-mail et le mot de passe sont obligatoires.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
        SELECT
          id,
          nom,
          prenom,
          email,
          password_hash,
          created_at
        FROM clients
        WHERE email = $1
      `,
      [normalizedEmail]
    );

    const client = result.rows[0];

    if (!client || !client.password_hash) {
      return res.status(401).json({
        message: "E-mail ou mot de passe incorrect.",
      });
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      client.password_hash
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        message: "E-mail ou mot de passe incorrect.",
      });
    }

    const token = createToken(client);

    delete client.password_hash;

    return res.json({
      message: "Connexion réussie.",
      token,
      client,
    });
  } catch (error) {
    console.error("Erreur connexion :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la connexion.",
    });
  }
});

/**
 * US04
 * Récupération de l'utilisateur connecté.
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, nom, prenom, email, created_at
        FROM clients
        WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Client introuvable.",
      });
    }

    return res.json({
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur récupération profil :", error);

    return res.status(500).json({
      message: "Erreur serveur.",
    });
  }
});

/**
 * US05
 * Modification du profil.
 */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { nom, prenom, email } = req.body;

    if (!nom || !prenom || !email) {
      return res.status(400).json({
        message: "Le nom, le prénom et l'e-mail sont obligatoires.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmail = await pool.query(
      `
        SELECT id
        FROM clients
        WHERE email = $1
        AND id <> $2
      `,
      [normalizedEmail, req.user.id]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        message: "Cette adresse e-mail est déjà utilisée.",
      });
    }

    const result = await pool.query(
      `
        UPDATE clients
        SET nom = $1,
            prenom = $2,
            email = $3
        WHERE id = $4
        RETURNING id, nom, prenom, email, created_at
      `,
      [
        nom.trim(),
        prenom.trim(),
        normalizedEmail,
        req.user.id,
      ]
    );

    return res.json({
      message: "Profil modifié avec succès.",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur modification profil :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la modification du profil.",
    });
  }
});

/**
 * US06
 * Demande de réinitialisation du mot de passe.
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "L'e-mail est obligatoire.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      "SELECT id FROM clients WHERE email = $1",
      [normalizedEmail]
    );

    /*
     * Réponse volontairement générique afin de ne pas
     * révéler si l'adresse existe dans la base.
     */
    if (result.rows.length === 0) {
      return res.json({
        message:
          "Si cette adresse existe, une procédure de réinitialisation a été préparée.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await pool.query(
      `
        UPDATE clients
        SET reset_token_hash = $1,
            reset_token_expires_at = $2
        WHERE id = $3
      `,
      [
        resetTokenHash,
        expiresAt,
        result.rows[0].id,
      ]
    );

    const response = {
      message:
        "Si cette adresse existe, une procédure de réinitialisation a été préparée.",
    };

    /*
     * Pour les tests locaux uniquement.
     *
     * Dans le .env :
     * RETURN_RESET_TOKEN=true
     *
     * Il faudra désactiver cette option pour une vraie
     * mise en production avec envoi d'e-mail.
     */
    if (process.env.RETURN_RESET_TOKEN === "true") {
      response.resetToken = resetToken;
    }

    return res.json(response);
  } catch (error) {
    console.error("Erreur mot de passe oublié :", error);

    return res.status(500).json({
      message: "Erreur serveur.",
    });
  }
});

/**
 * US06
 * Réinitialisation effective du mot de passe.
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Le token et le nouveau mot de passe sont obligatoires.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const result = await pool.query(
      `
        SELECT id
        FROM clients
        WHERE reset_token_hash = $1
        AND reset_token_expires_at > NOW()
      `,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Le lien de réinitialisation est invalide ou expiré.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `
        UPDATE clients
        SET password_hash = $1,
            reset_token_hash = NULL,
            reset_token_expires_at = NULL
        WHERE id = $2
      `,
      [
        passwordHash,
        result.rows[0].id,
      ]
    );

    return res.json({
      message: "Mot de passe réinitialisé avec succès.",
    });
  } catch (error) {
    console.error("Erreur réinitialisation :", error);

    return res.status(500).json({
      message: "Erreur serveur.",
    });
  }
});

module.exports = router;










