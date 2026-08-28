import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: { ...process.env } });
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed`);
}
const cargo = (name) => () => run("cargo", ["test", "--test", "cli", name, "--", "--exact"]);
const cargoUnit = (name) => () => run("cargo", ["test", name, "--", "--exact"]);
const browser = () => { run("npm", ["run", "build:site"]); run("node", ["site/test-browser.mjs"]); };
const source = () => { assert.match(readFileSync("LICENSE", "utf8"), /Permission is hereby granted, free of charge/); assert.match(readFileSync("Cargo.toml", "utf8"), /license = "MIT"/); };
const build = () => run("npm", ["run", "build"]);
const help = () => { run("cargo", ["build", "--quiet"]); run("target/debug/sqlite-sync-guard", ["--help"]); };

const tests = {
  "@claim:demo-isolation": cargo("claim_demo_isolated_and_real"),
  "@claim:unsafe-detection": cargo("claim_scan_is_read_only_and_all_sidecars_are_unsafe"),
  "@claim:exit-codes-json": cargo("documented_scan_json_contract_and_exit_codes"),
  "@claim:verified-transfer": cargo("claim_verified_transfer_and_overwrite"),
  "@claim:live-consistent-transfer": cargoUnit("export::tests::exports_a_live_wal_database_with_a_consistent_snapshot"),
  "@claim:ignore-rules": cargo("claim_ignore_rules_preserve_content_and_repeat_cleanly"),
  "@claim:scan-read-only": cargo("claim_scan_is_read_only_and_all_sidecars_are_unsafe"),
  "@claim:offline-demo": browser,
  "@claim:no-telemetry": browser,
  "@claim:demo-reset": browser,
  "@claim:mit-source": source,
  "@claim:bundled-sqlite": cargo("claim_demo_isolated_and_real"),
  "@claim:help-output": help,
  "@claim:build-output": build
};
const index = process.argv.indexOf("--grep");
const selected = index >= 0 ? process.argv[index + 1] : null;
if (selected) { assert.ok(tests[selected], `unknown claim ${selected}`); tests[selected](); console.log(`claim passed: ${selected}`); }
else for (const [tag, test] of Object.entries(tests)) { test(); console.log(`claim passed: ${tag}`); }
