import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { osClickViewport } from "./dist/os-input.js";

// No real desktop input: these fixtures reproduce the observed Openbox offset.
const root = mkdtempSync(join(tmpdir(), "mcp-input-test-"));
const oldPath = process.env.PATH;
const oldLog = process.env.INPUT_TEST_LOG;
try {
  process.env.INPUT_TEST_LOG = join(root, "commands");
  process.env.PATH = root + ":" + oldPath;
  writeFileSync(join(root, "ps"), "#!/bin/sh\nprintf '%s\\n' '123 /opt/camoufox/camoufox -profile /tmp/input-test-profile'\n", { mode: 0o755 });
  writeFileSync(join(root, "xdotool"), `#!/bin/sh
printf '%s\\n' "$*" >> "$INPUT_TEST_LOG"
case "$1" in
  search) printf '4194307\\n' ;;
  getwindowgeometry) printf 'X=642\\nY=356\\nWIDTH=1280\\nHEIGHT=805\\n' ;;
esac
`, { mode: 0o755 });
  writeFileSync(join(root, "xwininfo"), "#!/bin/sh\nprintf 'Absolute upper-left X: 641\\nAbsolute upper-left Y: 338\\nWidth: 1280\\nHeight: 805\\n'\n", { mode: 0o755 });
  const result = await osClickViewport("/tmp/input-test-profile", 230, 225, 720);
  if (!result.ok || result.screenX !== 871 || result.screenY !== 648)
    throw new Error("Native geometry regression: " + JSON.stringify(result));
  const calls = readFileSync(process.env.INPUT_TEST_LOG, "utf8");
  if (!calls.includes("mousemove --sync 871 648") || !calls.includes("click 1"))
    throw new Error("Expected native click was not dispatched");
  writeFileSync(process.env.INPUT_TEST_LOG, "");
  writeFileSync(join(root, "xwininfo"), "#!/bin/sh\nprintf 'unavailable\\n'\n", { mode: 0o755 });
  const failed = await osClickViewport("/tmp/input-test-profile", 230, 225, 720);
  if (failed.ok || readFileSync(process.env.INPUT_TEST_LOG, "utf8").includes("click 1"))
    throw new Error("Missing geometry must fail without clicking");
  console.log("Linux geometry regression and no-click error path: passed");
} finally {
  process.env.PATH = oldPath;
  if (oldLog === undefined) delete process.env.INPUT_TEST_LOG;
  else process.env.INPUT_TEST_LOG = oldLog;
  rmSync(root, { recursive: true, force: true });
}
