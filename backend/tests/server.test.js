const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../server");

test("GET / retourne un statut 200 et le message attendu", async () => {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const port = server.address().port;

    const response = await fetch(
      `http://127.0.0.1:${port}/`,
      {
        headers: {
          connection: "close",
        },
      }
    );

    assert.equal(response.status, 200);

    const data = await response.json();

    assert.deepEqual(data, {
      message: "API M-Motors opérationnelle",
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});