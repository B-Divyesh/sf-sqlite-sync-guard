import { writeFileSync } from "node:fs";
import { normalizeDemoOutput, runDemo, toTerminalSvg } from "./demo-recording.mjs";

const output = normalizeDemoOutput(runDemo());
writeFileSync("site/public/demo-recording.txt", output);
writeFileSync("site/public/demo-recording.svg", toTerminalSvg(output));
console.log("generated normalized recording from sqlite-sync-guard demo");
