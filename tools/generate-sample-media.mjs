import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sampleRoot = path.join(projectRoot, "animals", "sample-owl");
const audioRoot = path.join(sampleRoot, "audio");

await mkdir(audioRoot, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-labelledby="title description">
  <title id="title">Signal Owl</title>
  <description id="description">An original geometric amber owl on a dark museum display.</description>
  <rect width="1200" height="900" fill="#10161b"/>
  <path d="M0 735C210 650 340 705 520 665c194-43 352-7 680 71v164H0Z" fill="#18242b"/>
  <g transform="translate(600 445)">
    <path d="M-300-255-105-180 0-245l105 65 195-75-65 240 47 250-282 160-282-160 47-250Z" fill="#26343a" stroke="#e0a84f" stroke-width="16"/>
    <path d="M-246-205-118-151-197-64Z" fill="#e0a84f" opacity=".78"/>
    <path d="M246-205 118-151l79 87Z" fill="#e0a84f" opacity=".78"/>
    <circle cx="-122" cy="-52" r="88" fill="#0a0f12" stroke="#f2cf78" stroke-width="17"/>
    <circle cx="122" cy="-52" r="88" fill="#0a0f12" stroke="#f2cf78" stroke-width="17"/>
    <circle cx="-122" cy="-52" r="24" fill="#f7e8aa"/>
    <circle cx="122" cy="-52" r="24" fill="#f7e8aa"/>
    <path d="M0-7 50 45 0 82-50 45Z" fill="#e0a84f"/>
    <path d="M-185 111Q0 265 185 111L0 300Z" fill="#1b272d" stroke="#6b8188" stroke-width="11"/>
    <path d="M-390 190h780" stroke="#63767c" stroke-width="20" stroke-linecap="round"/>
  </g>
  <g fill="#e0a84f" font-family="Segoe UI, Arial, sans-serif" text-anchor="middle">
    <text x="600" y="800" font-size="37" font-weight="700" letter-spacing="9">SYNTHETIC SAMPLE</text>
    <text x="600" y="848" font-size="21" letter-spacing="4" opacity=".72">NO PHOTOGRAPH · NO RECORDED VOICE</text>
  </g>
</svg>
`;

await writeFile(path.join(sampleRoot, "sample-owl.image.svg"), svg, "utf8");

const sampleRate = 44_100;
const durationSeconds = 1.8;
const sampleCount = Math.floor(sampleRate * durationSeconds);
const pcm = Buffer.alloc(sampleCount * 2);

for (let index = 0; index < sampleCount; index += 1) {
  const time = index / sampleRate;
  const firstHoot = envelope(time, 0.08, 0.65);
  const secondHoot = envelope(time, 0.94, 0.62);
  const firstTone = Math.sin(2 * Math.PI * (410 - time * 36) * time);
  const secondTime = Math.max(0, time - 0.88);
  const secondTone = Math.sin(2 * Math.PI * (355 - secondTime * 26) * secondTime);
  const harmonic = Math.sin(2 * Math.PI * 820 * time) * 0.12;
  const value = Math.max(-1, Math.min(1, (firstTone + harmonic) * firstHoot * 0.28 + secondTone * secondHoot * 0.3));
  pcm.writeInt16LE(Math.round(value * 32767), index * 2);
}

const wav = Buffer.alloc(44 + pcm.length);
wav.write("RIFF", 0, "ascii");
wav.writeUInt32LE(36 + pcm.length, 4);
wav.write("WAVE", 8, "ascii");
wav.write("fmt ", 12, "ascii");
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36, "ascii");
wav.writeUInt32LE(pcm.length, 40);
pcm.copy(wav, 44);

await writeFile(path.join(audioRoot, "sample-owl-call.wav"), wav);
console.log("Generated privacy-safe Signal Owl SVG and synthesized WAV.");

function envelope(time, start, duration) {
  const local = time - start;
  if (local < 0 || local > duration) return 0;
  const attack = Math.min(1, local / 0.08);
  const release = Math.min(1, (duration - local) / 0.2);
  return Math.sin(Math.PI * (local / duration)) ** 0.7 * attack * release;
}
