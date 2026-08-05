const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const { pathToFileURL } = require("node:url");
const matter = require("gray-matter");
const ytdl = require("ytdl-core");

const ROOT_DIR = path.resolve(__dirname, "..");
const ANIMALS_DIR = path.join(ROOT_DIR, "animals");
const APP_SETTINGS_PATH = path.join(ROOT_DIR, "config", "app-settings.md");
const ANIMAL_TEMPLATE_PATH = path.join(ANIMALS_DIR, "_template", "animal-name.animal.md");
const ABOUT_TEMPLATE_PATH = path.join(ANIMALS_DIR, "_template", "animal-name.about.md");

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".webm", ".ogg"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);

const DEFAULT_APP_SETTINGS = Object.freeze({
  windowTitle: "Museum Animal Sound Wall",
  headerTitle: "Press And Hold To Hear The Animal",
  headerSubtitle: "Interactive Museum Display",
  idleStatusMessage: "Hold a button to hear the animal. Sounds can overlap.",
  language: "en",
  uiMode: "touchscreen",
  wallButtonMode: "dual",
  windowWidth: 1680,
  windowHeight: 760,
  masterGain: 1,
  defaultAttackMs: 80,
  defaultReleaseMs: 520,
  preloadAudio: true,
  inputInteractionsEnabled: false,
  controllerMappingEnabled: false,
  showInputBadges: true,
  guessingIdleTimeoutSec: 30,
  guessingSuccessChimeEnabled: true,
  controllerVisualLayout: {},
  inputBindings: [],
});

const DEFAULT_CLIP_SETTINGS = Object.freeze({
  id: "clip",
  kind: "sound",
  visible: true,
  label: "Animal Sounds",
  file: "audio/animal-name-call.mp3",
  performerName: "Field recording",
  summary: "Primary press-and-hold clip.",
  gain: 1,
  attackMs: 80,
  releaseMs: 520,
  startAtSec: 0,
  endAtSec: 0,
  loopWhileHeld: true,
});

const DEFAULT_ANIMAL_SETTINGS = Object.freeze({
  id: "new-animal",
  sortOrder: 99,
  displayName: "New Animal",
  tagline: "",
  accentColor: "#8fdccc",
  imageFile: "animal-name.image.jpg",
  aboutFile: "animal-name.about.md",
  videoFile: "",
  videoUrl: "",
  enabled: true,
  cropPosition: "50% 50%",
  guestRecorderEnabled: true,
  guestRecorderLabel: "Copy This Sound",
  audioClips: [{ ...DEFAULT_CLIP_SETTINGS }],
});

const DEFAULT_ABOUT_SETTINGS = Object.freeze({
  animalName: "New Animal",
  scientificName: "Genus species",
  scientificPronunciation: "JEE-nus SPEE-sheez",
  keyFacts: [
    "Key fact one.",
    "Key fact two.",
    "Key fact three.",
  ],
  scienceHighlights: [
    "Science highlight one.",
    "Science highlight two.",
  ],
  curiousQuestionAge3To5: "What sound do you notice first when this animal moves?",
  curiousQuestionAge5To8: "What body part might help this animal survive in its habitat?",
  curiousQuestionAge8To13: "How could this animal's body and behavior evolve together for survival?",
});

const APP_SETTINGS_ORDER = [
  "windowTitle",
  "headerTitle",
  "headerSubtitle",
  "idleStatusMessage",
  "language",
  "uiMode",
  "wallButtonMode",
  "windowWidth",
  "windowHeight",
  "masterGain",
  "defaultAttackMs",
  "defaultReleaseMs",
  "preloadAudio",
  "inputInteractionsEnabled",
  "controllerMappingEnabled",
  "showInputBadges",
  "guessingIdleTimeoutSec",
  "guessingSuccessChimeEnabled",
  "controllerVisualLayout",
  "inputBindings",
];

const ANIMAL_SETTINGS_ORDER = [
  "id",
  "sortOrder",
  "displayName",
  "tagline",
  "accentColor",
  "imageFile",
  "aboutFile",
  "videoFile",
  "videoUrl",
  "enabled",
  "cropPosition",
  "guestRecorderEnabled",
  "guestRecorderLabel",
  "audioClips",
];

const CLIP_SETTINGS_ORDER = [
  "id",
  "kind",
  "visible",
  "label",
  "file",
  "performerName",
  "summary",
  "gain",
  "attackMs",
  "releaseMs",
  "startAtSec",
  "endAtSec",
  "loopWhileHeld",
];

const ABOUT_SETTINGS_ORDER = [
  "animalName",
  "scientificName",
  "scientificPronunciation",
  "keyFacts",
  "scienceHighlights",
  "curiousQuestionAge3To5",
  "curiousQuestionAge5To8",
  "curiousQuestionAge8To13",
];

async function exists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readMarkdownConfig(filePath, defaults) {
  const raw = await fsPromises.readFile(filePath, "utf8");
  const parsed = matter(raw);
  return {
    data: { ...defaults, ...parsed.data },
    body: parsed.content.trim(),
  };
}

function orderFields(data, order) {
  const ordered = {};
  order.forEach((key) => {
    if (key in data) {
      ordered[key] = data[key];
    }
  });

  Object.keys(data).forEach((key) => {
    if (!(key in ordered)) {
      ordered[key] = data[key];
    }
  });

  return ordered;
}

function trimDocumentBody(body) {
  const trimmed = String(body ?? "").trim();
  return trimmed ? `${trimmed}\n` : "";
}

function toPosixPath(value) {
  return String(value ?? "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function titleFromSlug(value) {
  return String(value ?? "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shortAnimalLabel(displayName) {
  const parts = String(displayName ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return parts[parts.length - 1] || displayName || "Animal";
}

function numberOr(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function integerOr(value, fallback) {
  const numericValue = Number.parseInt(value, 10);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeStringArray(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return source
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
}

function normalizeInputBindings(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => ({
      actionId: String(entry?.actionId || "").trim(),
      keyboardKey: String(entry?.keyboardKey || "").trim(),
      altInputKey: String(entry?.altInputKey || "").trim(),
      controllerButton: String(entry?.controllerButton || "").trim(),
    }))
    .filter((entry) => entry.actionId);
}

function normalizeControllerVisualLayout(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([name, entry]) => {
        const left = numberOr(entry?.left, NaN);
        const top = numberOr(entry?.top, NaN);
        const scale = numberOr(entry?.scale, 1);

        if (!name || !Number.isFinite(left) || !Number.isFinite(top)) {
          return null;
        }

        return [
          String(name),
          {
            left: Math.min(145, Math.max(-45, left)),
            top: Math.min(120, Math.max(-20, top)),
            scale: Math.min(2.2, Math.max(0.55, scale)),
          },
        ];
      })
      .filter(Boolean),
  );
}

function normalizeAppSettings(rawData = {}) {
  const merged = { ...DEFAULT_APP_SETTINGS, ...rawData };

  return orderFields(
    {
      windowTitle: String(merged.windowTitle || DEFAULT_APP_SETTINGS.windowTitle).trim(),
      headerTitle: String(merged.headerTitle || DEFAULT_APP_SETTINGS.headerTitle).trim(),
      headerSubtitle: String(merged.headerSubtitle || DEFAULT_APP_SETTINGS.headerSubtitle).trim(),
      idleStatusMessage: String(
        merged.idleStatusMessage || DEFAULT_APP_SETTINGS.idleStatusMessage,
      ).trim(),
      language: ["en", "es", "fr", "zh"].includes(String(merged.language || "").trim())
        ? String(merged.language).trim()
        : DEFAULT_APP_SETTINGS.language,
      uiMode:
        String(merged.uiMode || "").trim() === "museum-display"
          ? "museum-display"
          : "touchscreen",
      wallButtonMode: String(merged.wallButtonMode || "").trim() === "single" ? "single" : "dual",
      windowWidth: integerOr(merged.windowWidth, DEFAULT_APP_SETTINGS.windowWidth),
      windowHeight: integerOr(merged.windowHeight, DEFAULT_APP_SETTINGS.windowHeight),
      masterGain: numberOr(merged.masterGain, DEFAULT_APP_SETTINGS.masterGain),
      defaultAttackMs: integerOr(
        merged.defaultAttackMs,
        DEFAULT_APP_SETTINGS.defaultAttackMs,
      ),
      defaultReleaseMs: integerOr(
        merged.defaultReleaseMs,
        DEFAULT_APP_SETTINGS.defaultReleaseMs,
      ),
      preloadAudio: merged.preloadAudio !== false,
      inputInteractionsEnabled: Boolean(merged.inputInteractionsEnabled),
      controllerMappingEnabled: Boolean(merged.controllerMappingEnabled),
      showInputBadges: merged.showInputBadges !== false,
      guessingIdleTimeoutSec: Math.max(
        5,
        integerOr(merged.guessingIdleTimeoutSec, DEFAULT_APP_SETTINGS.guessingIdleTimeoutSec),
      ),
      guessingSuccessChimeEnabled: merged.guessingSuccessChimeEnabled !== false,
      controllerVisualLayout: normalizeControllerVisualLayout(merged.controllerVisualLayout),
      inputBindings: normalizeInputBindings(merged.inputBindings),
    },
    APP_SETTINGS_ORDER,
  );
}

function inferClipKind(rawClip, fallbackKind = "sound") {
  const probe = `${rawClip.kind || ""} ${rawClip.id || ""} ${rawClip.label || ""} ${rawClip.file || ""} ${rawClip.summary || ""} ${rawClip.performerName || ""}`
    .toLowerCase();
  if (probe.includes("fact") || probe.includes("about") || probe.includes("narrat")) {
    return "facts";
  }
  if (probe.includes("sound") || probe.includes("call")) {
    return "sound";
  }
  return fallbackKind;
}

function createDefaultAboutSettings(displayName) {
  return {
    ...DEFAULT_ABOUT_SETTINGS,
    animalName: displayName || DEFAULT_ABOUT_SETTINGS.animalName,
  };
}

function buildDefaultAboutBody(aboutSettings) {
  const factLines = normalizeStringArray(aboutSettings.keyFacts, []);
  const scienceLines = normalizeStringArray(aboutSettings.scienceHighlights, []);

  return [
    `${aboutSettings.animalName} is featured in this museum display.`,
    factLines[0] || "",
    factLines[1] || "",
    scienceLines[0] || "",
    aboutSettings.curiousQuestionAge8To13 || "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildDefaultSoundClip(folderName, displayName) {
  return {
    ...DEFAULT_CLIP_SETTINGS,
    id: "sound",
    kind: "sound",
    visible: true,
    label: `${shortAnimalLabel(displayName)} Sounds`,
    file: `audio/${folderName}-call.mp3`,
    performerName: "Field recording",
    summary: "Primary animal sound effect.",
    loopWhileHeld: true,
  };
}

function buildDefaultFactsClip(folderName) {
  return {
    ...DEFAULT_CLIP_SETTINGS,
    id: "facts",
    kind: "facts",
    visible: false,
    label: "Creature Facts",
    file: `audio/${folderName}-creature-facts.mp3`,
    performerName: "Museum Guest",
    summary: "Spoken museum facts for this animal.",
    loopWhileHeld: false,
  };
}

function normalizeClip(rawClip, folderName, fallbackLabel) {
  const kind = inferClipKind(rawClip, rawClip.kind || "sound");
  const defaults =
    kind === "facts"
      ? buildDefaultFactsClip(folderName)
      : buildDefaultSoundClip(folderName, fallbackLabel);
  const candidateId = rawClip.id || kind;
  const clipId = slugify(candidateId) || kind;
  const requestedLabel = String(rawClip.label || defaults.label).trim();
  const shouldUseAutoSoundLabel =
    !requestedLabel ||
    /^hear\b/i.test(requestedLabel) ||
    requestedLabel === "Animal Sounds" ||
    requestedLabel === defaults.label;
  const normalizedLabel =
    kind === "facts"
      ? "Creature Facts"
      : shouldUseAutoSoundLabel
        ? `${shortAnimalLabel(fallbackLabel)} Sounds`
        : requestedLabel || defaults.label;
  const normalizedPerformerName = String(rawClip.performerName || defaults.performerName).trim();

  return orderFields(
    {
      id: clipId,
      kind,
      visible: rawClip.visible !== false,
      label: normalizedLabel,
      file: toPosixPath(rawClip.file || defaults.file),
      performerName:
        kind === "facts" ? normalizedPerformerName || "Museum Guest" : normalizedPerformerName,
      summary: String(rawClip.summary || defaults.summary).trim(),
      gain: numberOr(rawClip.gain, defaults.gain),
      attackMs: integerOr(rawClip.attackMs, defaults.attackMs),
      releaseMs: integerOr(rawClip.releaseMs, defaults.releaseMs),
      startAtSec: numberOr(rawClip.startAtSec, defaults.startAtSec),
      endAtSec: numberOr(rawClip.endAtSec, defaults.endAtSec),
      loopWhileHeld:
        rawClip.loopWhileHeld === undefined ? defaults.loopWhileHeld : rawClip.loopWhileHeld !== false,
    },
    CLIP_SETTINGS_ORDER,
  );
}

function createLegacyClip(rawData, folderName) {
  return normalizeClip(
    {
      id: "sound",
      kind: "sound",
      visible: true,
      label:
        rawData.buttonLabel || `${shortAnimalLabel(rawData.displayName || titleFromSlug(folderName))} Sounds`,
      file: rawData.soundFile || `audio/${folderName}-sound.mp3`,
      performerName: "",
      summary: "Primary animal sound effect.",
      gain: rawData.gain,
      attackMs: rawData.attackMs,
      releaseMs: rawData.releaseMs,
      startAtSec: rawData.startAtSec,
      endAtSec: rawData.endAtSec,
      loopWhileHeld: rawData.loopWhileHeld,
    },
    folderName,
    rawData.displayName || titleFromSlug(folderName),
  );
}

function normalizeAudioClips(rawData, folderName, displayName) {
  const sourceClips =
    Array.isArray(rawData.audioClips) && rawData.audioClips.length > 0
      ? rawData.audioClips
      : [createLegacyClip(rawData, folderName)];
  const normalized = sourceClips.map((clip) => normalizeClip(clip, folderName, displayName));
  const hasSound = normalized.some((clip) => clip.kind === "sound");
  const hasFacts = normalized.some((clip) => clip.kind === "facts");

  if (!hasSound) {
    normalized.unshift(buildDefaultSoundClip(folderName, displayName));
  }

  if (!hasFacts) {
    normalized.push(buildDefaultFactsClip(folderName));
  }

  return normalized;
}

function normalizeAnimalSettings(rawData, folderName) {
  const merged = { ...DEFAULT_ANIMAL_SETTINGS, ...rawData };
  const displayName = String(merged.displayName || titleFromSlug(folderName)).trim();

  return orderFields(
    {
      id: String(merged.id || folderName).trim() || folderName,
      sortOrder: integerOr(merged.sortOrder, DEFAULT_ANIMAL_SETTINGS.sortOrder),
      displayName,
      tagline: String(merged.tagline || DEFAULT_ANIMAL_SETTINGS.tagline).trim(),
      accentColor: String(merged.accentColor || DEFAULT_ANIMAL_SETTINGS.accentColor).trim(),
      imageFile: toPosixPath(merged.imageFile || `${folderName}.image.jpg`),
      aboutFile: toPosixPath(merged.aboutFile || `${folderName}.about.md`),
      videoFile: toPosixPath(merged.videoFile || ""),
      videoUrl: String(merged.videoUrl || "").trim(),
      enabled: merged.enabled !== false,
      cropPosition: String(merged.cropPosition || DEFAULT_ANIMAL_SETTINGS.cropPosition).trim(),
      guestRecorderEnabled: merged.guestRecorderEnabled !== false,
      guestRecorderLabel: String(
        merged.guestRecorderLabel || DEFAULT_ANIMAL_SETTINGS.guestRecorderLabel,
      ).trim(),
      audioClips: normalizeAudioClips(rawData, folderName, displayName),
    },
    ANIMAL_SETTINGS_ORDER,
  );
}

function normalizeAboutSettings(rawData, displayName) {
  const defaults = createDefaultAboutSettings(displayName);
  const merged = { ...defaults, ...rawData };
  const legacyQuestion = String(merged.curiousQuestion || "").trim();

  return orderFields(
    {
      animalName: String(merged.animalName || defaults.animalName).trim(),
      scientificName: String(merged.scientificName || defaults.scientificName).trim(),
      scientificPronunciation: String(
        merged.scientificPronunciation || defaults.scientificPronunciation,
      ).trim(),
      keyFacts: normalizeStringArray(merged.keyFacts, defaults.keyFacts),
      scienceHighlights: normalizeStringArray(
        merged.scienceHighlights,
        defaults.scienceHighlights,
      ),
      curiousQuestionAge3To5: String(
        merged.curiousQuestionAge3To5 || defaults.curiousQuestionAge3To5,
      ).trim(),
      curiousQuestionAge5To8: String(
        merged.curiousQuestionAge5To8 || defaults.curiousQuestionAge5To8,
      ).trim(),
      curiousQuestionAge8To13: String(
        merged.curiousQuestionAge8To13 || legacyQuestion || defaults.curiousQuestionAge8To13,
      ).trim(),
    },
    ABOUT_SETTINGS_ORDER,
  );
}

function resolveInsideFolder(folderPath, relativePath) {
  const normalizedRelative = toPosixPath(relativePath);
  const absolutePath = path.resolve(folderPath, normalizedRelative);
  const absoluteRoot = path.resolve(folderPath);

  if (
    absolutePath !== absoluteRoot &&
    !absolutePath.startsWith(`${absoluteRoot}${path.sep}`)
  ) {
    throw new Error(`Path escapes animal folder: ${relativePath}`);
  }

  return absolutePath;
}

function relativeFromFolder(folderPath, absolutePath) {
  return toPosixPath(path.relative(folderPath, absolutePath));
}

async function findAnimalConfigPath(folderName) {
  const folderPath = path.join(ANIMALS_DIR, folderName);
  const expectedPath = path.join(folderPath, `${folderName}.animal.md`);
  if (await exists(expectedPath)) {
    return expectedPath;
  }

  const legacyPath = path.join(folderPath, "animal.md");
  if (await exists(legacyPath)) {
    return legacyPath;
  }

  const entries = await fsPromises.readdir(folderPath, { withFileTypes: true });
  const discovered = entries.find(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".animal.md"),
  );

  return discovered ? path.join(folderPath, discovered.name) : expectedPath;
}

async function findAboutPath(folderName, configuredRelativePath) {
  const folderPath = path.join(ANIMALS_DIR, folderName);
  const configuredPath = resolveInsideFolder(
    folderPath,
    configuredRelativePath || `${folderName}.about.md`,
  );
  if (await exists(configuredPath)) {
    return configuredPath;
  }

  const entries = await fsPromises.readdir(folderPath, { withFileTypes: true });
  const discovered = entries.find(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".about.md"),
  );

  return discovered ? path.join(folderPath, discovered.name) : configuredPath;
}

async function findImageRelative(folderName, configuredRelativePath) {
  const folderPath = path.join(ANIMALS_DIR, folderName);
  const configuredPath = resolveInsideFolder(
    folderPath,
    configuredRelativePath || `${folderName}.image.jpg`,
  );
  if (await exists(configuredPath)) {
    return relativeFromFolder(folderPath, configuredPath);
  }

  const entries = await fsPromises.readdir(folderPath, { withFileTypes: true });
  const discovered = entries.find((entry) => {
    if (!entry.isFile()) {
      return false;
    }
    return IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
  });

  return discovered
    ? relativeFromFolder(folderPath, path.join(folderPath, discovered.name))
    : toPosixPath(configuredRelativePath || `${folderName}.image.jpg`);
}

async function findVideoRelative(folderName, configuredRelativePath) {
  const folderPath = path.join(ANIMALS_DIR, folderName);
  const requestedRelative = toPosixPath(configuredRelativePath || "");

  if (requestedRelative) {
    const configuredPath = resolveInsideFolder(folderPath, requestedRelative);
    if (await exists(configuredPath)) {
      return relativeFromFolder(folderPath, configuredPath);
    }
  }

  const files = await walkFiles(folderPath);
  const discovered = files.find((relativePath) => {
    const extension = path.extname(relativePath).toLowerCase();
    const lowerPath = relativePath.toLowerCase();
    return (
      VIDEO_EXTENSIONS.has(extension) &&
      (lowerPath.startsWith("video/") || lowerPath.includes("-hero") || lowerPath.includes("video"))
    );
  });

  return discovered || requestedRelative;
}

async function walkFiles(folderPath, currentPath = folderPath, results = []) {
  const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith("_")) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name.toLowerCase() === "archive" ||
        entry.name.toLowerCase() === "guest-recordings"
      ) {
        continue;
      }
      await walkFiles(folderPath, absolutePath, results);
      continue;
    }

    results.push(relativeFromFolder(folderPath, absolutePath));
  }

  return results;
}

async function discoverAudioRelativePaths(folderName) {
  const folderPath = path.join(ANIMALS_DIR, folderName);
  const files = await walkFiles(folderPath);
  return files
    .filter((relativePath) =>
      AUDIO_EXTENSIONS.has(path.extname(relativePath).toLowerCase()),
    )
    .sort((left, right) => left.localeCompare(right));
}

function labelFromDiscoveredFile(relativePath, folderName, displayName) {
  const basename = path.parse(relativePath).name;
  const withoutPrefix = basename.startsWith(`${folderName}-`)
    ? basename.slice(folderName.length + 1)
    : basename;

  if (
    withoutPrefix === "call" ||
    withoutPrefix === "sound" ||
    withoutPrefix.includes("animal-sound")
  ) {
    return `${shortAnimalLabel(displayName)} Sounds`;
  }

  if (
    withoutPrefix.includes("about") ||
    withoutPrefix.includes("fact") ||
    withoutPrefix.includes("narrat")
  ) {
    return "Creature Facts";
  }

  return titleFromSlug(withoutPrefix);
}

function mergeDiscoveredAudioClips(configuredClips, discoveredRelativePaths, folderName, displayName) {
  const knownFiles = new Set(configuredClips.map((clip) => toPosixPath(clip.file)));
  const extraClips = discoveredRelativePaths
    .filter((relativePath) => !knownFiles.has(relativePath))
    .map((relativePath) =>
      normalizeClip(
        {
          id: slugify(path.parse(relativePath).name),
          label: labelFromDiscoveredFile(relativePath, folderName, displayName),
          file: relativePath,
          performerName: "",
          summary: "Discovered audio file. Open the gear menu to label and tune it.",
          loopWhileHeld: false,
        },
        folderName,
        labelFromDiscoveredFile(relativePath, folderName, displayName),
      ),
    );

  return [...configuredClips, ...extraClips];
}

function resolveAnimalRecord(folderName, configPath, config, body, aboutPath, aboutSettings, aboutBody) {
  const folderPath = path.join(ANIMALS_DIR, folderName);
  const imagePath = resolveInsideFolder(folderPath, config.imageFile);
  const videoPath = config.videoFile
    ? resolveInsideFolder(folderPath, config.videoFile)
    : "";
  const externalVideoUrl = String(config.videoUrl || "").trim();

  return {
    ...config,
    folderName,
    folderPath,
    configPath,
    aboutPath,
    imagePath,
    imageUrl: pathToFileURL(imagePath).href,
    videoPath,
    videoMediaUrl: videoPath && fs.existsSync(videoPath) ? pathToFileURL(videoPath).href : "",
    videoExternalUrl: externalVideoUrl,
    videoEmbedUrl: toYouTubeEmbedUrl(externalVideoUrl),
    body,
    about: aboutSettings,
    aboutBody,
    audioClips: config.audioClips.map((clip) => {
      const clipPath = resolveInsideFolder(folderPath, clip.file);
      return {
        ...clip,
        path: clipPath,
        url: pathToFileURL(clipPath).href,
      };
    }),
  };
}

function toYouTubeEmbedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      const videoId =
        parsed.searchParams.get("v") ||
        parsed.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : "";
    }
  } catch {
    return "";
  }

  return "";
}

async function readAppSettings() {
  const { data, body } = await readMarkdownConfig(APP_SETTINGS_PATH, DEFAULT_APP_SETTINGS);
  return {
    data: normalizeAppSettings(data),
    body,
    path: APP_SETTINGS_PATH,
  };
}

async function readAnimals() {
  const entries = await fsPromises.readdir(ANIMALS_DIR, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name);

  const animals = [];

  for (const folderName of folders) {
    const folderPath = path.join(ANIMALS_DIR, folderName);

    try {
      const configPath = await findAnimalConfigPath(folderName);
      if (!(await exists(configPath))) {
        throw new Error(`Missing ${folderName}.animal.md`);
      }

      const parsed = await readMarkdownConfig(configPath, DEFAULT_ANIMAL_SETTINGS);
      const config = normalizeAnimalSettings(parsed.data, folderName);
      config.imageFile = await findImageRelative(folderName, config.imageFile);
      config.videoFile = await findVideoRelative(folderName, config.videoFile);

      const aboutPath = await findAboutPath(folderName, config.aboutFile);
      let aboutSettings = createDefaultAboutSettings(config.displayName);
      let aboutBody = buildDefaultAboutBody(aboutSettings);

      if (await exists(aboutPath)) {
        const aboutParsed = await readMarkdownConfig(aboutPath, aboutSettings);
        aboutSettings = normalizeAboutSettings(aboutParsed.data, config.displayName);
        aboutBody = aboutParsed.body || buildDefaultAboutBody(aboutSettings);
      }

      config.aboutFile = relativeFromFolder(folderPath, aboutPath);
      config.audioClips = mergeDiscoveredAudioClips(
        config.audioClips,
        await discoverAudioRelativePaths(folderName),
        folderName,
        config.displayName,
      );

      animals.push(
        resolveAnimalRecord(
          folderName,
          configPath,
          config,
          parsed.body,
          aboutPath,
          aboutSettings,
          aboutBody,
        ),
      );
    } catch (error) {
      const fallbackConfig = normalizeAnimalSettings(
        {
          id: folderName,
          displayName: titleFromSlug(folderName),
          imageFile: await findImageRelative(folderName, `${folderName}.image.jpg`),
          videoFile: await findVideoRelative(folderName, ""),
          audioClips: [],
        },
        folderName,
      );

      fallbackConfig.audioClips = mergeDiscoveredAudioClips(
        fallbackConfig.audioClips,
        await discoverAudioRelativePaths(folderName),
        folderName,
        fallbackConfig.displayName,
      );

      const fallbackAbout = createDefaultAboutSettings(fallbackConfig.displayName);
      const fallbackAboutPath = path.join(folderPath, `${folderName}.about.md`);

      animals.push({
        ...resolveAnimalRecord(
          folderName,
          path.join(folderPath, `${folderName}.animal.md`),
          fallbackConfig,
          "",
          fallbackAboutPath,
          fallbackAbout,
          buildDefaultAboutBody(fallbackAbout),
        ),
        loadError: error.message,
      });
    }
  }

  return animals.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.displayName.localeCompare(right.displayName);
  });
}

async function loadAppData() {
  const [settings, animals] = await Promise.all([readAppSettings(), readAnimals()]);
  return {
    settings: settings.data,
    settingsBody: settings.body,
    settingsPath: settings.path,
    animals,
    animalsRoot: ANIMALS_DIR,
    templatePaths: {
      animalConfig: ANIMAL_TEMPLATE_PATH,
      about: ABOUT_TEMPLATE_PATH,
    },
  };
}

async function saveAppSettings(nextSettings, nextBody = "") {
  const ordered = normalizeAppSettings(nextSettings);
  const output = matter.stringify(trimDocumentBody(nextBody), ordered);
  await fsPromises.writeFile(APP_SETTINGS_PATH, output, "utf8");
  return loadAppData();
}

function normalizeAnimalDraft(folderName, draft) {
  const settings = normalizeAnimalSettings(draft.settings || draft, folderName);
  const aboutSettings = normalizeAboutSettings(draft.aboutSettings || {}, settings.displayName);
  const aboutBody = draft.aboutBody || buildDefaultAboutBody(aboutSettings);

  return {
    settings,
    body: String(draft.body || "").trim(),
    aboutSettings,
    aboutBody: String(aboutBody).trim(),
  };
}

async function saveAnimalBundle(folderName, draft) {
  const folderPath = path.join(ANIMALS_DIR, folderName);
  const normalized = normalizeAnimalDraft(folderName, draft);

  await fsPromises.mkdir(folderPath, { recursive: true });

  const configPath = path.join(folderPath, `${folderName}.animal.md`);
  const aboutPath = resolveInsideFolder(folderPath, normalized.settings.aboutFile);

  normalized.settings.imageFile = toPosixPath(normalized.settings.imageFile);
  normalized.settings.aboutFile = relativeFromFolder(folderPath, aboutPath);
  normalized.settings.audioClips = normalized.settings.audioClips.map((clip) =>
    orderFields(clip, CLIP_SETTINGS_ORDER),
  );

  const configOutput = matter.stringify(
    trimDocumentBody(normalized.body),
    orderFields(normalized.settings, ANIMAL_SETTINGS_ORDER),
  );
  const aboutOutput = matter.stringify(
    trimDocumentBody(normalized.aboutBody),
    orderFields(normalized.aboutSettings, ABOUT_SETTINGS_ORDER),
  );

  await fsPromises.mkdir(path.dirname(aboutPath), { recursive: true });
  await fsPromises.writeFile(configPath, configOutput, "utf8");
  await fsPromises.writeFile(aboutPath, aboutOutput, "utf8");

  return loadAppData();
}

function upsertClip(settings, clipId, seed = {}) {
  const normalizedId = slugify(clipId || seed.id || seed.label || "clip") || "clip";
  const existingClip = settings.audioClips.find((clip) => clip.id === normalizedId);

  if (existingClip) {
    return existingClip;
  }

  const createdClip = normalizeClip(
    {
      id: normalizedId,
      ...seed,
    },
    slugify(settings.id || settings.displayName) || "animal",
    seed.label || "New Audio",
  );
  settings.audioClips.push(createdClip);
  return createdClip;
}

function extensionFromMimeType(mimeType, fallbackExtension = ".webm") {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized.includes("mpeg") || normalized.includes("mp3")) {
    return ".mp3";
  }
  if (normalized.includes("wav")) {
    return ".wav";
  }
  if (normalized.includes("ogg")) {
    return ".ogg";
  }
  if (normalized.includes("m4a") || normalized.includes("mp4")) {
    return ".m4a";
  }
  if (normalized.includes("webm")) {
    return ".webm";
  }
  return fallbackExtension;
}

function extensionFromContainer(container, fallbackExtension = ".webm") {
  const normalized = String(container || "").toLowerCase();
  if (!normalized) {
    return fallbackExtension;
  }

  return normalized.startsWith(".") ? normalized : `.${normalized}`;
}

function timestampStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}${second}`;
}

function isoTimestamp() {
  return new Date().toISOString();
}

async function archiveExistingFile(folderPath, relativePath) {
  if (!relativePath) {
    return;
  }

  const absolutePath = resolveInsideFolder(folderPath, relativePath);
  if (!(await exists(absolutePath))) {
    return;
  }

  const archiveDir = path.join(folderPath, "archive");
  await fsPromises.mkdir(archiveDir, { recursive: true });

  const extension = path.extname(absolutePath);
  const basename = path.basename(absolutePath, extension);
  const archivePath = path.join(
    archiveDir,
    `${basename}-archived-${timestampStamp()}${extension}`,
  );

  await fsPromises.rename(absolutePath, archivePath);
}

async function writeBinaryRelative(folderPath, relativePath, bytes) {
  const absolutePath = resolveInsideFolder(folderPath, relativePath);
  await fsPromises.mkdir(path.dirname(absolutePath), { recursive: true });
  await fsPromises.writeFile(absolutePath, Buffer.from(bytes));
}

async function appendGuestRecordingLog(folderPath, entry) {
  const guestDir = path.join(folderPath, "guest-recordings");
  const logPath = path.join(guestDir, "guest-recordings-log.jsonl");
  await fsPromises.mkdir(guestDir, { recursive: true });
  await fsPromises.appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
}

async function importAudioClip(payload) {
  const folderPath = path.join(ANIMALS_DIR, payload.folderName);
  const normalized = normalizeAnimalDraft(payload.folderName, payload.animalDraft);
  const clip = upsertClip(normalized.settings, payload.clipId, {
    label: payload.label || "Creature Facts",
  });

  const importedExtension =
    path.extname(String(payload.originalName || "")).toLowerCase() || ".mp3";
  const destinationRelative = toPosixPath(
    `audio/${payload.folderName}-${slugify(clip.id || clip.label || "clip")}${importedExtension}`,
  );

  await archiveExistingFile(folderPath, clip.file);
  await writeBinaryRelative(folderPath, destinationRelative, payload.bytes);

  clip.file = destinationRelative;

  return saveAnimalBundle(payload.folderName, normalized);
}

async function importVideoFile(payload) {
  const folderPath = path.join(ANIMALS_DIR, payload.folderName);
  const normalized = normalizeAnimalDraft(payload.folderName, payload.animalDraft);
  const importedExtension =
    path.extname(String(payload.originalName || "")).toLowerCase() || ".mp4";
  const destinationRelative = toPosixPath(
    `video/${payload.folderName}-hero${importedExtension}`,
  );

  await archiveExistingFile(folderPath, normalized.settings.videoFile);
  await writeBinaryRelative(folderPath, destinationRelative, payload.bytes);
  normalized.settings.videoFile = destinationRelative;

  return saveAnimalBundle(payload.folderName, normalized);
}

async function importAudioClipFromYouTube(payload) {
  if (!payload?.url || !ytdl.validateURL(payload.url)) {
    throw new Error("Enter a valid YouTube link.");
  }

  const folderPath = path.join(ANIMALS_DIR, payload.folderName);
  const normalized = normalizeAnimalDraft(payload.folderName, payload.animalDraft);
  const clip = upsertClip(normalized.settings, payload.clipId, {
    label: payload.label || "Creature Facts",
  });

  const info = await ytdl.getInfo(payload.url);
  const format = ytdl.chooseFormat(info.formats, {
    quality: "highestaudio",
    filter: "audioonly",
  });

  if (!format?.url) {
    throw new Error("Could not find an audio stream for that YouTube video.");
  }

  const destinationRelative = toPosixPath(
    `audio/${payload.folderName}-${slugify(clip.id || clip.label || "clip")}${extensionFromContainer(
      format.container,
      extensionFromMimeType(format.mimeType, ".webm"),
    )}`,
  );
  const destinationPath = resolveInsideFolder(folderPath, destinationRelative);

  await archiveExistingFile(folderPath, clip.file);
  await fsPromises.mkdir(path.dirname(destinationPath), { recursive: true });
  await pipeline(
    ytdl.downloadFromInfo(info, { format }),
    fs.createWriteStream(destinationPath),
  );

  clip.file = destinationRelative;
  clip.summary = `Imported from YouTube: ${info.videoDetails.title}`;

  return saveAnimalBundle(payload.folderName, normalized);
}

async function saveRecordedClip(sessionPayload, recordingPayload) {
  const folderPath = path.join(ANIMALS_DIR, sessionPayload.folderName);
  const narratorName = String(recordingPayload.narratorName || "").trim() || "Museum Guest";

  if (sessionPayload.mode === "guest-copy") {
    const destinationRelative = toPosixPath(
      `guest-recordings/${sessionPayload.folderName}-${slugify(
        sessionPayload.referenceLabel || "sound-copy",
      )}-from-${slugify(narratorName)}-${timestampStamp()}${extensionFromMimeType(
        recordingPayload.mimeType,
      )}`,
    );

    await writeBinaryRelative(folderPath, destinationRelative, recordingPayload.bytes);
    await appendGuestRecordingLog(folderPath, {
      recordedAt: isoTimestamp(),
      animalFolder: sessionPayload.folderName,
      animalName:
        sessionPayload.animalDraft?.aboutSettings?.animalName ||
        sessionPayload.animalDraft?.settings?.displayName ||
        titleFromSlug(sessionPayload.folderName),
      guestName: narratorName,
      referenceClipId: sessionPayload.referenceClipId || "sound",
      referenceLabel: sessionPayload.referenceLabel || "Sound Copy",
      mode: "guest-copy",
      savedFile: destinationRelative,
    });

    return { savedFile: destinationRelative };
  }

  const normalized = normalizeAnimalDraft(sessionPayload.folderName, sessionPayload.animalDraft);
  const clip = upsertClip(normalized.settings, sessionPayload.clipId, sessionPayload.clipDraft);
  const destinationRelative = toPosixPath(
    `audio/${sessionPayload.folderName}-${slugify(
      clip.label || clip.id || "clip",
    )}-read-by-${slugify(narratorName)}-${timestampStamp()}${extensionFromMimeType(
      recordingPayload.mimeType,
    )}`,
  );

  await archiveExistingFile(folderPath, clip.file);
  await writeBinaryRelative(folderPath, destinationRelative, recordingPayload.bytes);

  clip.file = destinationRelative;
  clip.performerName = narratorName;
  clip.summary = clip.summary || "Narrated museum facts clip.";
  clip.loopWhileHeld = false;
  await saveAnimalBundle(sessionPayload.folderName, normalized);

  return { savedFile: destinationRelative };
}

async function readBinaryFile(filePath) {
  const buffer = await fsPromises.readFile(filePath);
  return new Uint8Array(buffer);
}

module.exports = {
  ROOT_DIR,
  ANIMALS_DIR,
  APP_SETTINGS_PATH,
  DEFAULT_APP_SETTINGS,
  DEFAULT_ANIMAL_SETTINGS,
  DEFAULT_ABOUT_SETTINGS,
  loadAppData,
  saveAppSettings,
  saveAnimalBundle,
  importAudioClip,
  importAudioClipFromYouTube,
  importVideoFile,
  saveRecordedClip,
  readBinaryFile,
};
