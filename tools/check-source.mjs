import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const roots = ["electron", "renderer", "tools"];
const sourceFiles = [];

for (const root of roots) {
  await collect(path.join(projectRoot, root));
}

for (const file of sourceFiles.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Syntax checked ${sourceFiles.length} JavaScript files.`);

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute);
    if (entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) sourceFiles.push(absolute);
  }
}
