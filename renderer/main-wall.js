const i18n = window.MuseumI18n;

const SINGLE_BUTTON_HOLD_MS = 260;

const state = {
  settings: null,
  settingsBody: "",
  animals: [],
  audioContext: null,
  masterGainNode: null,
  bufferCache: new Map(),
  activeVoices: new Set(),
  holdByKey: new Map(),
  activeCounts: new Map(),
  actionMap: new Map(),
  statusTimerId: 0,
  gamepadFrameId: 0,
  gamepadButtonsDown: new Set(),
  currentLanguage: "en",
  pendingSinglePresses: new Map(),
  guessPlayback: null,
  guessing: createIdleGuessState(),
};

const GAMEPAD_BUTTON_NAMES = [
  "A",
  "B",
  "X",
  "Y",
  "LB",
  "RB",
  "LT",
  "RT",
  "View",
  "Menu",
  "LS",
  "RS",
  "DPad Up",
  "DPad Down",
  "DPad Left",
  "DPad Right",
  "Xbox",
];

const els = {
  headerSubtitle: document.querySelector("#header-subtitle"),
  headerTitle: document.querySelector("#header-title"),
  languageLabel: document.querySelector("#language-label"),
  languageSelect: document.querySelector("#language-select"),
  guessingToggle: document.querySelector("#guessing-toggle"),
  statusLive: document.querySelector("#status-live"),
  animalRow: document.querySelector("#animal-row"),
  settingsToggle: document.querySelector("#settings-toggle"),
};

bootstrap().catch((error) => {
  console.error(error);
  setStatus(translate("main.loadError"), 0);
});

async function bootstrap() {
  wireEvents();
  window.desktopApi.onContentChanged(() => {
    void reloadFromDisk({ announce: translate("common.contentUpdated") });
  });
  await reloadFromDisk();
}

function wireEvents() {
  els.settingsToggle.addEventListener("click", () => {
    void window.desktopApi.openAppSettingsWindow();
  });

  els.languageSelect.addEventListener("change", () => {
    void handleLanguageChange();
  });

  els.guessingToggle.addEventListener("click", () => {
    void toggleGuessingMode();
  });

  window.addEventListener("blur", () => releaseAllVoices());
  window.addEventListener("pagehide", () => releaseAllVoices());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      releaseAllVoices();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (!state.settings?.inputInteractionsEnabled || event.repeat || shouldIgnoreKeyEvent(event)) {
      return;
    }

    const normalizedKey = normalizeInputKey(event.key);
    const bindings = getBindingsByInputKey(normalizedKey);
    if (bindings.length === 0) {
      return;
    }

    event.preventDefault();
    bindings.forEach((binding) => {
      handleActionPress(binding.actionId, `keyboard:${binding.actionId}:${normalizedKey}`);
    });
  });

  window.addEventListener("keyup", (event) => {
    if (!state.settings?.inputInteractionsEnabled || shouldIgnoreKeyEvent(event)) {
      return;
    }

    const normalizedKey = normalizeInputKey(event.key);
    const bindings = getBindingsByInputKey(normalizedKey);
    bindings.forEach((binding) => {
      handleActionRelease(binding.actionId, `keyboard:${binding.actionId}:${normalizedKey}`);
    });
  });
}

async function handleLanguageChange() {
  const nextLanguage = i18n.normalizeLanguage(els.languageSelect.value);
  if (nextLanguage === state.currentLanguage) {
    return;
  }

  state.currentLanguage = nextLanguage;
  state.settings.language = nextLanguage;
  renderChrome();
  renderAnimals();
  syncStatus();
  await window.desktopApi.saveAppSettings(state.settings, state.settingsBody);
}

async function toggleGuessingMode() {
  if (isMuseumDisplayMode()) {
    return;
  }
  if (state.guessing.active) {
    stopGuessingMode();
    return;
  }
  await startGuessingMode();
}

async function reloadFromDisk(options = {}) {
  releaseAllVoices();
  setStatus(translate("common.loading"), 0);
  const payload = await window.desktopApi.loadAppData();
  applyLoadedData(payload);
  if (options.announce) {
    setStatus(options.announce, 2200);
  } else {
    syncStatus();
  }
}

function applyLoadedData(payload) {
  state.settings = payload.settings || {};
  state.settingsBody = payload.settingsBody || "";
  state.currentLanguage = i18n.normalizeLanguage(state.settings.language);
  state.animals = Array.isArray(payload.animals) ? payload.animals : [];
  if (isMuseumDisplayMode() && state.guessing.active) {
    state.guessing = createIdleGuessState();
  }
  state.bufferCache = new Map();
  buildActionMap();
  renderChrome();
  renderAnimals();
  syncMasterGain();
  syncGamepadLoop();

  if (state.settings.preloadAudio) {
    void warmAudioBuffers();
  }
}

function renderChrome() {
  document.title = state.settings.windowTitle || "Museum Animal Sound Wall";
  document.body.classList.toggle("ui-mode-touchscreen", !isMuseumDisplayMode());
  document.body.classList.toggle("ui-mode-museum-display", isMuseumDisplayMode());
  els.headerSubtitle.textContent = resolveDisplaySetting(
    state.settings.headerSubtitle,
    "main.headerSubtitle",
  );
  els.headerTitle.textContent = resolveDisplaySetting(
    state.settings.headerTitle,
    "main.headerTitle",
  );
  els.languageLabel.textContent = translate("common.language");
  els.settingsToggle.textContent = translate("common.settings");
  els.guessingToggle.replaceChildren();
  els.guessingToggle.hidden = isMuseumDisplayMode();

  if (!isMuseumDisplayMode()) {
    const guessingLabel = document.createElement("span");
    guessingLabel.textContent = state.guessing.active
      ? translate("main.exitGuessingMode")
      : translate("main.guessingMode");
    els.guessingToggle.appendChild(guessingLabel);

    const guessingBadges = buildBindingBadges("app:guessing-mode", { compact: false });
    if (guessingBadges) {
      els.guessingToggle.appendChild(guessingBadges);
    }
  }

  els.languageSelect.replaceChildren();
  i18n.SUPPORTED_LANGUAGES.forEach((language) => {
    const option = document.createElement("option");
    option.value = language.code;
    option.textContent = language.nativeLabel;
    option.selected = language.code === state.currentLanguage;
    els.languageSelect.appendChild(option);
  });
}

function renderAnimals() {
  els.animalRow.replaceChildren();
  const animals = getLocalizedAnimals().filter((animal) => animal.enabled !== false);
  const museumMode = isMuseumDisplayMode();

  if (animals.length === 0) {
    els.animalRow.appendChild(buildEmptyState());
    return;
  }

  animals.forEach((localizedAnimal) => {
    const rawAnimal = findAnimal(localizedAnimal.folderName);
    const card = document.createElement("article");
    card.className = "animal-card";
    if (museumMode) {
      card.classList.add("museum-display-card");
    }
    card.dataset.folderName = localizedAnimal.folderName;
    card.style.setProperty("--accent", localizedAnimal.accentColor || "#7dd6cf");

    if ((state.activeCounts.get(localizedAnimal.folderName) || 0) > 0 && !state.guessing.active) {
      card.classList.add("is-active");
    }

    if (state.guessing.active) {
      card.classList.add("is-guess-mode");
      if (state.guessing.disabledFolders.includes(localizedAnimal.folderName)) {
        card.classList.add("is-guess-disabled");
      }
    }

    const imagePanel = document.createElement(
      state.guessing.active || !museumMode ? "button" : "div",
    );
    imagePanel.className = "image-panel";
    if (!(imagePanel instanceof HTMLButtonElement) && museumMode) {
      imagePanel.classList.add("display-only");
    }
    if (imagePanel instanceof HTMLButtonElement) {
      imagePanel.type = "button";
      imagePanel.setAttribute(
        "aria-label",
        state.guessing.active
          ? `${translate("main.guessCardHint")} ${localizedAnimal.displayName}`
          : translate("main.openInfoAria", { animal: localizedAnimal.displayName }),
      );
    }

    const image = document.createElement("img");
    image.className = "animal-image";
    image.src = localizedAnimal.imageUrl;
    image.alt = localizedAnimal.displayName || localizedAnimal.folderName;
    image.draggable = false;
    image.style.objectPosition = localizedAnimal.cropPosition || "50% 50%";
    imagePanel.appendChild(image);

    if (imagePanel instanceof HTMLButtonElement) {
      imagePanel.addEventListener("click", () => {
        if (state.guessing.active) {
          void handleGuessChoice(localizedAnimal.folderName);
          return;
        }
        void window.desktopApi.openAnimalInfoWindow(localizedAnimal.folderName);
      });
    }

    const meta = document.createElement("div");
    meta.className = "animal-meta";

    const name = document.createElement("h2");
    name.className = "animal-name";
    name.textContent = localizedAnimal.displayName || localizedAnimal.folderName;

    const scientific = document.createElement("p");
    scientific.className = "scientific-name";
    scientific.innerHTML = `<em>${escapeHtml(
      localizedAnimal.about?.scientificName || "Scientific name coming soon",
    )}</em><span>${escapeHtml(localizedAnimal.about?.scientificPronunciation || "")}</span>`;

    meta.append(name, scientific);

    const clipStack = document.createElement("div");
    clipStack.className = "clip-stack";

    const utilityRow = document.createElement("div");
    utilityRow.className = state.guessing.active ? "utility-row hidden-utility" : "utility-row has-one";

    if (museumMode && !state.guessing.active) {
      card.append(imagePanel, meta, clipStack);
    } else {
      card.append(imagePanel, meta, clipStack, utilityRow);
    }
    els.animalRow.appendChild(card);

    hydrateCardContent(card, imagePanel, clipStack, utilityRow, localizedAnimal, rawAnimal);
  });
}

function hydrateCardContent(card, imagePanel, clipStack, utilityRow, localizedAnimal, rawAnimal) {
  const museumMode = isMuseumDisplayMode();
  const infoBadges =
    !museumMode && !state.guessing.active
      ? buildBindingBadges(infoActionId(localizedAnimal.folderName), { compact: true })
      : null;
  if (infoBadges && imagePanel instanceof HTMLElement) {
    const badgeShell = document.createElement("span");
    badgeShell.className = "image-badge-shell";
    badgeShell.appendChild(infoBadges);
    imagePanel.appendChild(badgeShell);
  }

  if (state.guessing.active) {
    clipStack.appendChild(buildGuessPromptButton(localizedAnimal));
    return;
  }

  if (museumMode) {
    const primarySoundClip = findPrimarySoundClip(rawAnimal);
    const action = primarySoundClip
      ? state.actionMap.get(primarySoundActionId(localizedAnimal.folderName, primarySoundClip.id))
      : null;
    if (action) {
      const shell = document.createElement("div");
      shell.className = "arcade-button-stack";

      const button = document.createElement("button");
      button.className = "arcade-button";
      button.type = "button";
      button.dataset.actionId = action.actionId;
      button.disabled = Boolean(localizedAnimal.loadError);
      button.setAttribute(
        "aria-label",
        translate("main.playAnimalSoundAria", { animal: localizedAnimal.displayName }),
      );
      button.innerHTML = `
        <span class="arcade-button-face">
          <span class="arcade-button-core"></span>
        </span>
      `;
      wirePointerHoldEvents(button, action.actionId, rawAnimal, action.clip);
      shell.appendChild(button);

      const badges = buildBindingBadges(action.actionId, { compact: false });
      if (badges) {
        shell.appendChild(badges);
      }

      clipStack.appendChild(shell);
    }
    return;
  }

  if (state.settings?.wallButtonMode === "single") {
    const action = state.actionMap.get(singleActionId(localizedAnimal.folderName));
    if (action) {
      const button = document.createElement("button");
      button.className = "plastic-button single-mode-button";
      button.type = "button";
      button.dataset.actionId = action.actionId;
      button.disabled = Boolean(localizedAnimal.loadError);
      button.innerHTML = `
        <span class="plastic-button-inner">
          <span class="button-copy">
            <span class="clip-button-label">${escapeHtml(action.soundClip?.label || `${localizedAnimal.displayName} Sounds`)}</span>
            <span class="clip-button-meta">${escapeHtml(action.factsClip ? "Tap for sound / Hold for facts" : "Tap to play the full sound")}</span>
          </span>
        </span>
      `;
      const badges = buildBindingBadges(action.actionId, { compact: false });
      if (badges) {
        button.querySelector(".plastic-button-inner")?.appendChild(badges);
      }
      wireSingleButtonEvents(button, action);
      clipStack.appendChild(button);
    }
  } else {
    localizedAnimal.audioClips
      .filter((clip) => clip.visible !== false)
      .forEach((clip) => {
        const rawClip = rawAnimal.audioClips.find((entry) => entry.id === clip.id);
        if (!rawClip) {
          return;
        }

        const actionId = clipActionId(localizedAnimal.folderName, clip.id);
        const button = document.createElement("button");
        button.className = "plastic-button";
        button.type = "button";
        button.dataset.actionId = actionId;
        button.disabled = Boolean(localizedAnimal.loadError);

        const inner = document.createElement("span");
        inner.className = "plastic-button-inner";

        const copy = document.createElement("span");
        copy.className = "button-copy";

        const label = document.createElement("span");
        label.className = "clip-button-label";
        label.textContent = clip.label || "Play";

        const metaText = document.createElement("span");
        metaText.className = "clip-button-meta";
        const subtitleText = clip.kind === "facts" ? clip.performerName || translate("common.museumGuest") : "";
        metaText.textContent = subtitleText;
        metaText.hidden = !subtitleText;

        copy.append(label, metaText);
        inner.append(copy);

        const badges = buildBindingBadges(actionId, { compact: false });
        if (badges) {
          inner.appendChild(badges);
        }

        button.appendChild(inner);
        wirePointerHoldEvents(button, actionId, rawAnimal, rawClip);
        clipStack.appendChild(button);
      });
  }

  const editButton = document.createElement("button");
  editButton.className = "utility-button icon-button";
  editButton.type = "button";
  editButton.setAttribute(
    "aria-label",
    translate("main.openSettingsAria", { animal: localizedAnimal.displayName }),
  );
  editButton.title = translate("main.openSettingsAria", { animal: localizedAnimal.displayName });
  editButton.innerHTML = `
    <span class="gear-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.58-.23 1.13-.55 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.4A3.4 3.4 0 1 1 12 8.6a3.4 3.4 0 0 1 0 6.8Z"/>
      </svg>
    </span>
    <span class="sr-only">${translate("common.settings")}</span>
  `;
  editButton.addEventListener("click", () => {
    void window.desktopApi.openAnimalSettingsWindow(localizedAnimal.folderName);
  });
  utilityRow?.appendChild(editButton);
}

function buildGuessPromptButton(animal) {
  const button = document.createElement("button");
  button.className = "plastic-button guess-button";
  button.type = "button";
  button.disabled = state.guessing.disabledFolders.includes(animal.folderName);
  button.addEventListener("click", () => {
    void handleGuessChoice(animal.folderName);
  });
  button.innerHTML = `
    <span class="guess-mark">?</span>
    <span class="guess-copy">${escapeHtml(translate("main.guessCardHint"))}</span>
  `;
  return button;
}

function buildBindingBadges(actionId, options = {}) {
  if (!state.settings?.inputInteractionsEnabled || !state.settings?.showInputBadges) {
    return null;
  }

  const bindings = getBindingsForAction(actionId);
  if (bindings.length === 0) {
    return null;
  }

  const shell = document.createElement("span");
  shell.className = options.compact ? "binding-badges compact" : "binding-badges";

  bindings.forEach((binding) => {
    if (binding.keyboardKey) {
      shell.appendChild(buildBadge(binding.keyboardKey, "keyboard"));
    }
    if (binding.altInputKey) {
      shell.appendChild(buildBadge(binding.altInputKey, "alt"));
    }
    if (binding.controllerButton && state.settings.controllerMappingEnabled) {
      shell.appendChild(buildBadge(binding.controllerButton, "controller"));
    }
  });

  return shell.childElementCount > 0 ? shell : null;
}

function buildBadge(label, kind) {
  const badge = document.createElement("span");
  badge.className = `binding-badge ${kind}`;
  badge.textContent = label;
  return badge;
}

function wirePointerHoldEvents(button, actionId, animal, clip) {
  button.addEventListener("pointerdown", (event) => {
    if (state.guessing.active) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    const holdKey = `pointer:${actionId}:${event.pointerId}`;
    if (state.holdByKey.has(holdKey)) {
      return;
    }

    if (typeof button.setPointerCapture === "function") {
      button.setPointerCapture(event.pointerId);
    }

    state.holdByKey.set(holdKey, {
      folderName: animal.folderName,
      actionId,
      voice: null,
    });
    syncHeldVisual(actionId);
    void beginHold(holdKey, actionId, animal, clip);
  });

  const releasePointer = (event) => {
    const holdKey = `pointer:${actionId}:${event.pointerId}`;
    endHold(holdKey);

    if (typeof button.hasPointerCapture === "function" && button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
  };

  button.addEventListener("pointerup", releasePointer);
  button.addEventListener("pointercancel", releasePointer);
  button.addEventListener("lostpointercapture", releasePointer);
}

function wireSingleButtonEvents(button, action) {
  button.addEventListener("pointerdown", (event) => {
    if (state.guessing.active) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    const holdKey = `pointer:${action.actionId}:${event.pointerId}`;
    if (state.pendingSinglePresses.has(holdKey)) {
      return;
    }

    if (typeof button.setPointerCapture === "function") {
      button.setPointerCapture(event.pointerId);
    }

    beginSinglePress(action, holdKey);
  });

  const releasePointer = (event) => {
    const holdKey = `pointer:${action.actionId}:${event.pointerId}`;
    endSinglePress(holdKey);

    if (typeof button.hasPointerCapture === "function" && button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
  };

  button.addEventListener("pointerup", releasePointer);
  button.addEventListener("pointercancel", releasePointer);
  button.addEventListener("lostpointercapture", releasePointer);
}

function createIdleGuessState() {
  return {
    active: false,
    order: [],
    currentIndex: 0,
    currentFolder: "",
    disabledFolders: [],
    attempts: 0,
    isLocked: false,
    nextRoundTimerId: 0,
    idleTimerId: 0,
  };
}

async function startGuessingMode() {
  const eligible = state.animals.filter((animal) => findPrimarySoundClip(animal));
  if (eligible.length === 0) {
    return;
  }

  releaseAllVoices();
  state.guessing = {
    active: true,
    order: shuffle(eligible.map((animal) => animal.folderName)),
    currentIndex: 0,
    currentFolder: "",
    disabledFolders: [],
    attempts: 0,
    isLocked: false,
    nextRoundTimerId: 0,
    idleTimerId: 0,
  };
  renderChrome();
  renderAnimals();
  setStatus(translate("main.guessStart"), 1800);
  await beginGuessRound();
}

function stopGuessingMode(options = {}) {
  clearGuessingTimers();
  stopGuessPlayback();
  state.guessing = createIdleGuessState();
  renderChrome();
  renderAnimals();
  if (options.announce) {
    setStatus(options.announce, 2800);
  } else {
    syncStatus();
  }
}

function clearGuessingTimers() {
  if (state.guessing.nextRoundTimerId) {
    window.clearTimeout(state.guessing.nextRoundTimerId);
  }
  if (state.guessing.idleTimerId) {
    window.clearTimeout(state.guessing.idleTimerId);
  }
  state.guessing.nextRoundTimerId = 0;
  state.guessing.idleTimerId = 0;
}

function armGuessingIdleTimeout() {
  if (!state.guessing.active) {
    return;
  }

  if (state.guessing.idleTimerId) {
    window.clearTimeout(state.guessing.idleTimerId);
  }

  const timeoutSec = Math.max(5, Number(state.settings?.guessingIdleTimeoutSec) || 30);
  state.guessing.idleTimerId = window.setTimeout(() => {
    stopGuessingMode({
      announce: `Guessing mode timed out after ${timeoutSec} seconds. Returning to free play.`,
    });
  }, timeoutSec * 1000);
}

async function beginGuessRound() {
  const nextFolder = state.guessing.order[state.guessing.currentIndex];
  if (!nextFolder) {
    playCelebration("grand");
    setStatus(translate("main.guessComplete"), 3200);
    state.guessing.nextRoundTimerId = window.setTimeout(() => {
      stopGuessingMode();
    }, 2200);
    return;
  }

  stopGuessPlayback();
  state.guessing.currentFolder = nextFolder;
  state.guessing.disabledFolders = [];
  state.guessing.attempts = 0;
  state.guessing.isLocked = false;
  renderChrome();
  renderAnimals();
  setStatus(translate("main.guessPrompt"), 0);
  armGuessingIdleTimeout();
  await replayCurrentGuessSound();
}

async function replayCurrentGuessSound() {
  const animal = findAnimal(state.guessing.currentFolder);
  const clip = findPrimarySoundClip(animal);
  if (!animal || !clip) {
    return;
  }

  stopGuessPlayback();
  state.guessPlayback = await playTrackedClipOnce(animal, clip);
}

async function handleGuessChoice(folderName) {
  if (!state.guessing.active || state.guessing.isLocked) {
    return;
  }
  if (state.guessing.disabledFolders.includes(folderName)) {
    return;
  }

  stopGuessPlayback();

  if (folderName === state.guessing.currentFolder) {
    state.guessing.isLocked = true;
    if (state.settings?.guessingSuccessChimeEnabled !== false) {
      playCelebration("round");
    }
    setStatus(
      translate("main.guessCorrect", {
        animal: findLocalizedAnimal(folderName)?.displayName || findAnimal(folderName)?.displayName || folderName,
      }),
      1600,
    );
    state.guessing.currentIndex += 1;
    state.guessing.nextRoundTimerId = window.setTimeout(() => {
      void beginGuessRound();
    }, 1100);
    return;
  }

  state.guessing.disabledFolders.push(folderName);
  state.guessing.attempts += 1;
  renderAnimals();

  if (state.guessing.attempts >= 2) {
    playCelebration("fail");
    stopGuessingMode({ announce: translate("main.guessFail") });
    return;
  }

  playCelebration("miss");
  setStatus(translate("main.guessRetry"), 2600);
  armGuessingIdleTimeout();
  await replayCurrentGuessSound();
}

function handleActionPress(actionId, holdKey) {
  const action = state.actionMap.get(actionId);
  if (!action) {
    return;
  }

  if (action.type === "museum-sound" && !state.guessing.active) {
    beginMappedHold(actionId, holdKey);
    return;
  }

  if (action.type === "clip" && !state.guessing.active) {
    beginMappedHold(actionId, holdKey);
    return;
  }

  if (action.type === "single" && !state.guessing.active) {
    beginSinglePress(action, holdKey);
    return;
  }

  invokeMappedAction(actionId);
}

function handleActionRelease(actionId, holdKey) {
  const action = state.actionMap.get(actionId);
  if (!action) {
    return;
  }

  if (action.type === "clip" || action.type === "museum-sound") {
    endHold(holdKey);
    return;
  }

  if (action.type === "single") {
    endSinglePress(holdKey);
  }
}

function invokeMappedAction(actionId) {
  const action = state.actionMap.get(actionId);
  if (!action) {
    return;
  }

  if (action.type === "info" && !state.guessing.active) {
    void window.desktopApi.openAnimalInfoWindow(action.folderName);
    return;
  }

  if (action.type === "app" && action.kind === "guessing-mode") {
    void toggleGuessingMode();
  }
}

function beginSinglePress(action, holdKey) {
  if (state.pendingSinglePresses.has(holdKey)) {
    return;
  }

  const pending = {
    actionId: action.actionId,
    animal: action.animal,
    soundClip: action.soundClip,
    factsClip: action.factsClip,
    holdKey,
    timerId: window.setTimeout(() => {
      pending.timerId = 0;
      if (!pending.factsClip) {
        return;
      }
      pending.startedFacts = true;
      state.holdByKey.set(holdKey, {
        folderName: pending.animal.folderName,
        actionId: pending.actionId,
        voice: null,
      });
      syncHeldVisual(pending.actionId);
      void beginHold(holdKey, pending.actionId, pending.animal, pending.factsClip);
    }, SINGLE_BUTTON_HOLD_MS),
    startedFacts: false,
  };

  state.pendingSinglePresses.set(holdKey, pending);
}

function endSinglePress(holdKey) {
  const pending = state.pendingSinglePresses.get(holdKey);
  if (!pending) {
    endHold(holdKey);
    return;
  }

  state.pendingSinglePresses.delete(holdKey);
  if (pending.timerId) {
    window.clearTimeout(pending.timerId);
  }

  if (pending.startedFacts) {
    endHold(holdKey);
    return;
  }

  if (pending.soundClip) {
    void playClipOnce(pending.animal, pending.soundClip);
  }
}

async function beginHold(holdKey, actionId, animal, clip) {
  try {
    const voice = await startHoldAsync(animal, clip);
    const hold = state.holdByKey.get(holdKey);
    if (!hold) {
      releaseVoice(voice);
      return;
    }
    hold.voice = voice;
    hold.actionId = actionId;
    syncStatus();
  } catch (error) {
    console.error(error);
    state.holdByKey.delete(holdKey);
    syncHeldVisual(actionId);
    setStatus(translate("main.couldNotPlay", { label: clip.label || animal.displayName }), 2600);
  }
}

function beginMappedHold(actionId, holdKey) {
  if (state.holdByKey.has(holdKey)) {
    return;
  }

  const action = state.actionMap.get(actionId);
  if (!action || action.type !== "clip") {
    return;
  }

  state.holdByKey.set(holdKey, {
    folderName: action.animal.folderName,
    actionId,
    voice: null,
  });
  syncHeldVisual(actionId);
  void beginHold(holdKey, actionId, action.animal, action.clip);
}

function endHold(holdKey) {
  const hold = state.holdByKey.get(holdKey);
  if (!hold) {
    return;
  }

  state.holdByKey.delete(holdKey);
  releaseVoice(hold.voice);
  syncHeldVisual(hold.actionId);
  syncStatus();
}

function syncHeldVisual(actionId) {
  const isHeld = Array.from(state.holdByKey.values()).some((entry) => entry.actionId === actionId);
  document.querySelectorAll(`.plastic-button[data-action-id="${CSS.escape(actionId)}"]`).forEach((button) => {
    button.classList.toggle("is-held", isHeld);
  });
}

function buildActionMap() {
  state.actionMap = new Map();
  const museumMode = isMuseumDisplayMode();
  const singleMode = state.settings?.wallButtonMode === "single";

  state.animals.forEach((animal) => {
    if (museumMode) {
      const soundClip = findPrimarySoundClip(animal);
      if (soundClip) {
        state.actionMap.set(primarySoundActionId(animal.folderName, soundClip.id), {
          type: "museum-sound",
          actionId: primarySoundActionId(animal.folderName, soundClip.id),
          animal,
          clip: soundClip,
        });
      }
    } else if (singleMode) {
      const soundClip = (animal.audioClips || []).find((clip) => clip.kind === "sound" && clip.visible !== false);
      const factsClip = (animal.audioClips || []).find((clip) => clip.kind === "facts" && clip.visible !== false);
      if (soundClip) {
        state.actionMap.set(singleActionId(animal.folderName), {
          type: "single",
          actionId: singleActionId(animal.folderName),
          animal,
          soundClip,
          factsClip,
        });
      }
    } else {
      (animal.audioClips || []).forEach((clip) => {
        if (clip.visible !== false) {
          state.actionMap.set(clipActionId(animal.folderName, clip.id), {
            type: "clip",
            animal,
            clip,
          });
        }
      });
    }

    if (!museumMode) {
      state.actionMap.set(infoActionId(animal.folderName), {
        type: "info",
        folderName: animal.folderName,
      });
    }
  });

  if (!museumMode) {
    state.actionMap.set("app:guessing-mode", {
      type: "app",
      kind: "guessing-mode",
    });
  }
}

function clipActionId(folderName, clipId) {
  return `${folderName}:${clipId}`;
}

function singleActionId(folderName) {
  return `animal:${folderName}:single`;
}

function infoActionId(folderName) {
  return `animal:${folderName}:info`;
}

function primarySoundActionId(folderName, clipId = "sound") {
  return `${folderName}:${clipId}`;
}

function getBindingsForAction(actionId) {
  const allBindings = Array.isArray(state.settings?.inputBindings)
    ? state.settings.inputBindings
    : [];
  return allBindings.filter(
    (binding) =>
      binding.actionId === actionId &&
      (binding.keyboardKey || binding.altInputKey || binding.controllerButton),
  );
}

function getBindingsByInputKey(key) {
  const allBindings = Array.isArray(state.settings?.inputBindings)
    ? state.settings.inputBindings
    : [];
  const matches = allBindings.filter(
    (binding) => binding.keyboardKey === key || binding.altInputKey === key,
  );
  const seen = new Set();
  return matches.filter((binding) => {
    if (seen.has(binding.actionId)) {
      return false;
    }
    seen.add(binding.actionId);
    return true;
  });
}

function getBindingsByControllerButton(buttonName) {
  const allBindings = Array.isArray(state.settings?.inputBindings)
    ? state.settings.inputBindings
    : [];
  return allBindings.filter((binding) => binding.controllerButton === buttonName);
}

function shouldIgnoreKeyEvent(event) {
  const target = event.target;
  if (!target) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

function normalizeInputKey(key) {
  if (!key) {
    return "";
  }

  if (key === " ") {
    return "Space";
  }
  if (key.length === 1) {
    return key.toUpperCase();
  }
  return key;
}

function syncGamepadLoop() {
  if (state.gamepadFrameId) {
    cancelAnimationFrame(state.gamepadFrameId);
    state.gamepadFrameId = 0;
  }

  if (!state.settings?.inputInteractionsEnabled || !state.settings?.controllerMappingEnabled) {
    releaseMappedGamepadHolds();
    state.gamepadButtonsDown = new Set();
    return;
  }

  const tick = () => {
    pollGamepads();
    state.gamepadFrameId = requestAnimationFrame(tick);
  };

  tick();
}

function pollGamepads() {
  const connectedPads = Array.from(navigator.getGamepads?.() || []).filter(Boolean);
  const gamepad = connectedPads[0];
  const nextDown = new Set();

  if (gamepad) {
    gamepad.buttons.forEach((button, index) => {
      const buttonName = GAMEPAD_BUTTON_NAMES[index];
      if (!buttonName) {
        return;
      }

      if (button.pressed || button.value >= 0.65) {
        nextDown.add(buttonName);
      }
    });
  }

  nextDown.forEach((buttonName) => {
    if (!state.gamepadButtonsDown.has(buttonName)) {
      getBindingsByControllerButton(buttonName).forEach((binding) => {
        handleActionPress(binding.actionId, `gamepad:${binding.actionId}:${buttonName}`);
      });
    }
  });

  state.gamepadButtonsDown.forEach((buttonName) => {
    if (!nextDown.has(buttonName)) {
      getBindingsByControllerButton(buttonName).forEach((binding) => {
        handleActionRelease(binding.actionId, `gamepad:${binding.actionId}:${buttonName}`);
      });
    }
  });

  state.gamepadButtonsDown = nextDown;
}

function releaseMappedGamepadHolds() {
  Array.from(state.holdByKey.keys())
    .filter((holdKey) => holdKey.startsWith("gamepad:"))
    .forEach((holdKey) => endHold(holdKey));
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
  if (!state.audioContext || !state.masterGainNode) {
    return;
  }

  const target = clampNumber(state.settings?.masterGain, 0, 3, 1);
  const now = state.audioContext.currentTime;
  state.masterGainNode.gain.cancelScheduledValues(now);
  state.masterGainNode.gain.setValueAtTime(state.masterGainNode.gain.value, now);
  state.masterGainNode.gain.linearRampToValueAtTime(target, now + 0.04);
}

async function warmAudioBuffers() {
  await ensureAudioSystem({ resume: false });
  const clips = state.animals
    .filter((animal) => animal.enabled !== false && !animal.loadError)
    .flatMap((animal) => animal.audioClips || []);
  await Promise.allSettled(clips.map((clip) => getAudioBuffer(clip)));
}

async function getAudioBuffer(clip) {
  const cacheKey = clip.path;
  if (!cacheKey) {
    throw new Error("Clip is missing an audio file.");
  }

  if (!state.bufferCache.has(cacheKey)) {
    const pendingBuffer = (async () => {
      await ensureAudioSystem({ resume: false });
      const bytes = await window.desktopApi.readBinaryFile(cacheKey);
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return state.audioContext.decodeAudioData(arrayBuffer.slice(0));
    })();
    state.bufferCache.set(cacheKey, pendingBuffer);
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
    clampNumber(state.settings?.defaultAttackMs, 0, 4000, 80),
  );
  const releaseMs = clampNumber(
    clip.releaseMs,
    0,
    8000,
    clampNumber(state.settings?.defaultReleaseMs, 0, 8000, 520),
  );
  const voiceGain = clampNumber(clip.gain, 0, 3, 1);
  const startAtSec = clampNumber(clip.startAtSec, 0, Math.max(0, buffer.duration - 0.05), 0);
  const endAtSec = normalizeClipEnd(clip.endAtSec, buffer.duration, startAtSec);

  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(state.masterGainNode);

  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, voiceGain), now + attackMs / 1000);

  if (clip.loopWhileHeld) {
    source.loop = true;
    source.loopStart = startAtSec;
    source.loopEnd = endAtSec;
  }

  const voice = {
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

  if (clip.loopWhileHeld) {
    source.start(now, startAtSec);
  } else {
    source.start(now, startAtSec, Math.max(0.05, endAtSec - startAtSec));
  }

  return voice;
}

async function playClipOnce(animal, clip) {
  const handle = await playTrackedClipOnce(animal, clip);
  handle.source.onended = () => finalizeOneShot(handle);
}

async function playTrackedClipOnce(animal, clip) {
  await ensureAudioSystem();
  const buffer = await getAudioBuffer(clip);
  const now = state.audioContext.currentTime;
  const source = state.audioContext.createBufferSource();
  const gainNode = state.audioContext.createGain();
  const startAtSec = clampNumber(clip.startAtSec, 0, Math.max(0, buffer.duration - 0.05), 0);
  const endAtSec = normalizeClipEnd(clip.endAtSec, buffer.duration, startAtSec);
  const attackMs = clampNumber(
    clip.attackMs,
    0,
    4000,
    clampNumber(state.settings?.defaultAttackMs, 0, 4000, 80),
  );
  const voiceGain = clampNumber(clip.gain, 0, 3, 1);

  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(state.masterGainNode);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, voiceGain), now + attackMs / 1000);

  const handle = { source, gainNode, stopped: false };
  source.onended = () => finalizeOneShot(handle);
  source.start(now, startAtSec, Math.max(0.08, endAtSec - startAtSec));
  return handle;
}

function stopOneShot(handle) {
  if (!handle || handle.stopped) {
    return;
  }
  handle.stopped = true;
  try {
    handle.source.stop();
  } catch {}
  finalizeOneShot(handle);
}

function finalizeOneShot(handle) {
  if (!handle) {
    return;
  }
  handle.stopped = true;
  try {
    handle.source.disconnect();
  } catch {}
  try {
    handle.gainNode.disconnect();
  } catch {}
}

function stopGuessPlayback() {
  if (state.guessPlayback) {
    stopOneShot(state.guessPlayback);
    state.guessPlayback = null;
  }
}

function playCelebration(kind) {
  void ensureAudioSystem().then(() => {
    const patterns = {
      round: [659.25, 783.99, 880.0, 1046.5],
      grand: [392.0, 523.25, 659.25, 783.99, 1046.5],
      miss: [220.0, 196.0],
      fail: [220.0, 174.61, 164.81],
    };

    const sequence = patterns[kind] || patterns.round;
    const start = state.audioContext.currentTime;

    sequence.forEach((frequency, index) => {
      const oscillator = state.audioContext.createOscillator();
      const gainNode = state.audioContext.createGain();
      oscillator.type = kind === "round" ? "triangle" : kind === "grand" ? "sine" : "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, start + index * 0.1);
      gainNode.gain.setValueAtTime(0.0001, start + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(kind === "round" ? 0.22 : 0.16, start + index * 0.1 + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.1 + 0.24);
      oscillator.connect(gainNode);
      gainNode.connect(state.masterGainNode);
      oscillator.start(start + index * 0.1);
      oscillator.stop(start + index * 0.1 + 0.26);
    });
  });
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
  } catch {}

  try {
    voice.gainNode.disconnect();
  } catch {}

  decrementActive(voice.animal.folderName);
}

function releaseAllVoices() {
  stopGuessPlayback();
  clearGuessingTimers();
  Array.from(state.pendingSinglePresses.values()).forEach((pending) => {
    if (pending.timerId) {
      window.clearTimeout(pending.timerId);
    }
  });
  state.pendingSinglePresses.clear();
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
  state.activeCounts.set(folderName, (state.activeCounts.get(folderName) || 0) + 1);
  syncActiveCard(folderName);
  syncStatus();
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
  document.querySelectorAll(`.animal-card[data-folder-name="${CSS.escape(folderName)}"]`).forEach((card) => {
    card.classList.toggle("is-active", isActive && !state.guessing.active);
  });
}

function syncStatus() {
  if (state.guessing.active) {
    setStatus(translate("main.guessPrompt"), 0);
    return;
  }

  const activeAnimals = Array.from(state.activeCounts.keys());
  if (activeAnimals.length === 0) {
    setStatus(resolveDisplaySetting(state.settings?.idleStatusMessage, "main.idleStatus"), 0);
    return;
  }

  const activeNames = activeAnimals
    .map((folderName) => findLocalizedAnimal(folderName)?.displayName)
    .filter(Boolean);
  setStatus(translate("main.playingStatus", { animals: activeNames.join(", ") }), 0);
}

function setStatus(message, durationMs = 0) {
  if (els.statusLive) {
    els.statusLive.textContent = message;
  }
  if (state.statusTimerId) {
    window.clearTimeout(state.statusTimerId);
    state.statusTimerId = 0;
  }
  if (durationMs > 0) {
    state.statusTimerId = window.setTimeout(() => {
      state.statusTimerId = 0;
      syncStatus();
    }, durationMs);
  }
}

function buildEmptyState() {
  const shell = document.createElement("section");
  shell.className = "empty-state";

  const title = document.createElement("h2");
  title.textContent = translate("main.emptyTitle");

  const body = document.createElement("p");
  body.textContent = translate("main.emptyBody");

  shell.append(title, body);
  return shell;
}

function resolveDisplaySetting(value, path) {
  const trimmed = String(value || "").trim();
  const defaultValues = i18n.SUPPORTED_LANGUAGES.map((language) => i18n.t(language.code, path));
  if (!trimmed || defaultValues.includes(trimmed)) {
    return translate(path);
  }
  return trimmed;
}

function translate(path, replacements) {
  return i18n.t(state.currentLanguage || "en", path, replacements);
}

function findAnimal(folderName) {
  return state.animals.find((animal) => animal.folderName === folderName) || null;
}

function getLocalizedAnimals() {
  return state.animals.map((animal) => i18n.localizeAnimal(animal, state.currentLanguage));
}

function findLocalizedAnimal(folderName) {
  return getLocalizedAnimals().find((animal) => animal.folderName === folderName) || null;
}

function findPrimarySoundClip(animal) {
  return (animal?.audioClips || []).find((clip) => clip.kind === "sound" && clip.visible !== false);
}

function shuffle(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clampNumber(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numericValue));
}

function isMuseumDisplayMode() {
  return state.settings?.uiMode === "museum-display";
}
