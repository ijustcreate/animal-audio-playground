const PRESET_POSITIONS = {
  "50% 50%": "Center",
  "50% 15%": "Top",
  "50% 85%": "Bottom",
  "15% 50%": "Left",
  "85% 50%": "Right",
  "15% 15%": "Top Left",
  "85% 15%": "Top Right",
  "15% 85%": "Bottom Left",
  "85% 85%": "Bottom Right",
};

const state = {
  folderName: new URLSearchParams(window.location.search).get("folderName"),
  animal: null,
  draft: null,
  clipDurationById: new Map(),
  activeTimelineDrag: null,
  saveTimerId: 0,
  saveInFlight: false,
  pendingAudioClipId: "",
  previewAudio: null,
  previewClipId: "",
  previewStopTimerId: 0,
};

const els = {
  windowTitle: document.querySelector("#window-title"),
  saveStatus: document.querySelector("#save-status"),
  previewImage: document.querySelector("#preview-image"),
  previewName: document.querySelector("#preview-name"),
  previewScience: document.querySelector("#preview-science"),
  videoPreview: document.querySelector("#video-preview"),
  videoPreviewFrame: document.querySelector("#video-preview-frame"),
  videoUrl: document.querySelector("#video-url"),
  displayName: document.querySelector("#display-name"),
  sortOrder: document.querySelector("#sort-order"),
  accentColorPicker: document.querySelector("#accent-color-picker"),
  accentColorHex: document.querySelector("#accent-color-hex"),
  enabledToggle: document.querySelector("#enabled-toggle"),
  cropPreset: document.querySelector("#crop-preset"),
  cropX: document.querySelector("#crop-x"),
  cropY: document.querySelector("#crop-y"),
  cropPositionDisplay: document.querySelector("#crop-position-display"),
  aboutAnimalName: document.querySelector("#about-animal-name"),
  aboutScientificName: document.querySelector("#about-scientific-name"),
  aboutScientificPronunciation: document.querySelector("#about-scientific-pronunciation"),
  aboutKeyFacts: document.querySelector("#about-key-facts"),
  aboutScienceHighlights: document.querySelector("#about-science-highlights"),
  aboutQuestion35: document.querySelector("#about-question-3-5"),
  aboutQuestion58: document.querySelector("#about-question-5-8"),
  aboutQuestion813: document.querySelector("#about-question-8-13"),
  aboutBody: document.querySelector("#about-body"),
  clipCards: document.querySelector("#clip-cards"),
  audioImportInput: document.querySelector("#audio-import-input"),
  videoImportInput: document.querySelector("#video-import-input"),
  promptDialog: document.querySelector("#prompt-dialog"),
  promptTitle: document.querySelector("#prompt-title"),
  promptCopy: document.querySelector("#prompt-copy"),
  promptInput: document.querySelector("#prompt-input"),
  jumpToFacts: document.querySelector("#jump-to-facts"),
  openAnimalFolder: document.querySelector("#open-animal-folder"),
  importVideoFile: document.querySelector("#import-video-file"),
  previewVideoButton: document.querySelector("#preview-video-button"),
  closeWindow: document.querySelector("#close-window"),
};

bootstrap().catch((error) => {
  console.error(error);
  setSaveStatus("Could not load this animal.");
});

async function bootstrap() {
  if (!state.folderName) {
    throw new Error("Missing animal folder name.");
  }

  wireEvents();
  window.desktopApi.onContentChanged((payload) => {
    const reloadReasons = new Set([
      "recording-saved",
      "audio-imported",
      "youtube-audio-imported",
      "video-imported",
    ]);
    if (reloadReasons.has(payload?.reason)) {
      void reloadFromDisk();
    }
  });
  await reloadFromDisk();
}

function wireEvents() {
  document.addEventListener("input", handleInputChange);
  document.addEventListener("change", handleInputChange);
  document.addEventListener("click", handleClick);
  document.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);

  els.audioImportInput.addEventListener("change", () => {
    void handleAudioImport();
  });
  els.videoImportInput.addEventListener("change", () => {
    void handleVideoImport();
  });

  els.promptDialog.addEventListener("close", () => {
    els.promptInput.value = "";
  });

  window.addEventListener("beforeunload", () => stopPreviewAudio());
}

async function reloadFromDisk() {
  stopPreviewAudio();
  const payload = await window.desktopApi.loadAppData();
  const animal = (payload.animals || []).find((entry) => entry.folderName === state.folderName);
  if (!animal) {
    throw new Error(`Could not find animal ${state.folderName}.`);
  }

  state.animal = animal;
  state.draft = createAnimalDraft(animal);
  state.clipDurationById = await loadClipDurations(animal);
  renderAll();
  setSaveStatus("Live preview ready.");
}

function renderAll() {
  document.title = `${state.draft.settings.displayName} Settings`;
  els.windowTitle.textContent = `${state.draft.settings.displayName} Settings`;

  els.displayName.value = state.draft.settings.displayName || "";
  els.sortOrder.value = state.draft.settings.sortOrder ?? "";
  const validHex = normalizeHexColor(state.draft.settings.accentColor, "#8fdccc");
  els.accentColorPicker.value = validHex;
  els.accentColorHex.value = validHex;
  els.enabledToggle.checked = Boolean(state.draft.settings.enabled);

  const crop = parseCropPosition(state.draft.settings.cropPosition);
  els.cropX.value = String(crop.x);
  els.cropY.value = String(crop.y);
  els.cropPreset.value = PRESET_POSITIONS[state.draft.settings.cropPosition]
    ? state.draft.settings.cropPosition
    : "manual";
  els.cropPositionDisplay.value = state.draft.settings.cropPosition;

  els.aboutAnimalName.value = state.draft.aboutSettings.animalName || "";
  els.aboutScientificName.value = state.draft.aboutSettings.scientificName || "";
  els.aboutScientificPronunciation.value =
    state.draft.aboutSettings.scientificPronunciation || "";
  els.aboutKeyFacts.value = (state.draft.aboutSettings.keyFacts || []).join("\n");
  els.aboutScienceHighlights.value = (state.draft.aboutSettings.scienceHighlights || []).join("\n");
  els.aboutQuestion35.value = state.draft.aboutSettings.curiousQuestionAge3To5 || "";
  els.aboutQuestion58.value = state.draft.aboutSettings.curiousQuestionAge5To8 || "";
  els.aboutQuestion813.value = state.draft.aboutSettings.curiousQuestionAge8To13 || "";
  els.aboutBody.value = state.draft.aboutBody || "";
  els.videoUrl.value = state.draft.settings.videoUrl || "";

  renderPreview();
  renderClipCards();
}

function renderPreview() {
  els.previewImage.src = state.animal.imageUrl;
  els.previewImage.alt = state.draft.settings.displayName || state.folderName;
  els.previewImage.style.objectPosition = state.draft.settings.cropPosition || "50% 50%";
  els.previewName.textContent = state.draft.settings.displayName || state.folderName;
  els.previewScience.textContent = `${state.draft.aboutSettings.scientificName || ""} ${
    state.draft.aboutSettings.scientificPronunciation
      ? `| ${state.draft.aboutSettings.scientificPronunciation}`
      : ""
  }`.trim();
  if (state.animal.videoMediaUrl) {
    els.videoPreview.src = state.animal.videoMediaUrl;
    els.videoPreview.hidden = false;
    els.videoPreviewFrame.hidden = true;
    els.videoPreviewFrame.removeAttribute("src");
    els.previewVideoButton.disabled = false;
  } else if (state.draft.settings.videoUrl && toYouTubeEmbedUrl(state.draft.settings.videoUrl)) {
    els.videoPreview.removeAttribute("src");
    els.videoPreview.hidden = true;
    els.videoPreviewFrame.hidden = false;
    els.videoPreviewFrame.src = toYouTubeEmbedUrl(state.draft.settings.videoUrl);
    els.previewVideoButton.disabled = false;
  } else {
    els.videoPreview.removeAttribute("src");
    els.videoPreview.hidden = false;
    els.videoPreviewFrame.hidden = true;
    els.videoPreviewFrame.removeAttribute("src");
    els.previewVideoButton.disabled = true;
  }
}

function renderClipCards() {
  els.clipCards.replaceChildren();

  const clips = [...(state.draft.settings.audioClips || [])].sort((left, right) => {
    const rank = (clip) => (clip.kind === "sound" ? 0 : clip.kind === "facts" ? 1 : 2);
    return rank(left) - rank(right);
  });

  clips.forEach((clip) => {
    const durationSec = state.clipDurationById.get(clip.id) || 0;
    const card = document.createElement("section");
    card.className = "clip-card";
    card.dataset.clipId = clip.id;
    card.dataset.clipKind = clip.kind;
    card.id = `clip-card-${clip.id}`;

    const title = document.createElement("div");
    title.className = "clip-card-head";
    title.innerHTML = `<div><h3>${escapeHtml(clip.label || clip.id)}</h3><p>${escapeHtml(
      clip.kind === "facts"
        ? "This is the spoken facts button shown on the wall."
        : "This is the animal sound button shown on the wall.",
    )}</p></div><span class="clip-kind-pill">${escapeHtml(clip.kind === "facts" ? "Facts Audio" : "Sound Effect")}</span>`;

    const identityGrid = document.createElement("div");
    identityGrid.className = "form-grid clip-grid clip-grid-primary";

    identityGrid.append(
      buildField("Visible On Wall", "checkbox", clip.visible !== false, {
        clipId: clip.id,
        field: "visible",
        className: "field-toggle-card clip-visible-field",
        title: "Show or hide this button on the main museum wall.",
      }),
      buildField("Button Label", "text", clip.label || "", {
        clipId: clip.id,
        field: "label",
        className: "clip-label-field",
        title: "Large label shown on the wall button.",
      }),
      buildField(clip.kind === "facts" ? "Voice Name" : "Grey Subtitle", "text", clip.performerName || "", {
        clipId: clip.id,
        field: "performerName",
        className: "clip-performer-field",
        title:
          clip.kind === "facts"
            ? "The voice name shown in gray under Creature Facts."
            : "The gray helper text shown under the sound button.",
      }),
      buildField("Audio File", "text", clip.file || "", {
        clipId: clip.id,
        field: "file",
        title: "Relative audio file path stored inside the animal folder.",
        readOnly: true,
      }),
    );

    const behaviorGrid = document.createElement("div");
    behaviorGrid.className = "form-grid clip-grid clip-grid-behavior";

    behaviorGrid.append(
      buildField("Loudness Multiplier (Gain)", "number", clip.gain ?? 1, {
        clipId: clip.id,
        field: "gain",
        step: "0.05",
        min: "0",
        max: "3",
        title: "Loudness multiplier for this one button. Higher means louder.",
      }),
      buildField("Attack (ms)", "number", clip.attackMs ?? 80, {
        clipId: clip.id,
        field: "attackMs",
        step: "1",
        min: "0",
        title: "How quickly the sound reaches full volume when playback begins.",
      }),
      buildField("Release Fade (sec)", "number", formatSecondsValue((clip.releaseMs ?? 520) / 1000), {
        clipId: clip.id,
        field: "releaseSec",
        step: "0.1",
        min: "0",
        title: "How many seconds the fade-out lasts after you let go. Decimal values like 0.5 or 1.2 work well.",
      }),
      buildField("Loop While Held", "checkbox", Boolean(clip.loopWhileHeld), {
        clipId: clip.id,
        field: "loopWhileHeld",
        title: "Loop this sound as long as the visitor keeps holding the button.",
      }),
    );

    const timeline = buildTimelineEditor(clip, durationSec);

    const actions = document.createElement("div");
    actions.className = "clip-actions";

    if (clip.kind === "facts") {
      actions.append(buildActionButton("Record New Animal Fact", "record-facts", clip.id));
    }
    actions.append(
      buildActionButton("Import Audio File", "import-audio", clip.id),
      buildActionButton("Import From YouTube", "import-youtube", clip.id),
    );

    card.append(title, identityGrid, behaviorGrid, timeline, actions);
    els.clipCards.appendChild(card);
  });

  if (els.jumpToFacts) {
    els.jumpToFacts.hidden = !clips.some((clip) => clip.kind === "facts");
  }
}

function buildTimelineEditor(clip, durationSec) {
  const shell = document.createElement("section");
  shell.className = "clip-timeline";
  shell.dataset.clipId = clip.id;

  const safeDuration = Math.max(durationSec || 0, Number(clip.endAtSec) || 0, Number(clip.startAtSec) || 0, 1);
  const startValue = clampTimelineValue(clip.startAtSec, 0, safeDuration);
  const rawEnd = Number(clip.endAtSec) || 0;
  const endValue = rawEnd > startValue ? clampTimelineValue(rawEnd, 0, safeDuration) : safeDuration;
  const progressStart = (startValue / safeDuration) * 100;
  const progressEnd = (endValue / safeDuration) * 100;

  shell.style.setProperty("--clip-start", `${progressStart}%`);
  shell.style.setProperty("--clip-end", `${progressEnd}%`);

  const head = document.createElement("div");
  head.className = "clip-timeline-head";
  const copy = document.createElement("div");
  copy.innerHTML = `
    <strong>Playback Segment</strong>
    <p>Drag the start and end handles to clip in the part of the sound you want this button to use.</p>
  `;

  const tools = document.createElement("div");
  tools.className = "clip-timeline-tools";
  tools.append(
    buildSegmentPreviewButton(clip.id),
  );
  const durationPill = document.createElement("span");
  durationPill.className = "clip-duration-pill";
  durationPill.textContent = durationSec ? `File Length ${formatTime(durationSec)}` : "Length loading...";
  tools.appendChild(durationPill);
  head.append(copy, tools);

  const track = document.createElement("div");
  track.className = "clip-track-shell";
  track.innerHTML = `
    <div class="clip-track">
      <div class="clip-track-fill"></div>
      <input class="clip-range clip-range-start" data-clip-id="${escapeHtml(clip.id)}" data-field="startAtSec" type="range" min="0" max="${safeDuration}" step="0.1" value="${startValue}" />
      <input class="clip-range clip-range-end" data-clip-id="${escapeHtml(clip.id)}" data-field="endAtSec" type="range" min="0" max="${safeDuration}" step="0.1" value="${endValue}" />
    </div>
  `;

  const readout = document.createElement("div");
  readout.className = "clip-timeline-readout";
  readout.append(
    buildTimelineReadout("Start", clip.id, "startAtSec", startValue),
    buildTimelineReadout("End", clip.id, "endAtSec", rawEnd > startValue ? endValue : 0, {
      placeholder: "Full file",
    }),
  );

  shell.append(head, track, readout);
  return shell;
}

function buildSegmentPreviewButton(clipId) {
  const button = document.createElement("button");
  button.className = "toolbar-button clip-preview-toggle";
  button.type = "button";
  button.dataset.action = "preview-audio";
  button.dataset.clipId = clipId;
  button.textContent = state.previewClipId === clipId ? "Stop Segment" : "Play Segment";
  button.title =
    state.previewClipId === clipId
      ? "Stop the current segment preview."
      : "Play this clip using the current start, end, gain, and release settings.";
  return button;
}

function buildTimelineReadout(labelText, clipId, field, value, options = {}) {
  const label = document.createElement("label");
  label.className = "field clip-timeline-field";
  label.title =
    field === "startAtSec"
      ? "This button starts playback at this point in the file."
      : "This button stops playback at this point. Leave it at Full file to keep playing to the end.";

  const span = document.createElement("span");
  span.textContent = labelText;

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.className = "clip-timecode-input";
  input.dataset.clipId = clipId;
  input.dataset.field = field;
  input.value = field === "endAtSec" && !value ? "" : formatTimecode(value);
  if (options.placeholder) {
    input.placeholder = options.placeholder;
  }

  label.append(span, input);
  return label;
}

function buildField(labelText, type, value, options) {
  const label = document.createElement("label");
  label.className = "field";
  if (options.field === "file") {
    label.classList.add("field-full");
  }
  if (options.className) {
    label.classList.add(...String(options.className).split(/\s+/).filter(Boolean));
  }
  label.title = options.title || "";

  const span = document.createElement("span");
  span.textContent = labelText;

  const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
  input.type = type === "checkbox" ? "checkbox" : type;
  input.dataset.clipId = options.clipId;
  input.dataset.field = options.field;
  if (options.readOnly) {
    input.readOnly = true;
  }
  if (options.step) input.step = options.step;
  if (options.min) input.min = options.min;
  if (options.max) input.max = options.max;

  if (type === "checkbox") {
    input.className = "checkbox";
    input.checked = Boolean(value);
  } else {
    input.value = value ?? "";
  }

  label.append(span, input);
  return label;
}

function buildActionButton(label, action, clipId) {
  const button = document.createElement("button");
  button.className = "toolbar-button";
  button.type = "button";
  button.dataset.action = action;
  button.dataset.clipId = clipId;
  button.textContent = label;
  button.title =
    action === "import-audio"
      ? "Copy a local audio file into this animal folder and link it to this button."
      : action === "import-youtube"
        ? "Paste a YouTube link and store the downloaded audio inside this animal folder."
        : action === "preview-audio"
          ? "Play a quick preview of this button's current audio settings."
          : "Open the recording window for a new spoken facts track.";
  return button;
}

function handleInputChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return;
  }

  if (!state.draft) {
    return;
  }

  if (target.dataset.clipId && target.dataset.field) {
    const clip = state.draft.settings.audioClips.find((entry) => entry.id === target.dataset.clipId);
    if (!clip) {
      return;
    }

    if (target.dataset.field === "releaseSec") {
      clip.releaseMs = Math.max(0, Number(target.value) || 0) * 1000;
    } else if (target.dataset.field === "startAtSec" || target.dataset.field === "endAtSec") {
      if (target.classList.contains("clip-timecode-input") && event.type === "input") {
        return;
      }
      applyClipTimelineChange(clip, target.dataset.field, target.value);
    } else {
      clip[target.dataset.field] =
        target.type === "checkbox" ? target.checked : parseMaybeNumber(target.value);
    }

    queueSave();
    return;
  }

  switch (target.id) {
    case "display-name":
      state.draft.settings.displayName = target.value;
      state.draft.aboutSettings.animalName = state.draft.aboutSettings.animalName || target.value;
      renderPreview();
      break;
    case "sort-order":
      state.draft.settings.sortOrder = Number(target.value) || 1;
      break;
    case "enabled-toggle":
      state.draft.settings.enabled = target.checked;
      break;
    case "accent-color-picker": {
      state.draft.settings.accentColor = target.value;
      els.accentColorHex.value = target.value.toUpperCase();
      break;
    }
    case "accent-color-hex": {
      if (event.type === "input" && !/^#[0-9a-fA-F]{6}$/.test(target.value.trim())) {
        return;
      }
      const normalized = normalizeHexColor(target.value, state.draft.settings.accentColor);
      state.draft.settings.accentColor = normalized;
      els.accentColorPicker.value = normalized;
      target.value = normalized.toUpperCase();
      break;
    }
    case "crop-preset":
      if (target.value !== "manual") {
        state.draft.settings.cropPosition = target.value;
        const crop = parseCropPosition(target.value);
        els.cropX.value = String(crop.x);
        els.cropY.value = String(crop.y);
        els.cropPositionDisplay.value = target.value;
        renderPreview();
      }
      break;
    case "crop-x":
    case "crop-y":
      applyManualCrop();
      break;
    case "video-url":
      state.draft.settings.videoUrl = target.value.trim();
      renderPreview();
      break;
    case "about-animal-name":
      state.draft.aboutSettings.animalName = target.value;
      break;
    case "about-scientific-name":
      state.draft.aboutSettings.scientificName = target.value;
      renderPreview();
      break;
    case "about-scientific-pronunciation":
      state.draft.aboutSettings.scientificPronunciation = target.value;
      renderPreview();
      break;
    case "about-key-facts":
      state.draft.aboutSettings.keyFacts = splitLines(target.value);
      break;
    case "about-science-highlights":
      state.draft.aboutSettings.scienceHighlights = splitLines(target.value);
      break;
    case "about-question-3-5":
      state.draft.aboutSettings.curiousQuestionAge3To5 = target.value;
      break;
    case "about-question-5-8":
      state.draft.aboutSettings.curiousQuestionAge5To8 = target.value;
      break;
    case "about-question-8-13":
      state.draft.aboutSettings.curiousQuestionAge8To13 = target.value;
      break;
    case "about-body":
      state.draft.aboutBody = target.value;
      break;
    default:
      return;
  }

  queueSave();
}

function handleClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.id === "open-animal-folder") {
    void window.desktopApi.revealAnimalFolder(state.folderName);
    return;
  }
  if (target.id === "jump-to-facts") {
    scrollToFactsCard();
    return;
  }
  if (target.id === "import-video-file") {
    els.videoImportInput.click();
    return;
  }
  if (target.id === "preview-video-button") {
    if (state.animal.videoMediaUrl) {
      if (els.videoPreview.paused) {
        void els.videoPreview.play();
      } else {
        els.videoPreview.pause();
      }
    } else if (state.draft.settings.videoUrl) {
      const embedUrl = toYouTubeEmbedUrl(state.draft.settings.videoUrl);
      if (embedUrl) {
        els.videoPreview.hidden = true;
        els.videoPreviewFrame.hidden = false;
        els.videoPreviewFrame.src = embedUrl.includes("?")
          ? `${embedUrl}&autoplay=1`
          : `${embedUrl}?autoplay=1`;
      }
    }
    return;
  }
  if (target.id === "close-window") {
    void window.desktopApi.closeCurrentWindow();
    return;
  }

  const action = target.dataset.action;
  const clipId = target.dataset.clipId;
  if (!action || !clipId) {
    return;
  }

  if (action === "import-audio") {
    state.pendingAudioClipId = clipId;
    els.audioImportInput.click();
    return;
  }

  if (action === "preview-audio") {
    void previewClip(clipId);
    return;
  }

  if (action === "record-facts") {
    void openFactsRecorder(clipId);
    return;
  }

  if (action === "import-youtube") {
    void importFromYouTube(clipId);
  }
}

function handlePointerDown(event) {
  if (event.button !== 0) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const track = target.closest(".clip-track");
  if (!track) {
    return;
  }

  const timeline = track.closest(".clip-timeline");
  const clipId = timeline?.dataset.clipId;
  const clip = clipId ? findClip(clipId) : null;
  if (!timeline || !clip) {
    return;
  }

  const durationSec = state.clipDurationById.get(clip.id) || Math.max(Number(clip.endAtSec) || 0, 1);
  const pointerValue = valueFromPointer(track, durationSec, event.clientX);
  const currentStart = clampTimelineValue(clip.startAtSec, 0, durationSec);
  const currentEnd =
    Number(clip.endAtSec) > currentStart
      ? clampTimelineValue(clip.endAtSec, 0, durationSec)
      : durationSec;

  const field =
    Math.abs(pointerValue - currentStart) <= Math.abs(pointerValue - currentEnd)
      ? "startAtSec"
      : "endAtSec";

  state.activeTimelineDrag = {
    pointerId: event.pointerId,
    track,
    clipId: clip.id,
    field,
  };

  event.preventDefault();
  applyClipTimelineChange(clip, field, pointerValue);
}

function handlePointerMove(event) {
  const drag = state.activeTimelineDrag;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  const clip = findClip(drag.clipId);
  if (!clip) {
    return;
  }

  const durationSec = state.clipDurationById.get(clip.id) || Math.max(Number(clip.endAtSec) || 0, 1);
  const pointerValue = valueFromPointer(drag.track, durationSec, event.clientX);
  event.preventDefault();
  applyClipTimelineChange(clip, drag.field, pointerValue);
}

function handlePointerUp(event) {
  const drag = state.activeTimelineDrag;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  state.activeTimelineDrag = null;
  queueSave();
}

async function handleAudioImport() {
  const [file] = Array.from(els.audioImportInput.files || []);
  els.audioImportInput.value = "";
  if (!file || !state.pendingAudioClipId) {
    return;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  setSaveStatus("Importing audio...");
  await window.desktopApi.importAudioClip({
    folderName: state.folderName,
    animalDraft: state.draft,
    clipId: state.pendingAudioClipId,
    label: findClip(state.pendingAudioClipId)?.label || "",
    originalName: file.name,
    bytes,
  });
  state.pendingAudioClipId = "";
  await reloadFromDisk();
}

async function handleVideoImport() {
  const [file] = Array.from(els.videoImportInput.files || []);
  els.videoImportInput.value = "";
  if (!file) {
    return;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  setSaveStatus("Importing video...");
  await window.desktopApi.importVideoFile({
    folderName: state.folderName,
    animalDraft: state.draft,
    originalName: file.name,
    bytes,
  });
  await reloadFromDisk();
}

async function importFromYouTube(clipId) {
  const url = await showPrompt({
    title: "Import Audio From YouTube",
    copy: "Paste a YouTube link. The app will pull the audio into this animal's audio folder if the computer is online.",
    initialValue: "",
  });
  if (!url) {
    return;
  }

  setSaveStatus("Importing from YouTube...");
  await window.desktopApi.importAudioClipFromYouTube({
    folderName: state.folderName,
    animalDraft: state.draft,
    clipId,
    label: findClip(clipId)?.label || "",
    url,
  });
  await reloadFromDisk();
}

async function openFactsRecorder(clipId) {
  const clip = findClip(clipId);
  const loadedClip = state.animal.audioClips.find((entry) => entry.id === clipId);
  if (!clip) {
    return;
  }

  await window.desktopApi.openRecordingWindow({
    mode: "facts-narration",
    folderName: state.folderName,
    animalDraft: state.draft,
    clipId: clip.id,
    clipDraft: clip,
    imageUrl: state.animal.imageUrl || "",
    cropPosition: state.draft.settings.cropPosition || "50% 50%",
    referenceAudioPath: loadedClip?.path || "",
    referenceAudioUrl: loadedClip?.url || "",
  });
  setSaveStatus("Facts recorder opened.");
}

async function previewClip(clipId) {
  if (state.previewClipId === clipId && state.previewAudio) {
    stopPreviewAudio();
    return;
  }

  stopPreviewAudio();

  const clip = findClip(clipId);
  const loadedClip = state.animal.audioClips.find((entry) => entry.id === clipId);
  if (!clip || !loadedClip?.url) {
    return;
  }

  const audio = new Audio(loadedClip.url);
  state.previewAudio = audio;
  state.previewClipId = clipId;
  audio.preload = "auto";
  audio.volume = Math.max(0, Math.min(1, Number(clip.gain) || 1));
  syncClipPreviewButtons();

  audio.addEventListener("loadedmetadata", () => {
    const startAt = Number(clip.startAtSec) || 0;
    const endAt = Number(clip.endAtSec) > startAt ? Number(clip.endAtSec) : audio.duration;
    audio.currentTime = Math.min(startAt, Math.max(0, audio.duration - 0.05));
    void audio.play();

    const previewDurationMs = Math.max(150, (endAt - startAt) * 1000);
    state.previewStopTimerId = window.setTimeout(() => {
      void fadeOutAudio(audio, Number(clip.releaseMs) || 520);
    }, previewDurationMs);
  }, { once: true });
}

function stopPreviewAudio() {
  if (state.previewStopTimerId) {
    window.clearTimeout(state.previewStopTimerId);
    state.previewStopTimerId = 0;
  }

  if (state.previewAudio) {
    state.previewAudio.pause();
    state.previewAudio.currentTime = 0;
    state.previewAudio = null;
  }

  state.previewClipId = "";
  syncClipPreviewButtons();
}

async function fadeOutAudio(audio, releaseMs) {
  const startedAt = performance.now();
  const startVolume = audio.volume;

  await new Promise((resolve) => {
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / Math.max(60, releaseMs));
      audio.volume = startVolume * (1 - progress);
      if (progress >= 1) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  audio.pause();
  audio.currentTime = 0;
  if (state.previewAudio === audio) {
    state.previewAudio = null;
    state.previewClipId = "";
  }
  syncClipPreviewButtons();
}

function applyClipTimelineChange(clip, field, nextValue) {
  const durationSec = state.clipDurationById.get(clip.id) || Math.max(Number(clip.endAtSec) || 0, 1);
  const currentStart = clampTimelineValue(clip.startAtSec, 0, durationSec);
  const currentEnd =
    Number(clip.endAtSec) > currentStart
      ? clampTimelineValue(clip.endAtSec, 0, durationSec)
      : durationSec;
  const rawValue = String(nextValue ?? "").trim();
  const numericValue = clampTimelineValue(
    typeof nextValue === "string" ? parseTimecode(nextValue) : nextValue,
    0,
    durationSec,
  );

  if (field === "startAtSec") {
    clip.startAtSec = Math.min(numericValue, Math.max(0, currentEnd - 0.1));
    if (Number(clip.endAtSec) > 0 && Number(clip.endAtSec) <= clip.startAtSec) {
      clip.endAtSec = Math.min(durationSec, clip.startAtSec + 0.1);
    }
  } else {
    if (!rawValue) {
      clip.endAtSec = 0;
      syncTimelineUi(clip.id);
      return;
    }
    const nextEnd = Math.max(numericValue, clip.startAtSec + 0.1);
    clip.endAtSec = nextEnd >= durationSec - 0.05 ? 0 : nextEnd;
  }

  syncTimelineUi(clip.id);
}

function syncTimelineUi(clipId) {
  const clip = findClip(clipId);
  if (!clip) {
    return;
  }

  const shell = els.clipCards.querySelector(`.clip-timeline[data-clip-id="${CSS.escape(clipId)}"]`);
  if (!shell) {
    return;
  }

  const durationSec = state.clipDurationById.get(clip.id) || Math.max(Number(clip.endAtSec) || 0, 1);
  const startValue = clampTimelineValue(clip.startAtSec, 0, durationSec);
  const storedEnd = Number(clip.endAtSec) || 0;
  const endValue = storedEnd > startValue ? clampTimelineValue(storedEnd, 0, durationSec) : durationSec;

  shell.style.setProperty("--clip-start", `${(startValue / durationSec) * 100}%`);
  shell.style.setProperty("--clip-end", `${(endValue / durationSec) * 100}%`);

  const startRange = shell.querySelector('.clip-range-start');
  const endRange = shell.querySelector('.clip-range-end');
  const startInput = shell.querySelector('input[data-field="startAtSec"]:not(.clip-range)');
  const endInput = shell.querySelector('input[data-field="endAtSec"]:not(.clip-range)');

  if (startRange) {
    startRange.value = String(startValue);
  }
  if (endRange) {
    endRange.value = String(endValue);
  }
  if (startInput) {
    startInput.value = formatTimecode(startValue);
  }
  if (endInput) {
    endInput.value = storedEnd > 0 ? formatTimecode(endValue) : "";
  }
}

async function loadClipDurations(animal) {
  const durationMap = new Map();
  const clips = Array.isArray(animal?.audioClips) ? animal.audioClips : [];

  await Promise.allSettled(
    clips.map(
      (clip) =>
        new Promise((resolve) => {
          if (!clip?.url) {
            resolve();
            return;
          }

          const probe = new Audio();
          const finish = (duration) => {
            if (Number.isFinite(duration) && duration > 0) {
              durationMap.set(clip.id, duration);
            }
            probe.removeAttribute("src");
            resolve();
          };

          probe.preload = "metadata";
          probe.addEventListener("loadedmetadata", () => finish(probe.duration), { once: true });
          probe.addEventListener("error", () => finish(0), { once: true });
          probe.src = clip.url;
        }),
    ),
  );

  return durationMap;
}

function applyManualCrop() {
  const nextPosition = `${els.cropX.value}% ${els.cropY.value}%`;
  state.draft.settings.cropPosition = nextPosition;
  els.cropPositionDisplay.value = nextPosition;
  els.cropPreset.value = PRESET_POSITIONS[nextPosition] ? nextPosition : "manual";
  renderPreview();
}

function queueSave() {
  setSaveStatus("Saving...");
  if (state.saveTimerId) {
    window.clearTimeout(state.saveTimerId);
  }
  state.saveTimerId = window.setTimeout(() => {
    state.saveTimerId = 0;
    void saveNow();
  }, 280);
}

async function saveNow() {
  if (state.saveInFlight) {
    queueSave();
    return;
  }

  state.saveInFlight = true;
  try {
    const payload = await window.desktopApi.saveAnimal(state.folderName, state.draft);
    const latestAnimal = (payload.animals || []).find((entry) => entry.folderName === state.folderName);
    if (latestAnimal) {
      state.animal = latestAnimal;
    }
    setSaveStatus("Saved.");
  } catch (error) {
    console.error(error);
    setSaveStatus("Save failed.");
  } finally {
    state.saveInFlight = false;
  }
}

function createAnimalDraft(animal) {
  return {
    settings: {
      id: animal.id,
      sortOrder: animal.sortOrder,
      displayName: animal.displayName,
      tagline: animal.tagline,
      accentColor: animal.accentColor,
      imageFile: animal.imageFile,
      aboutFile: animal.aboutFile,
      videoFile: animal.videoFile,
      videoUrl: animal.videoUrl || "",
      enabled: animal.enabled,
      cropPosition: animal.cropPosition,
      guestRecorderEnabled: animal.guestRecorderEnabled,
      guestRecorderLabel: animal.guestRecorderLabel,
      audioClips: animal.audioClips.map((clip) => ({
        id: clip.id,
        kind: clip.kind,
        visible: clip.visible,
        label: clip.label,
        file: clip.file,
        performerName: clip.performerName,
        summary: clip.summary,
        gain: clip.gain,
        attackMs: clip.attackMs,
        releaseMs: clip.releaseMs,
        startAtSec: clip.startAtSec,
        endAtSec: clip.endAtSec,
        loopWhileHeld: clip.loopWhileHeld,
      })),
    },
    body: animal.body || "",
    aboutSettings: structuredClone(animal.about || {}),
    aboutBody: animal.aboutBody || "",
  };
}

function findClip(clipId) {
  return state.draft.settings.audioClips.find((clip) => clip.id === clipId) || null;
}

function scrollToFactsCard() {
  const factsClip = (state.draft?.settings?.audioClips || []).find((clip) => clip.kind === "facts");
  if (!factsClip) {
    return;
  }

  const card = document.querySelector(`#clip-card-${CSS.escape(factsClip.id)}`);
  if (!card) {
    return;
  }

  card.scrollIntoView({ behavior: "smooth", block: "start" });
  card.classList.add("is-targeted");
  window.setTimeout(() => {
    card.classList.remove("is-targeted");
  }, 1800);

  const recordButton = card.querySelector('[data-action="record-facts"]');
  if (recordButton instanceof HTMLElement) {
    recordButton.focus({ preventScroll: true });
  }
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseMaybeNumber(value) {
  if (value === "") {
    return "";
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
}

function clampTimelineValue(value, min, max) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return min;
  }
  return Math.min(max, Math.max(min, numericValue));
}

function formatTime(seconds) {
  return formatTimecode(seconds, { dropFraction: true });
}

function formatSecondsValue(value) {
  const numericValue = Math.max(0, Number(value) || 0);
  return numericValue.toFixed(1).replace(/\.0$/, "");
}

function formatTimecode(value, options = {}) {
  const roundedValue = options.dropFraction
    ? Math.round(Math.max(0, Number(value) || 0))
    : Math.round(Math.max(0, Number(value) || 0) * 10) / 10;
  const totalMinutes = Math.floor(roundedValue / 60);
  const seconds = roundedValue - totalMinutes * 60;
  const wholeSeconds = Math.floor(seconds);
  const tenth = Math.round((seconds - wholeSeconds) * 10);

  if (options.dropFraction || tenth === 0) {
    return `${totalMinutes}:${String(Math.round(seconds)).padStart(2, "0")}`;
  }

  return `${totalMinutes}:${String(wholeSeconds).padStart(2, "0")}.${tenth}`;
}

function parseTimecode(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return 0;
  }

  if (/^\d+(\.\d+)?$/.test(raw)) {
    return Number(raw);
  }

  const parts = raw.split(":").map((entry) => entry.trim());
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return Math.max(0, minutes * 60 + seconds);
    }
  }

  if (parts.length === 3) {
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number(parts[2]);
    if (Number.isFinite(hours) && Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return Math.max(0, hours * 3600 + minutes * 60 + seconds);
    }
  }

  return 0;
}

function valueFromPointer(track, durationSec, clientX) {
  const rect = track.getBoundingClientRect();
  const progress = clampTimelineValue((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  return progress * durationSec;
}

function normalizeHexColor(value, fallback) {
  const candidate = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate : fallback;
}

function parseCropPosition(position) {
  const [xRaw = "50%", yRaw = "50%"] = String(position || "50% 50%")
    .replace("left", "0%")
    .replace("center", "50%")
    .replace("right", "100%")
    .replace("top", "0%")
    .replace("bottom", "100%")
    .split(/\s+/);

  return {
    x: Number.parseInt(xRaw, 10) || 50,
    y: Number.parseInt(yRaw, 10) || 50,
  };
}

async function showPrompt({ title, copy, initialValue }) {
  els.promptTitle.textContent = title;
  els.promptCopy.textContent = copy;
  els.promptInput.value = initialValue || "";
  els.promptDialog.showModal();
  els.promptInput.focus();

  return new Promise((resolve) => {
    const closeHandler = () => {
      els.promptDialog.removeEventListener("close", closeHandler);
      resolve(els.promptDialog.returnValue === "confirm" ? els.promptInput.value.trim() : "");
    };
    els.promptDialog.addEventListener("close", closeHandler);
  });
}

function setSaveStatus(message) {
  els.saveStatus.textContent = message;
}

function syncClipPreviewButtons() {
  els.clipCards.querySelectorAll(".clip-preview-toggle").forEach((button) => {
    const isActive = button.dataset.clipId === state.previewClipId && Boolean(state.previewAudio);
    button.textContent = isActive ? "Stop Segment" : "Play Segment";
    button.title = isActive
      ? "Stop the current segment preview."
      : "Play this clip using the current start, end, gain, and release settings.";
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
