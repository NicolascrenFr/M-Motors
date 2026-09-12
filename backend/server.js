const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { encrypt } = require("./crypto");
const multer = require("multer");

const pool = require("./db");

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const typesAutorises = [
      "application/pdf",
      "image/jpeg",
    ];

    if (typesAutorises.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Type de fichier non autorisé. PDF et JPEG uniquement.")
      );
    }
  },
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API M-Motors opérationnelle",
  });
});

app.post("/api/clients", async (req, res) => {
  const { nom, prenom, email } = req.body;

  if (!nom || !prenom || !email) {
    return res.status(400).json({
      message: "Les champs nom, prénom et email sont obligatoires.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clients (nom, prenom, email)
       VALUES ($1, $2, $3)
       RETURNING id, nom, prenom, email, created_at`,
      [nom, prenom, email]
    );

    res.status(201).json({
      message: "Client enregistré avec succès.",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du client :", error);

    res.status(500).json({
      message: "Impossible d'enregistrer le client.",
    });
  }
});

app.post("/api/documents", (req, res) => {
  upload.single("document")(req, res, async (error) => {
    if (error) {
      console.error("Erreur lors de l'upload :", error.message);

      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Fichier trop volumineux : la taille maximale est de 5 Mo.",
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    const { client_id, type_document } = req.body;

    if (!client_id || !type_document || !req.file) {
      return res.status(400).json({
        message:
          "client_id, type_document et document sont obligatoires.",
      });
    }

    try {
      const { encrypted, iv, authTag } = encrypt(req.file.buffer);

      const result = await pool.query(
        `INSERT INTO documents
         (client_id, nom_fichier, type_document, contenu_chiffre, iv, auth_tag)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, client_id, nom_fichier, type_document, created_at`,
        [
          client_id,
          req.file.originalname,
          type_document,
          encrypted,
          iv,
          authTag,
        ]
      );

      res.status(201).json({
        message: "Document chiffré et enregistré avec succès.",
        document: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement du document :",
        error
      );

      res.status(500).json({
        message: "Impossible d'enregistrer le document.",
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
