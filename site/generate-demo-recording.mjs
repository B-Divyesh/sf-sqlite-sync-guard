import { writeFileSync } from "node:fs";
import { normalizeDemoOutput, runDemo, toTerminalSvg } from "./demo-recording.mjs";

const output = normalizeDemoOutput(runDemo());
writeFileSync("site/public/demo-recording.txt", output);
writeFileSync("site/public/demo-recording.svg", toTerminalSvg(output));
writeFileSync(
  "site/src/demo-transcript.ts",
  `// Generated from the bundled \`sqlite-sync-guard demo\` command during \`npm run build:site\`.\nexport const demoTranscript = ${JSON.stringify(output)};\n`
);
console.log("generated normalized recording from sqlite-sync-guard demo");
