import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

if (!process.versions.bun) throw new Error("Expected Bun runtime");
if (Bun.which("node") || Bun.which("npm")) throw new Error("Image must not contain Node/npm");
const version = JSON.parse(readFileSync("/opt/camoufox-cache/camoufox/version.json", "utf8"));
if (version.version !== process.env.EXPECTED_VERSION || version.release !== process.env.EXPECTED_RELEASE)
  throw new Error("Wrong bundled browser version");
const fixture = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  fetch: () => new Response("<!doctype html><title>mcp-camoufox-smoke</title><body>browser fixture</body>", {
    headers: { "content-type": "text/html" },
  }),
});
const client = new Client({ name: "image-smoke", version: "1.0.0" });
const key = randomUUID() + randomUUID();
const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const gateway = Bun.spawn([process.execPath, "/app/entrypoint.ts"], {
  env: { ...process.env, MCP_CAMOUFOX_API_KEY: key, MCP_CAMOUFOX_PORT: "19380" },
  stdin: "ignore", stdout: "ignore", stderr: "inherit",
});
const base = "http://127.0.0.1:19380";
const transport = new StreamableHTTPClientTransport(new URL(base + "/mcp"), { requestInit: { headers } });
const text = (reply: any) => (reply.content ?? []).filter((i: any) => i.type === "text").map((i: any) => i.text).join("\n");
let connected = false;
try {
  for (let i = 0; ; i++) {
    try { if ((await fetch(base + "/health", { headers })).ok) break; } catch {}
    if (i > 100 || gateway.exitCode !== null) throw new Error("HTTP gateway failed to start");
    await Bun.sleep(100);
  }
  if ((await fetch(base + "/health")).status !== 401) throw new Error("Authentication was not enforced");
  await client.connect(transport);
  connected = true;
  const { tools } = await client.listTools();
  for (const name of ["solve", "browser_launch", "os_click_xy", "turnstile_coords", "http_request"]) {
    if (!tools.some(t => t.name === name)) throw new Error(`Missing tool: ${name}`);
  }
  const launch = await client.callTool({
    name: "browser_launch",
    arguments: { url: `http://127.0.0.1:${fixture.port}`, headless: true, fresh_profile: true, geoip: false, ublock: false },
  }, undefined, { timeout: 90000 });
  if (launch.isError) throw new Error(text(launch));
  const page = await client.callTool({
    name: "evaluate", arguments: { expression: "document.title", world: "isolated" },
  });
  if (page.isError || text(page) !== "mcp-camoufox-smoke") throw new Error("Browser evaluation failed");
  const http = await client.callTool({
    name: "http_request", arguments: { url: `http://127.0.0.1:${fixture.port}` },
  });
  if (http.isError || !text(http).includes("mcp-camoufox-smoke")) throw new Error("Bun/native impit HTTP path failed");
  console.log(JSON.stringify({ runtime: process.versions.bun, tools: tools.length, browser: version, passed: true }));
} finally {
  if (connected) {
    await client.callTool({ name: "browser_close", arguments: {} }).catch(() => {});
    await transport.terminateSession().catch(() => {});
    await client.close();
  }
  gateway.kill("SIGTERM");
  await gateway.exited;
  fixture.stop(true);
}
