import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const tracked = execFileSync("git", ["ls-files", "-z"], {
  cwd: projectRoot,
  encoding: "utf8",
}).split("\0").filter(Boolean).map((file) => file.replaceAll("\\", "/"));

const allowedAnimalFiles = new Set([
  "animals/README.md",
  "animals/_template/animal-name.about.md",
  "animals/_template/animal-name.animal.md",
  "animals/sample-owl/sample-owl.about.md",
  "animals/sample-owl/sample-owl.animal.md",
  "animals/sample-owl/sample-owl.image.svg",
  "animals/sample-owl/audio/sample-owl-call.wav",
]);

const failures = [];
for (const file of tracked) {
  const normalized = file.toLowerCase();
  if (file.startsWith("animals/") && !allowedAnimalFiles.has(file)) {
    failures.push(`unapproved animal content: ${file}`);
  }
  if (/(^|\/)(node_modules|guest-recordings|archive|recordings|captures|user-data|profiles)(\/|$)/i.test(file)) {
    failures.push(`private or generated path: ${file}`);
  }
  if (/(read-by|recorded-replacement|museum-guest|age-[0-9]|guest-recordings)/i.test(normalized)) {
    failures.push(`identity-bearing filename: ${file}`);
  }
  if (/\.(?:mp3|mp4|m4a|mov|webm|ogg)$/i.test(file)) {
    failures.push(`raw media is not allowed: ${file}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Privacy allowlist passed for ${tracked.length} tracked files.`);
