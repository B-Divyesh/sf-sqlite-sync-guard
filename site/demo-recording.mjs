import { spawnSync } from "node:child_process";

export function runDemo() {
  const result = spawnSync("cargo", ["run", "--quiet", "--", "demo"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`sqlite-sync-guard demo failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

export function normalizeDemoOutput(output) {
  return output
    .replaceAll(/(?:[A-Z]:)?\/[^\n]*?sqlite-sync-guard-demo-[^\s/]+/g, "<demo-workspace>")
    .replaceAll(/(?:[A-Z]:)?\\[^\n]*?sqlite-sync-guard-demo-[^\s\\]+/g, "<demo-workspace>")
    .trimEnd() + "\n";
}

export function toTerminalSvg(output) {
  const escaped = output.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const lines = escaped.split("\n");
  const height = Math.max(360, 52 + lines.length * 25);
  const text = lines.map((line, index) => `<text x="28" y="${42 + index * 25}">${line || " "}</text>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="980" height="${height}" viewBox="0 0 980 ${height}" role="img" aria-labelledby="title desc"><title id="title">SQLite Sync Guard demo output</title><desc id="desc">A normalized recording from sqlite-sync-guard demo. The temporary workspace path is replaced with demo-workspace.</desc><rect width="980" height="${height}" fill="#182922"/><rect width="980" height="62" fill="#0B5B53"/><circle cx="28" cy="31" r="8" fill="#E8C2B8"/><circle cx="54" cy="31" r="8" fill="#F3E9D5"/><text x="82" y="37" fill="#FFF9EC" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="16" font-weight="700">$ sqlite-sync-guard demo</text><g fill="#FFF9EC" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="17">${text}</g></svg>\n`;
}
