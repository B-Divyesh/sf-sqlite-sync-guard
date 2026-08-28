import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { normalizeDemoOutput, runDemo } from "./demo-recording.mjs";

const executable = resolve(process.platform === "win32" ? "target/debug/sqlite-sync-guard.exe" : "target/debug/sqlite-sync-guard");
let built = false;

function command(args, options = {}) {
  const result = spawnSync(executable, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  return result;
}

function ok(result, label) {
  assert.equal(result.status, 0, label + ": " + (result.stderr || result.stdout));
  return result;
}

function build() {
  if (!built) {
    ok(spawnSync("cargo", ["build", "--quiet"], { encoding: "utf8" }), "cargo build");
    built = true;
  }
}

function demo(options = {}) {
  build();
  const result = ok(command(["--json", "demo"], options), "demo --json");
  const value = JSON.parse(result.stdout);
  assert.equal(value.demo, true);
  assert.deepEqual(value.sample_ids, ["closed-project.db", "active-session.db", "examples/sample.sql"]);
  assert.ok(existsSync(value.workspace), "demo workspace must exist");
  return value;
}

function snapshotTree(root) {
  const snapshot = {};
  const visit = (directory, prefix = "") => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const key = prefix ? `${prefix}/${name}` : name;
      const metadata = lstatSync(path);
      if (metadata.isDirectory()) {
        snapshot[`${key}/`] = "directory";
        visit(path, key);
      } else {
        snapshot[key] = readFileSync(path).toString("base64");
      }
    }
  };
  visit(root);
  return snapshot;
}

function isInside(parent, child) {
  const path = relative(resolve(parent), resolve(child));
  return path !== "" && path !== ".." && !path.startsWith(`..${sep}`);
}

function scan(workspace, jsonPosition = "after") {
  return command(jsonPosition === "before" ? ["--json", "scan", workspace] : ["scan", workspace, "--json"]);
}

function copiedSample(value, name) {
  const root = join(value.workspace, name);
  mkdirSync(root, { recursive: true });
  const database = join(root, "closed-project.db");
  cpSync(join(value.workspace, "closed-project.db"), database);
  return { root, database };
}

function json(result, label) {
  assert.notEqual(result.stdout.trim(), "", label + " must write JSON to stdout");
  return JSON.parse(result.stdout);
}

async function waitFor(file, label) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(file)) return;
    await delay(25);
  }
  throw new Error(label + " did not become ready");
}

async function runDevServer() {
  const port = 4200 + Math.floor(Math.random() * 400);
  const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "site", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: resolve("."),
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });
  try {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (server.exitCode !== null) throw new Error("Vite exited early: " + output);
      try {
        const response = await fetch("http://127.0.0.1:" + port + "/");
        if (response.status === 200) {
          assert.match(await response.text(), /Check SQLite files before folder sync/);
          return;
        }
      } catch {
        // The dev server has not accepted connections yet.
      }
      await delay(50);
    }
    throw new Error("Vite did not serve the site: " + output);
  } finally {
    if (server.exitCode === null) server.kill("SIGTERM");
  }
}

async function withPython(script, args, ready, action) {
  const child = spawn("python3", ["-c", script, ...args], { stdio: "ignore" });
  try {
    await waitFor(ready, "Python fixture");
    return await action();
  } finally {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
}

function inspectSqlite(database, query) {
  const script = [
    "import json, sqlite3, sys",
    "connection = sqlite3.connect(sys.argv[1])",
    "integrity = connection.execute('PRAGMA integrity_check').fetchone()[0]",
    "rows = [row[0] for row in connection.execute(sys.argv[2]).fetchall()]",
    "print(json.dumps({'integrity': integrity, 'rows': rows}))"
  ].join("; ");
  const result = ok(spawnSync("python3", ["-c", script, database, query], { encoding: "utf8" }), "independent SQLite inspection");
  return JSON.parse(result.stdout);
}

function browserCheck(label) {
  ok(spawnSync("npm", ["run", "build:site"], { encoding: "utf8" }), label + " site build");
  ok(spawnSync("node", ["site/test-browser.mjs"], { encoding: "utf8" }), label + " browser check");
}

function assertClaimCoverage() {
  const claims = JSON.parse(readFileSync(".factory/claims.json", "utf8"));
  assert.ok(Array.isArray(claims) && claims.length > 0, "claims registry must be a non-empty array");
  const ids = new Set(claims.map((claim) => claim.id));
  assert.equal(ids.size, claims.length, "claim ids must be unique");

  const sources = [
    ["site/index.html", "landing"],
    ["site/demo/index.html", "/demo/"],
    ["site/privacy/index.html", "/privacy/"],
    ["site/terms/index.html", "/terms/"],
    ["README.md", "README"]
  ];
  const annotatedIds = new Set();
  for (const [file, location] of sources) {
    const source = readFileSync(file, "utf8");
    const annotations = [
      ...source.matchAll(/data-claim="([^"]+)"/g),
      ...source.matchAll(/<!--\s*claims?:\s*([^>]+?)\s*-->/g)
    ];
    assert.ok(annotations.length > 0 || file === "site/404.html", `${file} must enumerate its behavior claims`);
    for (const annotation of annotations) {
      for (const id of annotation[1].trim().split(/[\s,]+/)) {
        assert.ok(ids.has(id), `${file} references unknown claim ${id}`);
        const claim = claims.find((candidate) => candidate.id === id);
        assert.match(claim.where.toLowerCase(), new RegExp(location.replaceAll("/", "\\/").toLowerCase()), `${id} must list ${location} in where`);
        annotatedIds.add(id);
      }
    }
  }

  const catalog = readFileSync(".factory/catalog-description.txt", "utf8").trim();
  assert.ok(catalog.length <= 120, "catalog description must be at most 120 characters");
  assert.match(catalog, /^(Check|Create|Find|Scan|Warn)\b/, "catalog description must start with a verb");
  for (const id of ["unsafe-detection", "verified-transfer"]) {
    assert.match(claims.find((claim) => claim.id === id).where, /catalog description/i, `${id} must map the catalog description`);
  }

  for (const claim of claims) {
    assert.equal(claim.test, `npm run test:claims -- --grep @claim:${claim.id}`, `${claim.id} must expose its exact tagged command`);
    assert.ok(tests[`@claim:${claim.id}`], `claim has no tagged test: ${claim.id}`);
    assert.ok(annotatedIds.has(claim.id), `public claim is not annotated in source: ${claim.id}`);
  }
}

const tests = {
  "@claim:demo-recording": () => {
    const expected = readFileSync("site/public/demo-recording.txt", "utf8");
    assert.equal(normalizeDemoOutput(runDemo()), expected);
    assert.match(readFileSync("site/public/demo-recording.svg", "utf8"), /active-session\.db/);
    assert.match(readFileSync("site/src/demo-transcript.ts", "utf8"), /active-session\.db/);
  },
  "@claim:demo-isolation": () => {
    const current = mkdtempSync(join(tmpdir(), "sqlite-sync-guard-claim-cwd-"));
    mkdirSync(join(current, "private"));
    writeFileSync(join(current, "do-not-read.txt"), "private current-directory sentinel");
    writeFileSync(join(current, "private", "keep.bin"), Buffer.from([0, 1, 2, 3, 255]));
    const before = snapshotTree(current);
    const first = demo({ cwd: current });
    const second = demo({ cwd: current });
    assert.notEqual(first.workspace, second.workspace);
    assert.equal(isInside(current, first.workspace), false, "demo workspace must be outside the current directory");
    assert.equal(isInside(first.workspace, first.transfer_backup), true, "backup must stay inside demo workspace");
    assert.equal(isInside(first.workspace, first.manifest), true, "manifest must stay inside demo workspace");
    assert.equal(first.scan.unsafe_count, 1);
    assert.ok(existsSync(first.transfer_backup));
    assert.ok(existsSync(first.manifest));
    assert.deepEqual(snapshotTree(current), before, "demo must leave the current-directory tree unchanged");
  },
  "@claim:web-demo-entry": () => {
    demo();
    browserCheck("web demo entry");
  },
  "@claim:unsafe-detection": () => {
    for (const [suffix, kind] of [["-wal", "wal"], ["-shm", "shm"], ["-journal", "journal"]]) {
      const value = demo();
      const fixture = copiedSample(value, "sidecar-" + kind);
      writeFileSync(fixture.database + suffix, "demo journal marker");
      const result = scan(fixture.root);
      assert.equal(result.status, 2, suffix + " must be unsafe");
      const report = json(result, suffix + " report");
      assert.equal(report.unsafe_count, 1);
      assert.equal(report.database_sets[0].database, "closed-project.db");
      assert.deepEqual(report.database_sets[0].sidecars.map((sidecar) => sidecar.kind), [kind]);
      assert.match(report.database_sets[0].reasons.join("\n"), new RegExp(kind === "shm" ? "shared-memory" : kind === "journal" ? "rollback-journal" : "WAL"));
    }
  },
  "@claim:active-lock-detection": async () => {
    const value = demo();
    const fixture = copiedSample(value, "active-lock");
    const ready = join(fixture.root, "lock-ready");
    const holder = [
      "import fcntl, os, sys, time",
      "file = open(sys.argv[1], 'r+b')",
      "fcntl.lockf(file, fcntl.LOCK_EX, 512, 0x40000000, os.SEEK_SET)",
      "open(sys.argv[2], 'w').write('ready')",
      "time.sleep(30)"
    ].join("; ");
    await withPython(holder, [fixture.database, ready], ready, async () => {
      const result = scan(fixture.root);
      assert.equal(result.status, 2);
      const report = json(result, "active-lock report");
      assert.equal(report.database_sets[0].lock_state, "active");
      assert.match(report.database_sets[0].reasons.join("\n"), /active SQLite lock detected/);
    });
  },
  "@claim:exit-codes-json": () => {
    const value = demo();
    const safe = copiedSample(value, "safe-scan").root;
    const missing = join(value.workspace, "missing-root");
    for (const position of ["before", "after"]) {
      const safeResult = scan(safe, position);
      assert.equal(safeResult.status, 0);
      assert.equal(json(safeResult, "safe " + position).safe, true);
      const unsafeResult = scan(value.workspace, position);
      assert.equal(unsafeResult.status, 2);
      assert.equal(json(unsafeResult, "unsafe " + position).unsafe_count, 1);
      const args = position === "before" ? ["--json", "scan", missing] : ["scan", missing, "--json"];
      const errorResult = command(args);
      assert.equal(errorResult.status, 1);
      const error = json(errorResult, "error " + position);
      assert.equal(error.ok, false);
      assert.match(error.error, /scan root does not exist/);
    }
  },
  "@claim:live-consistent-transfer": async () => {
    const value = demo();
    const root = join(value.workspace, "live-consistent");
    mkdirSync(root);
    const database = join(root, "live.db");
    const ready = join(root, "writer-ready");
    const output = join(root, "transfer");
    const writer = [
      "import sqlite3, sys, time",
      "connection = sqlite3.connect(sys.argv[1], isolation_level=None)",
      "connection.execute('PRAGMA journal_mode=WAL')",
      "connection.execute('CREATE TABLE records (value TEXT NOT NULL)')",
      "connection.execute(\"INSERT INTO records VALUES ('committed-row')\")",
      "connection.execute('BEGIN IMMEDIATE')",
      "connection.execute(\"INSERT INTO records VALUES ('uncommitted-row')\")",
      "open(sys.argv[2], 'w').write('ready')",
      "time.sleep(30)"
    ].join("; ");
    await withPython(writer, [database, ready], ready, async () => {
      const result = ok(command(["export", database, "--output", output, "--json"]), "live WAL export");
      const transfer = json(result, "live WAL export JSON");
      const inspected = inspectSqlite(transfer.backup, "SELECT value FROM records ORDER BY value");
      assert.equal(inspected.integrity, "ok");
      assert.deepEqual(inspected.rows, ["committed-row"]);
    });
  },
  "@claim:verified-transfer": () => {
    const value = demo();
    const backup = value.transfer_backup;
    const manifest = JSON.parse(readFileSync(value.manifest, "utf8"));
    const inspected = inspectSqlite(backup, "SELECT body FROM notes");
    assert.equal(inspected.integrity, "ok");
    assert.deepEqual(inspected.rows, ["sample transfer record"]);
    assert.equal(manifest.sha256, createHash("sha256").update(readFileSync(backup)).digest("hex"));
    assert.equal(manifest.bytes, statSync(backup).size);
    assert.equal(manifest.integrity_check, "ok");
    assert.equal(manifest.backup_file, "closed-project.backup.sqlite3");
    assert.equal(manifest.source, realpathSync(join(value.workspace, "closed-project.db")));
    assert.match(manifest.sqlite_version, /^\d+\.\d+\.\d+$/);
    assert.equal(manifest.source_observations.database, "closed-project.db");
    assert.equal(manifest.source_observations.database_present, true);
    assert.equal(manifest.source_observations.sqlite_header, true);
    assert.deepEqual(manifest.source_observations.sidecars, []);
    assert.equal(manifest.source_observations.lock_state, "available");
    const output = join(value.workspace, "transfer");
    const refused = command(["export", join(value.workspace, "closed-project.db"), "--output", output]);
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /--force/);
    assert.equal(command(["export", join(value.workspace, "closed-project.db"), "--output", output, "--force"]).status, 0);
  },
  "@claim:ignore-rules": () => {
    const value = demo();
    const syncthing = join(value.workspace, ".stignore");
    writeFileSync(syncthing, "keep-syncthing-rule\n");
    ok(command(["ignore", value.workspace, "--client", "syncthing"]), "Syncthing ignore");
    const firstSyncthing = readFileSync(syncthing, "utf8");
    assert.match(firstSyncthing, /keep-syncthing-rule/);
    assert.match(firstSyncthing, /# BEGIN sqlite-sync-guard/);
    ok(command(["ignore", value.workspace, "--client", "syncthing"]), "repeat Syncthing ignore");
    assert.equal(readFileSync(syncthing, "utf8"), firstSyncthing);
    const resilio = join(value.workspace, ".sync", "IgnoreList");
    mkdirSync(join(value.workspace, ".sync"), { recursive: true });
    writeFileSync(resilio, "keep-resilio-rule\n");
    ok(command(["ignore", value.workspace, "--client", "resilio"]), "Resilio ignore");
    const firstResilio = readFileSync(resilio, "utf8");
    assert.match(firstResilio, /keep-resilio-rule/);
    assert.match(firstResilio, /# BEGIN sqlite-sync-guard/);
    ok(command(["ignore", value.workspace, "--client", "resilio"]), "repeat Resilio ignore");
    assert.equal(readFileSync(resilio, "utf8"), firstResilio);
    const dry = copiedSample(value, "resilio-dry-run").root;
    ok(command(["ignore", dry, "--client", "resilio", "--dry-run"]), "Resilio dry run");
    assert.equal(existsSync(join(dry, ".sync", "IgnoreList")), false);
  },
  "@claim:scan-read-only": () => {
    const value = demo();
    const fixture = copiedSample(value, "read-only");
    const before = readFileSync(fixture.database);
    assert.equal(scan(fixture.root).status, 0);
    assert.deepEqual(readFileSync(fixture.database), before);
  },
  "@claim:offline-demo": () => {
    demo();
    browserCheck("offline demo");
  },
  "@claim:no-telemetry": () => {
    demo();
    browserCheck("no telemetry");
    const source = readFileSync("src/main.rs", "utf8");
    const manifest = readFileSync("Cargo.toml", "utf8");
    assert.doesNotMatch(source, /std::net|TcpStream|UdpSocket/);
    assert.doesNotMatch(manifest, /reqwest|ureq|hyper|curl/);
  },
  "@claim:demo-reset": () => {
    demo();
    browserCheck("demo reset");
  },
  "@claim:mit-source": () => {
    demo();
    assert.match(readFileSync("LICENSE", "utf8"), /Permission is hereby granted, free of charge/);
    assert.match(readFileSync("Cargo.toml", "utf8"), /license = "MIT"/);
  },
  "@claim:bundled-sqlite": () => {
    build();
    const result = command(["demo"], { env: { ...process.env, PATH: "/definitely-no-sqlite-command" } });
    assert.equal(result.status, 0, result.stderr);
  },
  "@claim:help-output": () => {
    demo();
    for (const args of [["--help"], ["demo", "--help"], ["scan", "--help"], ["export", "--help"], ["ignore", "--help"]]) {
      const result = ok(command(args), args.join(" ") + " help");
      assert.match(result.stdout, /Usage: sqlite-sync-guard/);
    }
  },
  "@claim:build-output": () => {
    demo();
    ok(spawnSync("npm", ["run", "build"], { encoding: "utf8" }), "production build");
    assert.ok(existsSync("target/release/sqlite-sync-guard"));
    assert.ok(existsSync("dist/site/index.html"));
    assert.ok(existsSync("dist/site/staticwebapp.config.json"));
  },
  "@claim:dev-server": async () => {
    demo();
    await runDevServer();
  },
  "@claim:package-output": () => {
    demo();
    ok(spawnSync("cargo", ["package", "--locked"], { encoding: "utf8" }), "cargo package --locked");
    assert.ok(existsSync("target/package/sqlite-sync-guard-0.1.0.crate"));
  }
};

assertClaimCoverage();
const index = process.argv.indexOf("--grep");
const selected = index >= 0 ? process.argv[index + 1] : null;
if (selected) {
  assert.ok(tests[selected], "unknown claim " + selected);
  await tests[selected]();
  console.log("claim passed: " + selected);
} else {
  for (const [tag, test] of Object.entries(tests)) {
    await test();
    console.log("claim passed: " + tag);
  }
}
