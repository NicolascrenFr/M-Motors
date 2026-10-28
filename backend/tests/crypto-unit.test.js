
const test = require("node:test");
const assert = require("node:assert/strict");

const { encrypt, decrypt } = require("../crypto");

test("CRYPTO : chiffrement et déchiffrement réussis", () => {
  const original = Buffer.from("Document confidentiel M-Motors");

  const result = encrypt(original);
  const decrypted = decrypt(
    result.encrypted,
    result.iv,
    result.authTag
  );

  assert.deepEqual(decrypted, original);
});

test("CRYPTO : refuse un contenu qui n'est pas un Buffer", () => {
  assert.throws(
    () => encrypt("Document non valide"),
    /doit être un Buffer/
  );
});

test("CRYPTO : deux chiffrements produisent des IV différents", () => {
  const original = Buffer.from("Document confidentiel");

  const first = encrypt(original);
  const second = encrypt(original);

  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.encrypted, second.encrypted);
});

test("CRYPTO : refuse un document chiffré modifié", () => {
  const result = encrypt(Buffer.from("Document original"));

  const modified = Buffer.from(result.encrypted, "base64");
  modified[0] ^= 1;

  assert.throws(() =>
    decrypt(
      modified.toString("base64"),
      result.iv,
      result.authTag
    )
  );
});

test("CRYPTO : refuse un tag d'authentification incorrect", () => {
  const result = encrypt(Buffer.from("Document original"));

  const modifiedTag = Buffer.from(result.authTag, "base64");
  modifiedTag[0] ^= 1;

  assert.throws(() =>
    decrypt(
      result.encrypted,
      result.iv,
      modifiedTag.toString("base64")
    )
  );
});

