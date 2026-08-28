import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeDemoOutput, runDemo } from "./demo-recording.mjs";

const executable = process.platform === "win32" ? "target/debug/sqlite-sync-guard.exe" : "target/debug/sqlite-sync-guard";
function command(args, options = {}) { const result = spawnSync(executable, args, { encoding: "utf8", ...options }); if (result.error) throw result.error; return result; }
function ok(result, label) { assert.equal(result.status, 0, `${label}: ${result.stderr || result.stdout}`); return result; }
function build() { ok(spawnSync("cargo", ["build", "--quiet"], { encoding: "utf8" }), "cargo build"); }
function demo() { build(); const result = ok(command(["--json", "demo"]), "demo --json"); const value = JSON.parse(result.stdout); assert.equal(value.demo, true); assert.deepEqual(value.sample_ids, ["closed-project.db", "active-session.db", "examples/sample.sql"]); return value; }
function scan(workspace, jsonPosition = "after") { return command(jsonPosition === "before" ? ["--json", "scan", workspace] : ["scan", workspace, "--json"]); }
function browser() { ok(spawnSync("npm", ["run", "build:site"], { encoding: "utf8" }), "site build"); ok(spawnSync("node", ["site/test-browser.mjs"], { encoding: "utf8" }), "browser test"); }

const tests = {
  "@claim:demo-recording": () => { const expected = readFileSync("site/public/demo-recording.txt", "utf8"); assert.equal(normalizeDemoOutput(runDemo()), expected); assert.match(readFileSync("site/public/demo-recording.svg", "utf8"), /active-session\.db/); },
  "@claim:demo-isolation": () => { const first = demo(); const second = demo(); assert.notEqual(first.workspace, second.workspace); assert.equal(first.scan.unsafe_count, 1); assert.ok(existsSync(first.transfer_backup)); assert.ok(existsSync(first.manifest)); },
  "@claim:unsafe-detection": () => { const value = demo(); for (const suffix of ["-wal", "-shm", "-journal"]) { writeFileSync(join(value.workspace, `closed-project.db${suffix}`), "demo journal marker"); assert.equal(scan(value.workspace).status, 2, `${suffix} must be unsafe`); } },
  "@claim:exit-codes-json": () => { const value = demo(); const unsafe = scan(value.workspace); assert.equal(unsafe.status, 2); assert.equal(JSON.parse(unsafe.stdout).unsafe_count, 1); const safe = command(["--json", "scan", join(value.workspace, "transfer")]); assert.equal(safe.status, 0); assert.equal(JSON.parse(safe.stdout).safe, true); assert.equal(command(["scan", join(value.workspace, "missing")]).status, 1); },
  "@claim:verified-transfer": () => { const value = demo(); const backup = readFileSync(value.transfer_backup); const manifest = JSON.parse(readFileSync(value.manifest, "utf8")); assert.equal(manifest.sha256, createHash("sha256").update(backup).digest("hex")); assert.equal(manifest.integrity_check, "ok"); assert.equal(command(["export", join(value.workspace, "closed-project.db"), "--output", join(value.workspace, "transfer")]).status, 1); assert.equal(command(["export", join(value.workspace, "closed-project.db"), "--output", join(value.workspace, "transfer"), "--force"]).status, 0); },
  "@claim:ignore-rules": () => { const value = demo(); const file = join(value.workspace, ".stignore"); writeFileSync(file, "keep-this-rule\n"); ok(command(["ignore", value.workspace, "--client", "syncthing"]), "syncthing ignore"); const first = readFileSync(file, "utf8"); assert.match(first, /keep-this-rule/); ok(command(["ignore", value.workspace, "--client", "syncthing"]), "repeat ignore"); assert.equal(readFileSync(file, "utf8"), first); ok(command(["ignore", value.workspace, "--client", "resilio", "--dry-run"]), "resilio dry run"); assert.equal(existsSync(join(value.workspace, ".sync/IgnoreList")), false); },
  "@claim:scan-read-only": () => { const value = demo(); const database = join(value.workspace, "closed-project.db"); const before = readFileSync(database); assert.equal(scan(value.workspace).status, 2); assert.deepEqual(readFileSync(database), before); },
  "@claim:offline-demo": () => { demo(); browser(); },
  "@claim:no-telemetry": () => { demo(); browser(); const source = readFileSync("src/main.rs", "utf8"); const manifest = readFileSync("Cargo.toml", "utf8"); assert.doesNotMatch(source, /std::net|TcpStream|UdpSocket/); assert.doesNotMatch(manifest, /reqwest|ureq|hyper|curl/); },
  "@claim:demo-reset": () => { demo(); browser(); },
  "@claim:mit-source": () => { demo(); assert.match(readFileSync("LICENSE", "utf8"), /Permission is hereby granted, free of charge/); assert.match(readFileSync("Cargo.toml", "utf8"), /license = "MIT"/); },
  "@claim:bundled-sqlite": () => { build(); const result = command(["demo"], { env: { ...process.env, PATH: "/definitely-no-sqlite-command" } }); assert.equal(result.status, 0, result.stderr); },
  "@claim:help-output": () => { demo(); const result = ok(command(["--help"]), "help"); assert.match(result.stdout, /Usage: sqlite-sync-guard/); assert.match(result.stdout, /demo/); },
  "@claim:build-output": () => { demo(); ok(spawnSync("npm", ["run", "build"], { encoding: "utf8" }), "production build"); assert.ok(existsSync("target/release/sqlite-sync-guard")); assert.ok(existsSync("dist/site/index.html")); }
};
const index = process.argv.indexOf("--grep"); const selected = index >= 0 ? process.argv[index + 1] : null;
if (selected) { assert.ok(tests[selected], `unknown claim ${selected}`); tests[selected](); console.log(`claim passed: ${selected}`); }
else for (const [tag, test] of Object.entries(tests)) { test(); console.log(`claim passed: ${tag}`); }
