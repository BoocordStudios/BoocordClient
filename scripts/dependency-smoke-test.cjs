const assert = require("node:assert/strict");
const { EventEmitter, once } = require("node:events");
const fs = require("node:fs/promises");
const http = require("node:http");
const { createRequire } = require("node:module");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { Authenticator } = require("minecraft-launcher-core");
const Handler = require("minecraft-launcher-core/components/handler");
const launcherRequire = createRequire(require.resolve("minecraft-launcher-core"));

test("launcher keeps deterministic offline UUIDs with the patched UUID library", async () => {
  const auth = await Authenticator.getAuth("DependencySmokeTest");
  const { v3 } = launcherRequire("uuid");
  assert.equal(auth.uuid, v3("DependencySmokeTest", v3.DNS));
  assert.equal(auth.access_token, auth.uuid);
  assert.equal(auth.name, "DependencySmokeTest");
});

test("launcher authentication preserves JSON POST and callback behavior", { timeout: 10000 }, async (t) => {
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks));
    if (request.method !== "POST" || request.url !== "/authenticate" || body.username !== "DependencySmokeTest" || body.password !== "fixture-only") {
      response.writeHead(400);
      response.end();
      return;
    }
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      accessToken: "fixture-access-token",
      clientToken: body.clientToken,
      selectedProfile: { id: "fixture-profile-id", name: body.username },
      user: { properties: [{ name: "fixture", value: "value" }] }
    }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  Authenticator.changeApiUrl(`http://127.0.0.1:${server.address().port}`);
  t.after(() => Authenticator.changeApiUrl("https://authserver.mojang.com"));
  const auth = await Authenticator.getAuth("DependencySmokeTest", "fixture-only");
  assert.equal(auth.access_token, "fixture-access-token");
  assert.equal(auth.uuid, "fixture-profile-id");
  assert.deepEqual(JSON.parse(auth.user_properties), { fixture: ["value"] });
});

test("launcher downloads and extracts ZIPs through the maintained request client", { timeout: 10000 }, async (t) => {
  const Zip = launcherRequire("adm-zip");
  const zip = new Zip();
  const contents = Buffer.from("launcher dependency compatibility\n");
  zip.addFile("nested/fixture.txt", contents);
  const archive = zip.toBuffer();
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "boocord-dependency-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const server = http.createServer((request, response) => {
    if (request.url === "/redirect") {
      response.writeHead(302, { Location: "/archive.zip" });
      response.end();
      return;
    }
    response.writeHead(200, { "Content-Type": "application/zip", "Content-Length": archive.length });
    response.end(archive);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const client = new EventEmitter();
  client.options = { overrides: {}, timeout: 3000 };
  const handler = new Handler(client);
  const result = await handler.downloadAsync(`http://127.0.0.1:${server.address().port}/redirect`, directory, "fixture.zip", false, "test");
  assert.equal(result.failed, false);
  const downloaded = await fs.readFile(path.join(directory, "fixture.zip"));
  assert.deepEqual(downloaded, archive);
  const output = path.join(directory, "extracted");
  handler.options.root = output;
  handler.options.clientPackage = path.join(directory, "fixture.zip");
  await handler.extractPackage();
  assert.deepEqual(await fs.readFile(path.join(output, "nested/fixture.txt")), contents);
});
