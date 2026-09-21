const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { encrypt } = require("./crypto");
const multer = require("multer");
const pool = require("./db");
const authRoutes = require("./auth");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const typesAutorises = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (typesAutorises.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Type de fichier non autorisé. PDF, JPG et PNG uniquement.")
      );
    }
  },
});

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

app.post("/api/dossiers", async (req, res) => {
  const {
    client_id,
    vehicule,
    type_financement,
    duree,
  } = req.body;

  if (!client_id || !vehicule || !type_financement || !duree) {
    return res.status(400).json({
      message:
        "client_id, vehicule, type_financement et duree sont obligatoires.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO dossiers
       (client_id, vehicule, type_financement, duree)
       VALUES ($1, $2, $3, $4)
       RETURNING id, client_id, vehicule, type_financement, duree, statut, created_at`,
      [
        client_id,
        vehicule,
        type_financement,
        duree,
      ]
    );

    res.status(201).json({
      message: "Dossier de financement créé avec succès.",
      dossier: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création du dossier :",
      error
    );

    res.status(500).json({
      message: "Impossible de créer le dossier de financement.",
    });
  }
});

app.get("/api/documents/:client_id", async (req, res) => {
  const { client_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, nom_fichier, type_document, created_at
       FROM documents
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [client_id]
    );

    res.status(200).json({
      documents: result.rows,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des documents :",
      error
    );

    res.status(500).json({
      message: "Impossible de récupérer les documents.",
    });
  }
});

app.get("/api/clients/:client_id", async (req, res) => {
  const { client_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, nom, prenom, email, created_at
       FROM clients
       WHERE id = $1`,
      [client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Client introuvable.",
      });
    }

    res.status(200).json({
      client: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du client :",
      error
    );

    res.status(500).json({
      message: "Impossible de récupérer les informations du client.",
    });
  }
});

app.get("/api/dossiers/client/:client_id", async (req, res) => {
  const { client_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, client_id, vehicule, type_financement, duree, statut, created_at
       FROM dossiers
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [client_id]
    );

    res.status(200).json({
      dossier: result.rows[0] || null,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du dossier :",
      error
    );

    res.status(500).json({
      message: "Impossible de récupérer le dossier.",
    });
  }
});

app.get("/api/dossiers", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         dossiers.id,
         dossiers.client_id,
         clients.nom,
         clients.prenom,
         clients.email,
         dossiers.vehicule,
         dossiers.type_financement,
         dossiers.duree,
         dossiers.statut,
         dossiers.created_at
       FROM dossiers
       INNER JOIN clients
         ON dossiers.client_id = clients.id
       ORDER BY dossiers.created_at DESC`
    );

    res.status(200).json({
      dossiers: result.rows,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des dossiers :",
      error
    );

    res.status(500).json({
      message: "Impossible de récupérer les dossiers clients.",
    });
  }
});

app.put("/api/dossiers/:id/statut", async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  const statutsAutorises = [
    "Dossier validé",
    "Dossier refusé",
  ];

  if (!statutsAutorises.includes(statut)) {
    return res.status(400).json({
      message: "Statut invalide.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE dossiers
       SET statut = $1
       WHERE id = $2
       RETURNING id, client_id, vehicule, type_financement, duree, statut, created_at`,
      [statut, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Dossier introuvable.",
      });
    }

    res.status(200).json({
      message: "Statut du dossier mis à jour.",
      dossier: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du statut :",
      error
    );

    res.status(500).json({
      message: "Impossible de mettre à jour le statut du dossier.",
    });
  }
});

app.get("/api/vehicles", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         brand,
         model,
         year,
         fuel,
         transmission,
         price,
         monthly_price,
         type,
         image
       FROM vehicles
       ORDER BY id`
    );

    res.status(200).json({
      vehicles: result.rows,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des véhicules :",
      error
    );

    res.status(500).json({
      message: "Impossible de récupérer les véhicules.",
    });
  }
});

app.post("/api/vehicles", async (req, res) => {
  const {
    brand,
    model,
    year,
    fuel,
    transmission,
    price,
    monthlyPrice,
    type,
    image,
  } = req.body;

  if (
    !brand ||
    !model ||
    !year ||
    !fuel ||
    !transmission ||
    price === undefined ||
    monthlyPrice === undefined ||
    !type
  ) {
    return res.status(400).json({
      message: "Tous les champs du véhicule sont obligatoires.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO vehicles
       (
         brand,
         model,
         year,
         fuel,
         transmission,
         price,
         monthly_price,
         type,
         image
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING
         id,
         brand,
         model,
         year,
         fuel,
         transmission,
         price,
         monthly_price,
         type,
         image`,
      [
        brand,
        model,
        Number(year),
        fuel,
        transmission,
        Number(price),
        Number(monthlyPrice),
        type,
        image || "",
      ]
    );

    res.status(201).json({
      message: "Véhicule ajouté avec succès.",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout du véhicule :",
      error
    );

    res.status(500).json({
      message: "Impossible d'ajouter le véhicule.",
    });
  }
});

app.put("/api/vehicles/:id", async (req, res) => {
  const { id } = req.params;

  const {
    brand,
    model,
    year,
    fuel,
    transmission,
    price,
    monthlyPrice,
    type,
    image,
  } = req.body;

  if (
    !brand ||
    !model ||
    !year ||
    !fuel ||
    !transmission ||
    price === undefined ||
    monthlyPrice === undefined ||
    !type
  ) {
    return res.status(400).json({
      message: "Tous les champs du véhicule sont obligatoires.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE vehicles
       SET
         brand = $1,
         model = $2,
         year = $3,
         fuel = $4,
         transmission = $5,
         price = $6,
         monthly_price = $7,
         type = $8,
         image = $9
       WHERE id = $10
       RETURNING
         id,
         brand,
         model,
         year,
         fuel,
         transmission,
         price,
         monthly_price,
         type,
         image`,
      [
        brand,
        model,
        Number(year),
        fuel,
        transmission,
        Number(price),
        Number(monthlyPrice),
        type,
        image || "",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Véhicule introuvable.",
      });
    }

    res.status(200).json({
      message: "Véhicule modifié avec succès.",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erreur lors de la modification du véhicule :",
      error
    );

    res.status(500).json({
      message: "Impossible de modifier le véhicule.",
    });
  }
});

app.delete("/api/vehicles/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM vehicles
       WHERE id = $1
       RETURNING id, brand, model`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Véhicule introuvable.",
      });
    }

    res.status(200).json({
      message: "Véhicule supprimé avec succès.",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression du véhicule :",
      error
    );

    res.status(500).json({
      message: "Impossible de supprimer le véhicule.",
    });
  }
});

app.post("/api/notifications", async (req, res) => {
  const {
    dossier_id,
    client_id,
    message,
  } = req.body;

  if (!dossier_id || !client_id || !message) {
    return res.status(400).json({
      message:
        "dossier_id, client_id et message sont obligatoires.",
    });
  }

  try {
    const dossierResult = await pool.query(
      `SELECT id, client_id, statut
       FROM dossiers
       WHERE id = $1`,
      [dossier_id]
    );

    if (dossierResult.rows.length === 0) {
      return res.status(404).json({
        message: "Dossier introuvable.",
      });
    }

    const dossier = dossierResult.rows[0];

    if (Number(dossier.client_id) !== Number(client_id)) {
      return res.status(400).json({
        message:
          "Le dossier ne correspond pas au client indiqué.",
      });
    }

    const result = await pool.query(
      `INSERT INTO notifications
       (dossier_id, client_id, message)
       VALUES ($1, $2, $3)
       RETURNING
         id,
         dossier_id,
         client_id,
         message,
         lu,
         created_at`,
      [dossier_id, client_id, message]
    );

    res.status(201).json({
      message: "Notification envoyée avec succès.",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la notification :",
      error
    );

    res.status(500).json({
      message: "Impossible de créer la notification.",
    });
  }
});

app.get("/api/notifications/client/:client_id", async (req, res) => {
  const { client_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         notifications.id,
         notifications.dossier_id,
         notifications.client_id,
         notifications.message,
         notifications.lu,
         notifications.created_at,
         dossiers.vehicule,
         dossiers.statut
       FROM notifications
       INNER JOIN dossiers
         ON notifications.dossier_id = dossiers.id
       WHERE notifications.client_id = $1
       ORDER BY notifications.created_at DESC`,
      [client_id]
    );

    res.status(200).json({
      notifications: result.rows,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des notifications :",
      error
    );

    res.status(500).json({
      message: "Impossible de récupérer les notifications.",
    });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE notifications
       SET lu = TRUE
       WHERE id = $1
       RETURNING
         id,
         dossier_id,
         client_id,
         message,
         lu,
         created_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Notification introuvable.",
      });
    }

    res.status(200).json({
      message: "Notification marquée comme lue.",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la notification :",
      error
    );

    res.status(500).json({
      message: "Impossible de mettre à jour la notification.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
