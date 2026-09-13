const crypto = require("crypto");
require("dotenv").config();

const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.DOCUMENT_ENCRYPTION_KEY, "hex");

if (key.length !== 32) {
  throw new Error(
    "DOCUMENT_ENCRYPTION_KEY doit contenir exactement 32 octets."
  );
}

function encrypt(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Le contenu à chiffrer doit être un Buffer.");
  }

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

function decrypt(encrypted, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);
}

module.exports = {
  encrypt,
  decrypt,
};