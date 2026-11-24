import { accessSync, constants, mkdirSync } from "node:fs";
import { join } from "node:path";

// Browser assets are installed at image build time, never on first request.
accessSync("/opt/camoufox-cache/camoufox/camoufox-bin", constants.X_OK);
accessSync("/opt/camoufox-cache/camoufox/GeoLite2-City.mmdb", constants.R_OK);
process.env.MCP_CAMOUFOX_BUNDLED = "1";
// Desktop caches must not share the read-only browser installation directory.
process.env.XDG_CACHE_HOME = join(process.env.HOME || "/home/camofox", ".cache");
mkdirSync(process.env.XDG_CACHE_HOME, { recursive: true });
const display = process.env.DISPLAY || ":99";
if (!/^:\d+$/.test(display)) throw new Error("DISPLAY must be a local X display, e.g. :99");
process.env.DISPLAY = display;
const xvfb = Bun.spawn(["Xvfb", display, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], {
  stdin: "ignore", stdout: "ignore", stderr: "inherit",
});
let wm: ReturnType<typeof Bun.spawn> | undefined;
let mcp: ReturnType<typeof Bun.spawn> | undefined;
let signal: string | undefined;
let killTimer: ReturnType<typeof setTimeout> | undefined;
function stop() {
  signal = "SIGTERM";
  mcp?.kill("SIGTERM");
  killTimer ??= setTimeout(() => mcp?.kill("SIGKILL"), 20000);
  killTimer.unref();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
try {
  for (let attempt = 0; ; attempt++) {
    if (signal) throw new Error("Startup cancelled");
    const probe = Bun.spawnSync(["xdpyinfo", "-display", display], { stdout: "ignore", stderr: "ignore" });
    if (probe.exitCode === 0) break;
    if (attempt >= 50 || xvfb.exitCode !== null) throw new Error("Xvfb failed to start");
    await Bun.sleep(100);
  }
  wm = Bun.spawn(["openbox"], { stdin: "ignore", stdout: "ignore", stderr: "inherit" });
  mcp = Bun.spawn([process.execPath, "/app/dist/index.js"], {
    stdin: "inherit", stdout: "inherit", stderr: "inherit",
  });
  process.exitCode = await mcp.exited;
} finally {
  if (killTimer) clearTimeout(killTimer);
  wm?.kill("SIGTERM");
  if (wm) await wm.exited;
  xvfb.kill("SIGTERM");
  await xvfb.exited;
}
