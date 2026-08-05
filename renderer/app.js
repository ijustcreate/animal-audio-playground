const GEAR_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.32 7.32 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.58-.22 1.13-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"/>
  </svg>
`;

const DEFAULT_CLIP = {
  id: "new-audio",
  label: "New Audio",
  file: "",
  performerName: "",
  summary: "",
  gain: 1,
  attackMs: 80,
  releaseMs: 520,
  startAtSec: 0,
  endAtSec: 0,
  loopWhileHeld: false,
};

const state = {
  settings: null,
  settingsBody: "",
  settingsPath: "",
  animals: [],
  animalsRoot: "",
  templatePaths: null,
  audioContext: null,
  masterGainNode: null,
  bufferCache: new Map(),
  activeVoices: new Set(),
  holdByKey: new Map(),
  activeCounts: new Map(),
  settingsOpen: false,
  animalEditorOpen: false,
  editingAnimalFolder: "",
  statusTimerId: 0,
  pendingImportClipId: "",
};

const els = {
  headerSubtitle: document.querySelector("#header-subtitle"),
  headerTitle: document.querySelector("#header-title"),
  statusText: document.querySelector("#status-text"),
  animalRow: document.querySelector("#animal-row"),
  scrim: document.querySelector("#scrim"),
  settingsToggle: document.querySelector("#settings-toggle"),
  settingsPanel: document.querySelector("#settings-panel"),
  settingsClose: document.querySelector("#settings-close"),
  appSettingsForm: document.querySelector("#app-settings-form"),
  saveAppSettings: document.querySelector("#save-app-settings"),
  reloadLibrary: document.querySelector("#reload-library"),
  openAnimalsFolder: document.querySelector("#open-animals-folder"),
  openAppSettingsFile: document.querySelector("#open-app-settings-file"),
  animalEditor: document.querySelector("#animal-editor"),
  animalEditorTitle: document.querySelector("#animal-editor-title"),
  animalEditorClose: document.querySelector("#animal-editor-close"),
  animalForm: document.querySelector("#animal-form"),
  audioClipsList: document.querySelector("#audio-clips-list"),
  addAudioClip: document.querySelector("#add-audio-clip"),
  audioImportInput: document.querySelector("#audio-import-input"),
  revealAnimalFolder: document.querySelector("#reveal-animal-folder"),
  saveAnimalSettings: document.querySelector("#save-animal-settings"),
};

bootstrap().catch((error) => {
  console.error(error);
  setStatus("The desktop app could not finish loading.", 0);
});

async function bootstrap() {
  wireChromeEvents();
  window.desktopApi.onContentChanged((payload) => {
    void reloadFromDisk({
      announce:
        payload?.reason === "recording-saved"
          ? "Recorded narration saved."
          : "Content updated from another window.",
    });
  });
  await reloadFromDisk();
}

function wireChromeEvents() {
  els.settingsToggle.addEventListener("click", () => setSettingsOpen(true));
  els.settingsClose.addEventListener("click", () => setSettingsOpen(false));
  els.scrim.addEventListener("click", () => closePanels());

  els.saveAppSettings.addEventListener("click", () => {
    void saveAppSettings();
  });
  els.reloadLibrary.addEventListener("click", () => {
    void reloadFromDisk({ announce: "Animal library reloaded from disk." });
  });
  els.openAnimalsFolder.addEventListener("click", () => {
    void window.desktopApi.openAnimalsFolder();
  });
  els.openAppSettingsFile.addEventListener("click", () => {
    void window.desktopApi.revealAppSettings();
  });

  els.animalEditorClose.addEventListener("click", () => setAnimalEditorOpen(false));
  els.revealAnimalFolder.addEventListener("click", () => {
    if (state.editingAnimalFolder) {
      void window.desktopApi.revealAnimalFolder(state.editingAnimalFolder);
    }
  });
  els.saveAnimalSettings.addEventListener("click", () => {
    void saveAnimalSettings();
  });
  els.addAudioClip.addEventListener("click", () => addClipEditorCard());
  els.audioImportInput.addEventListener("change", () => {
    void handleAudioImportSelection();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanels();
    }
  });

  window.addEventListener("blur", () => releaseAllVoices());
  window.addEventListener("pagehide", () => releaseAllVoices());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      releaseAllVoices();
    }
  });
}

async function reloadFromDisk(options = {}) {
  releaseAllVoices();
  setStatus("Loading animal library...");

  const payload = await window.desktopApi.loadAppData();
  applyLoadedData(payload);

  if (options.announce) {
    setStatus(options.announce, 2200);
  } else {
    syncStatus();
  }
}

function applyLoadedData(payload) {
  state.settings = payload.settings;
  state.settingsBody = payload.settingsBody || "";
  state.settingsPath = payload.settingsPath || "";
  state.animalsRoot = payload.animalsRoot || "";
  state.templatePaths = payload.templatePaths || null;
  state.animals = Array.isArray(payload.animals) ? payload.animals : [];
  state.bufferCache = new Map();

  renderChrome();
  renderAnimals();
  syncSettingsForm();

  if (state.settings?.preloadAudio) {
    void warmAudioBuffers();
  }

  if (state.animalEditorOpen && state.editingAnimalFolder) {
    const animal = findAnimal(state.editingAnimalFolder);
    if (animal) {
      syncAnimalForm(animal);
    } else {
      setAnimalEditorOpen(false);
    }
  }
}

function renderChrome() {
  const settings = state.settings || {};
  document.title = settings.windowTitle || "Museum Animal Sound Wall";
  els.headerSubtitle.textContent = settings.headerSubtitle || "Interactive Museum Display";
  els.headerTitle.textContent = settings.headerTitle || "Press And Hold To Hear The Animal";
  syncMasterGain();
}

function renderAnimals() {
  els.animalRow.replaceChildren();

  const animals = state.animals.filter((animal) => animal.enabled !== false);
  if (animals.length === 0) {
    els.animalRow.appendChild(buildEmptyState());
    return;
  }

  animals.forEach((animal) => {
    const card = document.createElement("article");
    card.className = "animal-card";
    card.dataset.folderName = animal.folderName;
    card.style.setProperty("--accent", animal.accentColor || "#78d7cc");
    if ((state.activeCounts.get(animal.folderName) || 0) > 0) {
      card.classList.add("is-active");
    }

    const imagePanel = document.createElement("div");
    imagePanel.className = "image-panel";

    const image = document.createElement("img");
    image.className = "animal-image";
    image.src = animal.imageUrl;
    image.alt = animal.displayName || animal.folderName;
    image.draggable = false;
    image.style.objectPosition = animal.cropPosition || "center center";
    imagePanel.appendChild(image);

    const shade = document.createElement("div");
    shade.className = "image-shade";
    imagePanel.appendChild(shade);

    const gearButton = document.createElement("button");
    gearButton.className = "gear-button";
    gearButton.type = "button";
    gearButton.setAttribute("aria-label", `Edit ${animal.displayName || animal.folderName} settings`);
    gearButton.innerHTML = GEAR_ICON;
    gearButton.addEventListener("click", () => openAnimalEditor(animal.folderName));
    imagePanel.appendChild(gearButton);

    const meta = document.createElement("div");
    meta.className = "animal-meta";

    const name = document.createElement("h2");
    name.className = "animal-name";
    name.textContent = animal.displayName || animal.folderName;
    meta.appendChild(name);

    const tagline = document.createElement("p");
    tagline.className = "animal-tagline";
    tagline.textContent = animal.loadError
      ? `Config warning: ${animal.loadError}`
      : animal.tagline || "Hold the button to hear the animal.";
    meta.appendChild(tagline);

    const clipStack = document.createElement("div");
    clipStack.className = "clip-stack";

    animal.audioClips.forEach((clip) => {
      const holdButton = document.createElement("button");
      holdButton.className = "plastic-button clip-button";
      holdButton.type = "button";
      holdButton.dataset.clipKey = clipKey(animal.folderName, clip.id);
      holdButton.disabled = Boolean(animal.loadError);

      const label = document.createElement("span");
      label.className = "clip-button-label";
      label.textContent = clip.label || "Play";

      const metaText = document.createElement("span");
      metaText.className = "clip-button-meta";
      metaText.textContent = clip.performerName || clip.summary || "Press and hold";

      holdButton.append(label, metaText);
      wireHoldEvents(holdButton, animal, clip);
      clipStack.appendChild(holdButton);
    });

    card.append(imagePanel, meta, clipStack);
    els.animalRow.appendChild(card);
  });
}

function buildEmptyState() {
  const shell = document.createElement("section");
  shell.className = "empty-state";

  const title = document.createElement("h2");
  title.textContent = "No animals are available yet.";

  const body = document.createElement("p");
  body.textContent =
    "Create a new folder inside animals, add the named animal config and about files, the animal image, and audio clips in the audio folder, then reload from the Settings menu.";

  shell.append(title, body);
  return shell;
}

function findAnimal(folderName) {
  return state.animals.find((animal) => animal.folderName === folderName) || null;
}

function clipKey(folderName, clipId) {
  return `${folderName}:${clipId}`;
}

function wireHoldEvents(button, animal, clip) {
  button.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    const nextClipKey = clipKey(animal.folderName, clip.id);
    const holdKey = `pointer:${nextClipKey}:${event.pointerId}`;
    if (state.holdByKey.has(holdKey)) {
      return;
    }

    if (typeof button.setPointerCapture === "function") {
      button.setPointerCapture(event.pointerId);
    }

    state.holdByKey.set(holdKey, {
      button,
      folderName: animal.folderName,
      clipKey: nextClipKey,
      voice: null,
    });
    syncHeldVisual(nextClipKey);
    void beginHold(holdKey, animal, clip);
  });

  const releasePointer = (event) => {
    const holdKey = `pointer:${clipKey(animal.folderName, clip.id)}:${event.pointerId}`;
    endHold(holdKey);

    if (
      typeof button.hasPointerCapture === "function" &&
      button.hasPointerCapture(event.pointerId)
    ) {
      button.releasePointerCapture(event.pointerId);
    }
  };

  button.addEventListener("pointerup", releasePointer);
  button.addEventListener("pointercancel", releasePointer);
  button.addEventListener("lostpointercapture", releasePointer);

  button.addEventListener("keydown", (event) => {
    if (event.repeat || (event.key !== " " && event.key !== "Enter")) {
      return;
    }

    event.preventDefault();
    const nextClipKey = clipKey(animal.folderName, clip.id);
    const holdKey = `keyboard:${nextClipKey}:${event.key}`;
    if (!state.holdByKey.has(holdKey)) {
      state.holdByKey.set(holdKey, {
        button,
        folderName: animal.folderName,
        clipKey: nextClipKey,
        voice: null,
      });
      syncHeldVisual(nextClipKey);
      void beginHold(holdKey, animal, clip);
    }
  });

  button.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      endHold(`keyboard:${clipKey(animal.folderName, clip.id)}:${event.key}`);
    }
  });

  button.addEventListener("blur", () => {
    endHold(`keyboard:${clipKey(animal.folderName, clip.id)}: `);
    endHold(`keyboard:${clipKey(animal.folderName, clip.id)}:Enter`);
  });
}

async function beginHold(holdKey, animal, clip) {
  try {
    const voice = await startHoldAsync(animal, clip);
    const hold = state.holdByKey.get(holdKey);
    if (!hold) {
      releaseVoice(voice);
      return;
    }

    hold.voice = voice;
    syncStatus();
  } catch (error) {
    console.error(error);
    state.holdByKey.delete(holdKey);
    syncHeldVisual(clipKey(animal.folderName, clip.id));
    setStatus(`Could not play ${clip.label || animal.displayName || animal.folderName}.`, 2600);
  }
}

function endHold(holdKey) {
  const hold = state.holdByKey.get(holdKey);
  if (!hold) {
    return;
  }

  state.holdByKey.delete(holdKey);
  releaseVoice(hold.voice);
  syncHeldVisual(hold.clipKey);
  syncStatus();
}

function syncHeldVisual(nextClipKey) {
  const isHeld = Array.from(state.holdByKey.values()).some(
    (entry) => entry.clipKey === nextClipKey,
  );

  document
    .querySelectorAll(`.plastic-button[data-clip-key="${nextClipKey}"]`)
    .forEach((button) => {
      button.classList.toggle("is-held", isHeld);
    });
}

async function ensureAudioSystem(options = {}) {
  const shouldResume = options.resume !== false;

  if (!state.audioContext) {
    state.audioContext = new window.AudioContext();
    state.masterGainNode = state.audioContext.createGain();
    state.masterGainNode.connect(state.audioContext.destination);
  }

  syncMasterGain();

  if (shouldResume && state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }

  return state.audioContext;
}

function syncMasterGain() {
  if (!state.audioContext || !state.masterGainNode || !state.settings) {
    return;
  }

  const target = clampNumber(state.settings.masterGain, 0, 3, 1);
  const now = state.audioContext.currentTime;
  state.masterGainNode.gain.cancelScheduledValues(now);
  state.masterGainNode.gain.setValueAtTime(state.masterGainNode.gain.value, now);
  state.masterGainNode.gain.linearRampToValueAtTime(target, now + 0.04);
}

async function warmAudioBuffers() {
  await ensureAudioSystem({ resume: false });

  const enabledClips = state.animals
    .filter((animal) => animal.enabled !== false && !animal.loadError)
    .flatMap((animal) => animal.audioClips || []);

  await Promise.allSettled(enabledClips.map((clip) => getAudioBuffer(clip)));
}

async function getAudioBuffer(clip) {
  const cacheKey = clip.path;
  if (!cacheKey) {
    throw new Error("Clip is missing an audio file.");
  }

  if (!state.bufferCache.has(cacheKey)) {
    const nextBuffer = (async () => {
      await ensureAudioSystem({ resume: false });
      const bytes = await window.desktopApi.readBinaryFile(cacheKey);
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );
      return state.audioContext.decodeAudioData(arrayBuffer.slice(0));
    })();

    state.bufferCache.set(cacheKey, nextBuffer);
  }

  return state.bufferCache.get(cacheKey);
}

async function startHoldAsync(animal, clip) {
  await ensureAudioSystem();
  const buffer = await getAudioBuffer(clip);

  const now = state.audioContext.currentTime;
  const source = state.audioContext.createBufferSource();
  const gainNode = state.audioContext.createGain();
  const attackMs = clampNumber(
    clip.attackMs,
    0,
    4000,
    clampNumber(state.settings.defaultAttackMs, 0, 4000, 80),
  );
  const releaseMs = clampNumber(
    clip.releaseMs,
    0,
    8000,
    clampNumber(state.settings.defaultReleaseMs, 0, 8000, 520),
  );
  const voiceGain = clampNumber(clip.gain, 0, 3, 1);
  const startAtSec = clampNumber(
    clip.startAtSec,
    0,
    Math.max(0, buffer.duration - 0.05),
    0,
  );
  const endAtSec = normalizeClipEnd(clip.endAtSec, buffer.duration, startAtSec);
  const shouldLoop = Boolean(clip.loopWhileHeld);

  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(state.masterGainNode);

  const attackEnd = now + attackMs / 1000;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, voiceGain), attackEnd);

  if (shouldLoop) {
    source.loop = true;
    source.loopStart = startAtSec;
    source.loopEnd = endAtSec;
  }

  const voice = {
    id: `${animal.folderName}-${clip.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    animal,
    clip,
    source,
    gainNode,
    releaseMs,
    targetGain: voiceGain,
    finalized: false,
    released: false,
    stopTimerId: 0,
  };

  source.onended = () => finalizeVoice(voice);
  state.activeVoices.add(voice);
  incrementActive(animal.folderName);

  if (shouldLoop) {
    source.start(now, startAtSec);
  } else {
    const clipDuration = Math.max(0.05, endAtSec - startAtSec);
    source.start(now, startAtSec, clipDuration);
  }

  return voice;
}

function releaseVoice(voice) {
  if (!voice || voice.released || voice.finalized || !state.audioContext) {
    return;
  }

  voice.released = true;
  const now = state.audioContext.currentTime;
  const releaseSeconds = Math.max(0.04, voice.releaseMs / 1000);
  const currentValue = Math.max(0.0001, voice.gainNode.gain.value || voice.targetGain);

  voice.gainNode.gain.cancelScheduledValues(now);
  voice.gainNode.gain.setValueAtTime(currentValue, now);
  voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseSeconds);

  voice.stopTimerId = window.setTimeout(() => {
    try {
      voice.source.stop();
    } catch (error) {
      console.debug("Voice stop ignored.", error);
    }
  }, Math.max(70, voice.releaseMs + 90));
}

function finalizeVoice(voice) {
  if (!voice || voice.finalized) {
    return;
  }

  voice.finalized = true;
  if (voice.stopTimerId) {
    window.clearTimeout(voice.stopTimerId);
  }

  state.activeVoices.delete(voice);

  try {
    voice.source.disconnect();
  } catch (error) {
    console.debug("Voice source disconnect ignored.", error);
  }

  try {
    voice.gainNode.disconnect();
  } catch (error) {
    console.debug("Voice gain disconnect ignored.", error);
  }

  decrementActive(voice.animal.folderName);
}

function releaseAllVoices() {
  Array.from(state.holdByKey.keys()).forEach((holdKey) => endHold(holdKey));
  Array.from(state.activeVoices).forEach((voice) => releaseVoice(voice));
}

function normalizeClipEnd(endAtSec, duration, startAtSec) {
  const numericEnd = Number.isFinite(Number(endAtSec)) ? Number(endAtSec) : 0;
  if (numericEnd <= startAtSec + 0.02 || numericEnd > duration) {
    return duration;
  }
  return numericEnd;
}

function incrementActive(folderName) {
  const nextValue = (state.activeCounts.get(folderName) || 0) + 1;
  state.activeCounts.set(folderName, nextValue);
  syncActiveCard(folderName);
}

function decrementActive(folderName) {
  const nextValue = (state.activeCounts.get(folderName) || 1) - 1;
  if (nextValue <= 0) {
    state.activeCounts.delete(folderName);
  } else {
    state.activeCounts.set(folderName, nextValue);
  }

  syncActiveCard(folderName);
  syncStatus();
}

function syncActiveCard(folderName) {
  const isActive = (state.activeCounts.get(folderName) || 0) > 0;
  document
    .querySelectorAll(`.animal-card[data-folder-name="${folderName}"]`)
    .forEach((card) => {
      card.classList.toggle("is-active", isActive);
    });
}

function syncSettingsForm() {
  const form = els.appSettingsForm.elements;
  form.namedItem("windowTitle").value = state.settings.windowTitle || "";
  form.namedItem("headerTitle").value = state.settings.headerTitle || "";
  form.namedItem("headerSubtitle").value = state.settings.headerSubtitle || "";
  form.namedItem("idleStatusMessage").value = state.settings.idleStatusMessage || "";
  form.namedItem("windowWidth").value = state.settings.windowWidth ?? "";
  form.namedItem("windowHeight").value = state.settings.windowHeight ?? "";
  form.namedItem("masterGain").value = state.settings.masterGain ?? 1;
  form.namedItem("defaultAttackMs").value = state.settings.defaultAttackMs ?? 80;
  form.namedItem("defaultReleaseMs").value = state.settings.defaultReleaseMs ?? 520;
  form.namedItem("preloadAudio").checked = Boolean(state.settings.preloadAudio);
  form.namedItem("settingsBody").value = state.settingsBody || "";
}

async function saveAppSettings() {
  setStatus("Saving app settings...");

  const form = els.appSettingsForm.elements;
  const nextSettings = {
    windowTitle: readTextField(form, "windowTitle", "Museum Animal Sound Wall"),
    headerTitle: readTextField(form, "headerTitle", "Press And Hold To Hear The Animal"),
    headerSubtitle: readTextField(form, "headerSubtitle", "Interactive Museum Display"),
    idleStatusMessage: readTextField(
      form,
      "idleStatusMessage",
      "Hold a button to hear the animal. Sounds can overlap.",
    ),
    windowWidth: readIntegerField(form, "windowWidth", 1680),
    windowHeight: readIntegerField(form, "windowHeight", 760),
    masterGain: readNumberField(form, "masterGain", 1),
    defaultAttackMs: readIntegerField(form, "defaultAttackMs", 80),
    defaultReleaseMs: readIntegerField(form, "defaultReleaseMs", 520),
    preloadAudio: form.namedItem("preloadAudio").checked,
  };
  const nextBody = form.namedItem("settingsBody").value;

  const payload = await window.desktopApi.saveAppSettings(nextSettings, nextBody);
  applyLoadedData(payload);
  setStatus("App settings saved. Window size changes apply on the next launch.", 2600);
}

function openAnimalEditor(folderName) {
  const animal = findAnimal(folderName);
  if (!animal) {
    return;
  }

  state.editingAnimalFolder = folderName;
  syncAnimalForm(animal);
  setAnimalEditorOpen(true);
}

function syncAnimalForm(animal) {
  const form = els.animalForm.elements;

  form.namedItem("folderName").value = animal.folderName;
  form.namedItem("id").value = animal.id || "";
  form.namedItem("sortOrder").value = animal.sortOrder ?? "";
  form.namedItem("displayName").value = animal.displayName || "";
  form.namedItem("tagline").value = animal.tagline || "";
  form.namedItem("accentColor").value = animal.accentColor || "";
  form.namedItem("imageFile").value = animal.imageFile || "";
  form.namedItem("aboutFile").value = animal.aboutFile || "";
  form.namedItem("enabled").checked = animal.enabled !== false;
  form.namedItem("cropPosition").value = animal.cropPosition || "center center";
  form.namedItem("animalBody").value = animal.body || "";
  form.namedItem("aboutAnimalName").value = animal.about?.animalName || animal.displayName || "";
  form.namedItem("aboutHeadline").value = animal.about?.headline || "";
  form.namedItem("aboutKeyFacts").value = joinLines(animal.about?.keyFacts || []);
  form.namedItem("aboutScienceHighlights").value = joinLines(
    animal.about?.scienceHighlights || [],
  );
  form.namedItem("aboutCuriousQuestion").value = animal.about?.curiousQuestion || "";
  form.namedItem("aboutBody").value = animal.aboutBody || "";

  els.animalEditorTitle.textContent = animal.displayName || animal.folderName;
  renderClipEditorList(animal.audioClips || []);
}

function renderClipEditorList(clips) {
  els.audioClipsList.replaceChildren();
  clips.forEach((clip) => addClipEditorCard(clip));
}

function addClipEditorCard(clip = null) {
  const clipData = {
    ...DEFAULT_CLIP,
    attackMs: state.settings?.defaultAttackMs ?? DEFAULT_CLIP.attackMs,
    releaseMs: state.settings?.defaultReleaseMs ?? DEFAULT_CLIP.releaseMs,
    ...clip,
  };

  const card = document.createElement("section");
  card.className = "clip-editor-card";
  card.dataset.clipId = normalizeClipId(clipData.id || clipData.label || "new-audio");
  card.innerHTML = `
    <div class="clip-editor-head">
      <div class="clip-editor-title">
        <strong></strong>
        <span></span>
      </div>
      <div class="clip-editor-actions">
        <button class="secondary-button" data-action="import" type="button">Import Audio</button>
        <button class="secondary-button" data-action="record" type="button">Record New Audio</button>
        <button class="danger-button" data-action="remove" type="button">Remove</button>
      </div>
    </div>
    <div class="clip-editor-grid">
      <label class="field">
        <span>Clip Id</span>
        <input data-field="id" type="text" />
      </label>
      <label class="field">
        <span>Button Label</span>
        <input data-field="label" type="text" />
      </label>
      <label class="field">
        <span>Recorded By</span>
        <input data-field="performerName" type="text" />
      </label>
      <label class="field">
        <span>Audio File</span>
        <input data-field="file" type="text" />
      </label>
      <label class="field field-full">
        <span>Summary</span>
        <textarea data-field="summary" rows="3"></textarea>
      </label>
      <label class="field">
        <span>Gain</span>
        <input data-field="gain" type="number" min="0" max="3" step="0.05" />
      </label>
      <label class="field">
        <span>Attack (ms)</span>
        <input data-field="attackMs" type="number" min="0" step="1" />
      </label>
      <label class="field">
        <span>Release (ms)</span>
        <input data-field="releaseMs" type="number" min="0" step="1" />
      </label>
      <label class="field">
        <span>Clip Start (sec)</span>
        <input data-field="startAtSec" type="number" min="0" step="0.1" />
      </label>
      <label class="field">
        <span>Clip End (sec)</span>
        <input data-field="endAtSec" type="number" min="0" step="0.1" />
      </label>
      <label class="toggle-field">
        <span>Loop While Held</span>
        <input data-field="loopWhileHeld" type="checkbox" />
      </label>
    </div>
  `;

  setClipCardValues(card, clipData);
  updateClipEditorHeading(card);

  card.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", () => updateClipEditorHeading(card));
    input.addEventListener("change", () => updateClipEditorHeading(card));
  });

  card.querySelector('[data-action="import"]').addEventListener("click", () => {
    state.pendingImportClipId = ensureClipCardId(card);
    els.audioImportInput.click();
  });

  card.querySelector('[data-action="record"]').addEventListener("click", () => {
    void openRecordingForClip(card);
  });

  card.querySelector('[data-action="remove"]').addEventListener("click", () => {
    card.remove();
    setStatus("Audio button removed from the editor.", 1800);
  });

  els.audioClipsList.appendChild(card);
  return card;
}

function setClipCardValues(card, clip) {
  card.querySelector('[data-field="id"]').value = clip.id || "";
  card.querySelector('[data-field="label"]').value = clip.label || "";
  card.querySelector('[data-field="performerName"]').value = clip.performerName || "";
  card.querySelector('[data-field="file"]').value = clip.file || "";
  card.querySelector('[data-field="summary"]').value = clip.summary || "";
  card.querySelector('[data-field="gain"]').value = clip.gain ?? 1;
  card.querySelector('[data-field="attackMs"]').value =
    clip.attackMs ?? state.settings?.defaultAttackMs ?? 80;
  card.querySelector('[data-field="releaseMs"]').value =
    clip.releaseMs ?? state.settings?.defaultReleaseMs ?? 520;
  card.querySelector('[data-field="startAtSec"]').value = clip.startAtSec ?? 0;
  card.querySelector('[data-field="endAtSec"]').value = clip.endAtSec ?? 0;
  card.querySelector('[data-field="loopWhileHeld"]').checked = Boolean(clip.loopWhileHeld);
}

function updateClipEditorHeading(card) {
  const clipId = ensureClipCardId(card);
  const label = card.querySelector('[data-field="label"]').value.trim() || "New Audio";
  const file = card.querySelector('[data-field="file"]').value.trim() || "No audio file assigned yet.";
  card.querySelector(".clip-editor-title strong").textContent = label;
  card.querySelector(".clip-editor-title span").textContent = file;
  card.dataset.clipId = clipId;
}

function ensureClipCardId(card) {
  const idInput = card.querySelector('[data-field="id"]');
  const labelInput = card.querySelector('[data-field="label"]');
  const nextId = normalizeClipId(idInput.value || labelInput.value || "new-audio");
  idInput.value = nextId;
  card.dataset.clipId = nextId;
  return nextId;
}

function normalizeClipId(value) {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "") || `clip-${Date.now()}`
  );
}

async function handleAudioImportSelection() {
  const [file] = els.audioImportInput.files || [];
  const clipId = state.pendingImportClipId;
  els.audioImportInput.value = "";
  state.pendingImportClipId = "";

  if (!file || !clipId) {
    return;
  }

  const folderName = els.animalForm.elements.namedItem("folderName").value;
  if (!folderName) {
    return;
  }

  const draft = buildAnimalDraftFromEditor();
  const clipDraft = draft.settings.audioClips.find((entry) => entry.id === clipId);
  const bytes = new Uint8Array(await file.arrayBuffer());

  setStatus(`Importing ${file.name}...`);
  const payload = await window.desktopApi.importAudioClip({
    folderName,
    animalDraft: draft,
    clipId,
    label: clipDraft?.label || "New Audio",
    originalName: file.name,
    bytes,
  });

  applyLoadedData(payload);
  openAnimalEditor(folderName);
  setStatus(`${file.name} imported into ${folderName}.`, 2200);
}

async function openRecordingForClip(card) {
  const folderName = els.animalForm.elements.namedItem("folderName").value;
  if (!folderName) {
    return;
  }

  const clipId = ensureClipCardId(card);
  const draft = buildAnimalDraftFromEditor();
  const clipDraft = draft.settings.audioClips.find((entry) => entry.id === clipId);

  setStatus(`Opening recording window for ${clipDraft?.label || "new audio"}...`, 1800);
  await window.desktopApi.openRecordingWindow({
    folderName,
    clipId,
    clipDraft,
    animalDraft: draft,
  });
}

function buildAnimalDraftFromEditor() {
  const form = els.animalForm.elements;
  const displayName = readTextField(form, "displayName", "New Animal");

  return {
    settings: {
      id: readTextField(form, "id", displayName),
      sortOrder: readIntegerField(form, "sortOrder", 99),
      displayName,
      tagline: readTextField(form, "tagline", "Hold the button to hear the animal."),
      accentColor: readTextField(form, "accentColor", "#78d7cc"),
      imageFile: readTextField(form, "imageFile", ""),
      aboutFile: readTextField(form, "aboutFile", ""),
      enabled: form.namedItem("enabled").checked,
      cropPosition: readTextField(form, "cropPosition", "center center"),
      audioClips: readClipDraftsFromEditor(),
    },
    body: form.namedItem("animalBody").value,
    aboutSettings: {
      animalName: readTextField(form, "aboutAnimalName", displayName),
      headline: readTextField(form, "aboutHeadline", `${displayName} museum script`),
      keyFacts: splitLines(form.namedItem("aboutKeyFacts").value),
      scienceHighlights: splitLines(form.namedItem("aboutScienceHighlights").value),
      curiousQuestion: readTextField(
        form,
        "aboutCuriousQuestion",
        "What science-based question do you want visitors to think about?",
      ),
    },
    aboutBody: form.namedItem("aboutBody").value,
  };
}

function readClipDraftsFromEditor() {
  return Array.from(els.audioClipsList.children).map((card, index) => {
    const clipId = ensureClipCardId(card) || `clip-${index + 1}`;
    return {
      id: clipId,
      label: readCardText(card, "label", `Audio ${index + 1}`),
      file: readCardText(card, "file", ""),
      performerName: readCardText(card, "performerName", ""),
      summary: readCardText(card, "summary", ""),
      gain: readCardNumber(card, "gain", 1),
      attackMs: readCardInteger(card, "attackMs", state.settings?.defaultAttackMs ?? 80),
      releaseMs: readCardInteger(card, "releaseMs", state.settings?.defaultReleaseMs ?? 520),
      startAtSec: readCardNumber(card, "startAtSec", 0),
      endAtSec: readCardNumber(card, "endAtSec", 0),
      loopWhileHeld: card.querySelector('[data-field="loopWhileHeld"]').checked,
    };
  });
}

async function saveAnimalSettings() {
  const form = els.animalForm.elements;
  const folderName = form.namedItem("folderName").value;

  if (!folderName) {
    return;
  }

  setStatus("Saving animal settings...");
  const payload = await window.desktopApi.saveAnimal(folderName, buildAnimalDraftFromEditor());
  applyLoadedData(payload);
  openAnimalEditor(folderName);
  setStatus("Animal settings saved.", 2200);
}

function setSettingsOpen(nextOpen) {
  state.settingsOpen = Boolean(nextOpen);
  els.settingsPanel.classList.toggle("is-open", state.settingsOpen);
  els.settingsPanel.setAttribute("aria-hidden", String(!state.settingsOpen));
  syncScrim();
}

function setAnimalEditorOpen(nextOpen) {
  state.animalEditorOpen = Boolean(nextOpen);
  els.animalEditor.classList.toggle("is-open", state.animalEditorOpen);
  els.animalEditor.setAttribute("aria-hidden", String(!state.animalEditorOpen));
  syncScrim();
}

function syncScrim() {
  const shouldShow = state.settingsOpen || state.animalEditorOpen;
  els.scrim.hidden = !shouldShow;
}

function closePanels() {
  setAnimalEditorOpen(false);
  setSettingsOpen(false);
}

function syncStatus() {
  if (!state.settings) {
    return;
  }

  const activeVoices = Array.from(state.activeVoices).filter((voice) => !voice.finalized);

  if (activeVoices.length === 0) {
    els.statusText.textContent =
      state.settings.idleStatusMessage || "Hold a button to hear the animal.";
    return;
  }

  const names = activeVoices
    .map((voice) => `${voice.animal.displayName}: ${voice.clip.label}`)
    .join(", ");
  els.statusText.textContent = `Playing ${activeVoices.length} sound${activeVoices.length === 1 ? "" : "s"}: ${names}`;
}

function setStatus(message, timeoutMs) {
  if (state.statusTimerId) {
    window.clearTimeout(state.statusTimerId);
    state.statusTimerId = 0;
  }

  els.statusText.textContent = message;

  if (timeoutMs && timeoutMs > 0) {
    state.statusTimerId = window.setTimeout(() => {
      state.statusTimerId = 0;
      syncStatus();
    }, timeoutMs);
  }
}

function readTextField(form, name, fallback) {
  const value = form.namedItem(name).value.trim();
  return value || fallback;
}

function readNumberField(form, name, fallback) {
  const value = Number(form.namedItem(name).value);
  return Number.isFinite(value) ? value : fallback;
}

function readIntegerField(form, name, fallback) {
  const value = Number.parseInt(form.namedItem(name).value, 10);
  return Number.isFinite(value) ? value : fallback;
}

function readCardText(card, fieldName, fallback) {
  const value = card.querySelector(`[data-field="${fieldName}"]`).value.trim();
  return value || fallback;
}

function readCardNumber(card, fieldName, fallback) {
  const value = Number(card.querySelector(`[data-field="${fieldName}"]`).value);
  return Number.isFinite(value) ? value : fallback;
}

function readCardInteger(card, fieldName, fallback) {
  const value = Number.parseInt(card.querySelector(`[data-field="${fieldName}"]`).value, 10);
  return Number.isFinite(value) ? value : fallback;
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function joinLines(values) {
  return (values || []).join("\n");
}

function clampNumber(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numericValue));
}
