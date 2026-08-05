const i18n = window.MuseumI18n;

const state = {
  payload: null,
  settings: null,
  settingsBody: "",
  saveTimerId: 0,
  saveInFlight: false,
  ignoreNextSettingsSavedEvent: false,
  armedInput: null,
  gamepadFrameId: 0,
  controllerButtonsSeen: new Set(),
  activeTab: "titles",
  bindingFilter: "all",
  controllerEditMode: false,
  controllerDrag: null,
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

const GAMEPAD_BUTTON_LAYOUT = [
  { name: "LT", type: "trigger", left: 16, top: 5, scale: 1 },
  { name: "RT", type: "trigger", left: 66, top: 5, scale: 1 },
  { name: "LB", type: "shoulder", left: 17, top: 14, scale: 1 },
  { name: "RB", type: "shoulder", left: 67, top: 14, scale: 1 },
  { name: "Xbox", type: "xbox", left: 46.5, top: 23, scale: 1 },
  { name: "View", type: "menu", left: 39, top: 29, scale: 1 },
  { name: "Menu", type: "menu", left: 54, top: 29, scale: 1 },
  { name: "LS", type: "stick", left: 20, top: 43, scale: 1 },
  { name: "X", type: "button", left: 70, top: 51, scale: 1 },
  { name: "Y", type: "button", left: 77.5, top: 40, scale: 1 },
  { name: "A", type: "button", left: 77.5, top: 61, scale: 1 },
  { name: "B", type: "button", left: 85, top: 51, scale: 1 },
  { name: "RS", type: "stick", left: 52.5, top: 59, scale: 1 },
  { name: "DPad Up", type: "dpad", left: 13, top: 70, scale: 1 },
  { name: "DPad Left", type: "dpad", left: 5.5, top: 79, scale: 1 },
  { name: "DPad Right", type: "dpad", left: 20.5, top: 79, scale: 1 },
  { name: "DPad Down", type: "dpad", left: 13, top: 88, scale: 1 },
];

const els = {
  saveStatus: document.querySelector("#save-status"),
  settingsBody: document.querySelector("#settings-body"),
  controllerVisual: document.querySelector("#controller-visual"),
  actionBindingsList: document.querySelector("#action-bindings-list"),
  bindingFilter: document.querySelector("#binding-filter"),
  touchscreenModeField: document.querySelector("#touchscreen-mode-field"),
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
  openAnimalsFolder: document.querySelector("#open-animals-folder"),
  openAppSettingsFile: document.querySelector("#open-app-settings-file"),
  closeWindow: document.querySelector("#close-window"),
};

bootstrap().catch((error) => {
  console.error(error);
  setSaveStatus("Could not load settings.");
});

async function bootstrap() {
  wireEvents();
  window.desktopApi.onContentChanged((payload) => {
    if (payload?.reason === "settings-saved" && state.ignoreNextSettingsSavedEvent) {
      state.ignoreNextSettingsSavedEvent = false;
      return;
    }
    void reload();
  });
  await reload();
}

function wireEvents() {
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.id === "binding-filter") {
      return;
    }

    if (target.id === "settings-body") {
      state.settingsBody = target.value;
    } else {
      syncDraftSettingsFromInput(target);
    }

    queueSave();
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.id === "binding-filter") {
      state.bindingFilter = target.value || "all";
      renderActionBindings();
      return;
    }

    if (target.id !== "settings-body") {
      syncDraftSettingsFromInput(target);
      queueSave();
    }
  });

  window.addEventListener("keydown", handleArmedKeyboardCapture, true);
  window.addEventListener("pointermove", handleControllerPointerMove);
  window.addEventListener("pointerup", endControllerDrag);
  window.addEventListener("pointercancel", endControllerDrag);

  els.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab || "titles";
      renderTabs();
    });
  });

  els.openAnimalsFolder.addEventListener("click", () => {
    void window.desktopApi.openAnimalsFolder();
  });
  els.openAppSettingsFile.addEventListener("click", () => {
    void window.desktopApi.revealAppSettings();
  });
  els.closeWindow.addEventListener("click", () => {
    void window.desktopApi.closeCurrentWindow();
  });
}

async function reload() {
  const payload = await window.desktopApi.loadAppData();
  state.payload = payload;
  state.settings = structuredClone(payload.settings || {});
  state.settingsBody = payload.settingsBody || "";
  renderForm();
  renderTabs();
  renderBindingFilter();
  renderActionBindings();
  renderControllerVisual();
  syncGamepadCaptureLoop();
  setSaveStatus("Settings ready.");
}

function renderForm() {
  setValue("windowTitle", state.settings.windowTitle);
  setValue("headerTitle", state.settings.headerTitle);
  setValue("headerSubtitle", state.settings.headerSubtitle);
  setValue("idleStatusMessage", state.settings.idleStatusMessage);
  setValue("uiMode", state.settings.uiMode || "touchscreen");
  setValue("wallButtonMode", state.settings.wallButtonMode || "dual");
  setValue("windowWidth", state.settings.windowWidth);
  setValue("windowHeight", state.settings.windowHeight);
  setValue("masterGain", state.settings.masterGain);
  setValue("defaultAttackMs", state.settings.defaultAttackMs);
  setValue("defaultReleaseMs", state.settings.defaultReleaseMs);
  setValue("guessingIdleTimeoutSec", state.settings.guessingIdleTimeoutSec);
  setChecked("preloadAudio", state.settings.preloadAudio);
  setChecked("inputInteractionsEnabled", state.settings.inputInteractionsEnabled);
  setChecked("controllerMappingEnabled", state.settings.controllerMappingEnabled);
  setChecked("showInputBadges", state.settings.showInputBadges);
  setChecked("guessingSuccessChimeEnabled", state.settings.guessingSuccessChimeEnabled);
  els.settingsBody.value = state.settingsBody;
  els.settingsBody.placeholder =
    "Example:\nUSB sound interface is connected to the rear panel.\nUse the Alt Input column for the PS/2 trigger adapter.\nGuest recordings are stored in each animal folder under guest-recordings.";
  syncModeSpecificFields();
}

function renderTabs() {
  els.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === state.activeTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  els.tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === state.activeTab);
  });
}

function renderBindingFilter() {
  if (!els.bindingFilter) {
    return;
  }

  const language = i18n?.normalizeLanguage(state.settings?.language) || "en";
  const visibleAnimals = (state.payload?.animals || [])
    .map((animal) => (i18n?.localizeAnimal ? i18n.localizeAnimal(animal, language) : animal))
    .filter((animal) => animal.enabled !== false)
    .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0));

  const options = [
    { value: "all", label: "All Visible Actions" },
    ...visibleAnimals.map((animal) => ({
      value: animal.folderName,
      label: animal.displayName || animal.folderName,
    })),
  ];

  const nextValue = options.some((option) => option.value === state.bindingFilter)
    ? state.bindingFilter
    : "all";
  state.bindingFilter = nextValue;

  els.bindingFilter.replaceChildren(
    ...options.map((option) => {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = option.label;
      return element;
    }),
  );
  els.bindingFilter.value = nextValue;
}

function renderActionBindings() {
  els.actionBindingsList.replaceChildren();

  const actions = getFilteredActionOptions();
  if (!actions.length) {
    const empty = document.createElement("div");
    empty.className = "mapping-empty";
    empty.innerHTML =
      "<strong>No visible actions here yet.</strong><span>Switch the filter or enable a button on the wall to map it.</span>";
    els.actionBindingsList.appendChild(empty);
    return;
  }

  actions.forEach((action) => {
    const row = document.createElement("div");
    row.className = "mapping-row";

    const copy = document.createElement("div");
    copy.className = "mapping-copy";
    copy.innerHTML = `
      <span class="mapping-animal">${escapeHtml(action.animalName)}</span>
      <strong>${escapeHtml(action.label)}</strong>
      <span>${escapeHtml(action.kindLabel)}</span>
    `;

    const fields = document.createElement("div");
    fields.className = "mapping-fields";

    fields.append(
      buildCaptureField({
        fieldLabel: "Keyboard",
        actionId: action.actionId,
        field: "keyboardKey",
        value: getBindingValue(action.actionId, "keyboardKey"),
        placeholder: "Click then press a key",
      }),
      buildCaptureField({
        fieldLabel: "Alt Input",
        actionId: action.actionId,
        field: "altInputKey",
        value: getBindingValue(action.actionId, "altInputKey"),
        placeholder: "Click then press the PS/2 input",
      }),
      buildCaptureField({
        fieldLabel: "Xbox Controller",
        actionId: action.actionId,
        field: "controllerButton",
        value: getBindingValue(action.actionId, "controllerButton"),
        placeholder: state.settings.controllerMappingEnabled
          ? "Click then press a controller button"
          : "Enable Xbox mapping first",
      }),
    );

    row.append(copy, fields);
    els.actionBindingsList.appendChild(row);
  });
}

function getFilteredActionOptions() {
  const actions = buildActionOptions();
  if (state.bindingFilter === "all") {
    return actions;
  }
  return actions.filter((action) => action.folderName === state.bindingFilter);
}

function buildCaptureField({ fieldLabel, actionId, field, value, placeholder }) {
  const shell = document.createElement("div");
  shell.className = "capture-shell";

  const label = document.createElement("label");
  label.textContent = fieldLabel;

  const input = document.createElement("input");
  input.className = "mapping-input";
  input.type = "text";
  input.readOnly = true;
  input.value = value || "";
  input.placeholder = placeholder;
  input.title =
    field === "keyboardKey"
      ? "Click here, then press the next keyboard key you want to assign."
      : field === "altInputKey"
        ? "Click here, then press the alternate keyboard-style input, including PS/2 adapters that show up as key presses."
        : "Click here, then press the next Xbox controller button you want to assign.";

  if (state.armedInput?.actionId === actionId && state.armedInput?.field === field) {
    input.classList.add("is-armed");
  }

  input.addEventListener("click", () => {
    armInputCapture(actionId, field);
    input.focus();
    input.select();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      clearArmedInput();
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      setBindingValue(actionId, field, "");
      clearArmedInput();
    }
  });

  shell.append(label, input);
  return shell;
}

function renderControllerVisual() {
  els.controllerVisual.replaceChildren();

  const stage = document.createElement("div");
  stage.className = "controller-stage";
  stage.classList.toggle("is-editing", state.controllerEditMode);

  const editBar = document.createElement("div");
  editBar.className = "controller-edit-bar";

  const editToggle = document.createElement("button");
  editToggle.className = "controller-edit-toggle";
  editToggle.type = "button";
  editToggle.setAttribute("aria-pressed", state.controllerEditMode ? "true" : "false");
  editToggle.textContent = state.controllerEditMode ? "Lock Workspace" : "Edit Workspace";
  editToggle.addEventListener("click", () => {
    state.controllerEditMode = !state.controllerEditMode;
    state.controllerDrag = null;
    renderControllerVisual();
  });
  editBar.appendChild(editToggle);

  const grid = document.createElement("div");
  grid.className = "controller-grid";

  const device = document.createElement("div");
  device.className = "controller-device";
  device.innerHTML = `
    <svg class="controller-svg" viewBox="0 0 720 420" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="controllerShell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3f4a54" />
          <stop offset="100%" stop-color="#202932" />
        </linearGradient>
        <linearGradient id="controllerGrip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38434d" />
          <stop offset="100%" stop-color="#131b22" />
        </linearGradient>
      </defs>
      <path class="controller-svg-shell" fill="url(#controllerShell)" d="M163 94c44-36 137-54 195-54s152 18 196 54c33 27 54 76 50 130-3 39-18 78-34 114-10 23-18 42-36 51-24 11-52 0-73-18l-67-58c-10-9-24-14-38-14H364c-14 0-28 5-38 14l-67 58c-21 18-49 29-73 18-18-9-26-28-36-51-16-36-31-75-34-114-4-54 17-103 50-130Z"/>
      <path class="controller-svg-grip" fill="url(#controllerGrip)" d="M144 208c-11 17-22 42-22 80 0 32 10 74 27 100 16 24 31 32 54 32 25 0 49-12 69-30l44-40-33-43-62 54c-13 11-28 14-39 9-10-6-17-20-24-39-10-25-18-54-18-79 0-19 4-34 11-46l-7-2Z"/>
      <path class="controller-svg-grip" fill="url(#controllerGrip)" d="M576 208c11 17 22 42 22 80 0 32-10 74-27 100-16 24-31 32-54 32-25 0-49-12-69-30l-44-40 33-43 62 54c13 11 28 14 39 9 10-6 17-20 24-39 10-25 18-54 18-79 0-19-4-34-11-46l7-2Z"/>
      <rect x="165" y="58" width="105" height="36" rx="18" class="controller-svg-shoulder"/>
      <rect x="450" y="58" width="105" height="36" rx="18" class="controller-svg-shoulder"/>
      <rect x="175" y="31" width="94" height="32" rx="16" class="controller-svg-trigger"/>
      <rect x="451" y="31" width="94" height="32" rx="16" class="controller-svg-trigger"/>
      <circle cx="238" cy="207" r="52" class="controller-svg-stick-base"/>
      <circle cx="238" cy="207" r="30" class="controller-svg-stick-cap"/>
      <circle cx="485" cy="270" r="52" class="controller-svg-stick-base"/>
      <circle cx="485" cy="270" r="30" class="controller-svg-stick-cap"/>
      <rect x="195" y="257" width="88" height="88" rx="20" class="controller-svg-dpad"/>
      <rect x="228" y="268" width="22" height="66" rx="10" class="controller-svg-dpad-cross"/>
      <rect x="206" y="290" width="66" height="22" rx="10" class="controller-svg-dpad-cross"/>
      <circle cx="549" cy="206" r="26" class="controller-svg-button-y"/>
      <circle cx="515" cy="241" r="26" class="controller-svg-button-x"/>
      <circle cx="549" cy="277" r="26" class="controller-svg-button-a"/>
      <circle cx="584" cy="241" r="26" class="controller-svg-button-b"/>
      <circle cx="323" cy="142" r="16" class="controller-svg-menu"/>
      <circle cx="360" cy="127" r="20" class="controller-svg-xbox"/>
      <circle cx="397" cy="142" r="16" class="controller-svg-menu"/>
    </svg>
  `;

  const labelByButton = new Map();
  buildActionOptions().forEach((action) => {
    const controllerButton = getBindingValue(action.actionId, "controllerButton");
    if (controllerButton) {
      labelByButton.set(controllerButton, action.label);
    }
  });

  GAMEPAD_BUTTON_LAYOUT.forEach((button) => {
    const assignedLabel = labelByButton.get(button.name) || "";
    const visual = getControllerVisual(button.name);
    const shell = document.createElement("div");
    shell.className = `controller-node ${button.type}`;
    shell.dataset.buttonName = button.name;
    shell.style.left = `${visual.left}%`;
    shell.style.top = `${visual.top}%`;
    shell.style.setProperty("--node-scale", visual.scale);
    if (assignedLabel) {
      shell.classList.add("is-assigned");
    }
    if (state.controllerEditMode) {
      shell.classList.add("is-editable");
      shell.addEventListener("pointerdown", (event) => beginControllerDrag(event, button.name, "move", grid));
    }

    const name = document.createElement("strong");
    name.textContent = button.name;
    shell.appendChild(name);

    if (assignedLabel) {
      const detail = document.createElement("small");
      detail.textContent = abbreviateAssignmentLabel(assignedLabel);
      shell.appendChild(detail);
      shell.title = `${button.name}: ${assignedLabel}`;
    } else {
      shell.title = `${button.name}: not assigned`;
    }

    if (state.controllerEditMode) {
      const resizeHandle = document.createElement("span");
      resizeHandle.className = "controller-resize-handle";
      resizeHandle.title = `Scale ${button.name}`;
      resizeHandle.addEventListener("pointerdown", (event) => beginControllerDrag(event, button.name, "scale", grid));
      shell.appendChild(resizeHandle);
    }

    device.appendChild(shell);
  });

  grid.appendChild(device);
  stage.append(editBar, grid);

  const summary = document.createElement("div");
  summary.className = "controller-summary";
  const assignedEntries = Array.from(labelByButton.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  const summaryCard = document.createElement("section");
  summaryCard.className = "controller-summary-card";
  summaryCard.innerHTML = `
    <h3>Controller Deck</h3>
    <p>Click a controller field first, then press the very next Xbox button you want. Assignment happens on that first press, so there is no hold-to-map step.</p>
    <ul>
      <li>Use <strong>Alt Input</strong> for PS/2-to-USB trigger adapters that arrive as normal key presses.</li>
      <li>Use <strong>Keyboard</strong> for staff shortcuts on a regular keyboard.</li>
      <li>Turn off <strong>Show Hotkey Badges</strong> if you want a cleaner public wall.</li>
    </ul>
  `;

  const assignmentCard = document.createElement("section");
  assignmentCard.className = "controller-assignment-list";
  const assignmentTitle = document.createElement("h3");
  assignmentTitle.textContent = assignedEntries.length
    ? `${assignedEntries.length} Controller Mappings`
    : "No Controller Mappings Yet";

  const assignmentList = document.createElement("ul");
  assignmentList.className = "assignment-list";

  if (assignedEntries.length === 0) {
    const empty = document.createElement("li");
    empty.innerHTML = "<strong>Start Assigning</strong><span>Click an Xbox field below, then press the next controller button you want to map.</span>";
    assignmentList.appendChild(empty);
  } else {
    assignedEntries.forEach(([buttonName, actionLabel]) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${escapeHtml(buttonName)}</strong><span>${escapeHtml(actionLabel)}</span>`;
      assignmentList.appendChild(item);
    });
  }

  assignmentCard.append(assignmentTitle, assignmentList);
  summary.append(summaryCard, assignmentCard);

  els.controllerVisual.append(stage, summary);
}

function getControllerVisual(buttonName) {
  const defaults = GAMEPAD_BUTTON_LAYOUT.find((button) => button.name === buttonName) || {
    left: 50,
    top: 50,
    scale: 1,
  };
  const saved = state.settings?.controllerVisualLayout?.[buttonName] || {};
  return {
    left: clampNumber(saved.left, -45, 145, defaults.left),
    top: clampNumber(saved.top, -20, 120, defaults.top),
    scale: clampNumber(saved.scale, 0.55, 2.2, defaults.scale || 1),
  };
}

function setControllerVisual(buttonName, visual) {
  state.settings.controllerVisualLayout =
    state.settings.controllerVisualLayout && typeof state.settings.controllerVisualLayout === "object"
      ? state.settings.controllerVisualLayout
      : {};
  state.settings.controllerVisualLayout[buttonName] = {
    left: Number(visual.left.toFixed(2)),
    top: Number(visual.top.toFixed(2)),
    scale: Number(visual.scale.toFixed(2)),
  };
}

function beginControllerDrag(event, buttonName, mode, device) {
  if (!state.controllerEditMode) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const rect = device.getBoundingClientRect();
  const visual = getControllerVisual(buttonName);
  state.controllerDrag = {
    buttonName,
    mode,
    rect,
    startX: event.clientX,
    startY: event.clientY,
    visual,
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function handleControllerPointerMove(event) {
  const drag = state.controllerDrag;
  if (!drag) {
    return;
  }

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  const next = { ...drag.visual };

  if (drag.mode === "scale") {
    next.scale = clampNumber(drag.visual.scale + (dx + dy) / 220, 0.55, 2.2, drag.visual.scale);
  } else {
    next.left = clampNumber(drag.visual.left + (dx / drag.rect.width) * 100, -45, 145, drag.visual.left);
    next.top = clampNumber(drag.visual.top + (dy / drag.rect.height) * 100, -20, 120, drag.visual.top);
  }

  setControllerVisual(drag.buttonName, next);
  const node = els.controllerVisual.querySelector(`[data-button-name="${CSS.escape(drag.buttonName)}"]`);
  if (node) {
    node.style.left = `${next.left}%`;
    node.style.top = `${next.top}%`;
    node.style.setProperty("--node-scale", next.scale);
  }
}

function endControllerDrag() {
  if (!state.controllerDrag) {
    return;
  }

  state.controllerDrag = null;
  queueSave();
}

function buildActionOptions() {
  const language = i18n?.normalizeLanguage(state.settings?.language) || "en";
  const localizedAnimals = (state.payload?.animals || []).map((animal) =>
    i18n?.localizeAnimal ? i18n.localizeAnimal(animal, language) : animal,
  );
  const museumMode = state.settings?.uiMode === "museum-display";
  const wallButtonMode = state.settings?.wallButtonMode === "single" ? "single" : "dual";

  const actions = localizedAnimals
    .filter((animal) => animal.enabled !== false)
    .flatMap((animal) => {
      const entries = [];

      if (museumMode) {
        const soundClip = (animal.audioClips || []).find((clip) => clip.kind === "sound" && clip.visible !== false);
        if (soundClip) {
          entries.push({
            actionId: `${animal.folderName}:${soundClip.id}`,
            label: soundClip.label,
            animalName: animal.displayName,
            folderName: animal.folderName,
            kindLabel: "Round sound button",
          });
        }
      } else if (wallButtonMode === "single") {
        entries.push({
          actionId: `animal:${animal.folderName}:single`,
          label: `${animal.displayName} Button`,
          animalName: animal.displayName,
          folderName: animal.folderName,
          kindLabel: "Tap for sound, hold for facts",
        });
      } else {
        entries.push(
          ...(animal.audioClips || [])
            .filter((clip) => clip.visible !== false)
            .map((clip) => ({
              actionId: `${animal.folderName}:${clip.id}`,
              label: clip.label,
              animalName: animal.displayName,
              folderName: animal.folderName,
              kindLabel: clip.kind === "facts" ? "Spoken facts button" : "Animal sound button",
            })),
        );
      }

      if (!museumMode) {
        entries.push({
          actionId: `animal:${animal.folderName}:info`,
          label: i18n?.t ? i18n.t(language, "main.infoAction", { animal: animal.displayName }) : `${animal.displayName} Details`,
          animalName: animal.displayName,
          folderName: animal.folderName,
          kindLabel: "Image tap / detail window",
        });
      }

      return entries;
    });

  if (!museumMode) {
    actions.push({
      actionId: "app:guessing-mode",
      label: i18n?.t ? i18n.t(language, "app.guessModeAction") : "Guessing Mode",
      animalName: i18n?.t ? i18n.t(language, "main.headerSubtitle") : "Interactive Museum Display",
      folderName: "app",
      kindLabel: "Whole-wall game action",
    });
  }

  return actions;
}

function handleArmedKeyboardCapture(event) {
  if (!state.armedInput || state.armedInput.field === "controllerButton") {
    return;
  }

  const target = event.target;
  const isMappingField = target instanceof HTMLInputElement && target.classList.contains("mapping-input");
  if (!isMappingField && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    clearArmedInput();
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    setBindingValue(state.armedInput.actionId, state.armedInput.field, "");
    clearArmedInput();
    return;
  }

  setBindingValue(state.armedInput.actionId, state.armedInput.field, normalizeInputKey(event.key));
  clearArmedInput();
}

function armInputCapture(actionId, field) {
  if (field === "controllerButton" && !state.settings.controllerMappingEnabled) {
    return;
  }

  state.armedInput = { actionId, field };
  if (field === "controllerButton") {
    state.controllerButtonsSeen = new Set(getPressedGamepadButtons());
  }
  renderActionBindings();
  syncGamepadCaptureLoop();
}

function clearArmedInput() {
  state.armedInput = null;
  state.controllerButtonsSeen = new Set();
  renderActionBindings();
  syncGamepadCaptureLoop();
}

function getBindingValue(actionId, field) {
  const binding = ensureBinding(actionId, false);
  return binding ? binding[field] || "" : "";
}

function ensureBinding(actionId, createIfMissing = true) {
  state.settings.inputBindings = Array.isArray(state.settings.inputBindings)
    ? state.settings.inputBindings
    : [];

  const existing = state.settings.inputBindings.find((binding) => binding.actionId === actionId);
  if (existing || !createIfMissing) {
    return existing || null;
  }

  const created = { actionId, keyboardKey: "", altInputKey: "", controllerButton: "" };
  state.settings.inputBindings.push(created);
  return created;
}

function setBindingValue(actionId, field, value) {
  const binding = ensureBinding(actionId, true);
  const normalizedValue = String(value || "").trim();

  if (normalizedValue) {
    state.settings.inputBindings.forEach((entry) => {
      if (entry.actionId !== actionId && entry[field] === normalizedValue) {
        entry[field] = "";
      }
    });
  }

  binding[field] = normalizedValue;
  state.settings.inputBindings = state.settings.inputBindings.filter(
    (entry) => entry.keyboardKey || entry.altInputKey || entry.controllerButton,
  );

  renderActionBindings();
  renderControllerVisual();
  queueSave();
}

function syncDraftSettingsFromInput(target) {
  const name = target.name;
  if (!name) {
    return;
  }

  switch (name) {
    case "windowTitle":
    case "headerTitle":
    case "headerSubtitle":
    case "idleStatusMessage":
      state.settings[name] = target.value;
      break;
    case "uiMode":
      state.settings.uiMode = target.value === "museum-display" ? "museum-display" : "touchscreen";
      syncModeSpecificFields();
      renderBindingFilter();
      renderActionBindings();
      renderControllerVisual();
      break;
    case "wallButtonMode":
      state.settings.wallButtonMode = target.value === "single" ? "single" : "dual";
      renderBindingFilter();
      renderActionBindings();
      renderControllerVisual();
      break;
    case "windowWidth":
      state.settings.windowWidth = Number(target.value) || 1680;
      break;
    case "windowHeight":
      state.settings.windowHeight = Number(target.value) || 760;
      break;
    case "masterGain":
      state.settings.masterGain = Number(target.value) || 1;
      break;
    case "defaultAttackMs":
      state.settings.defaultAttackMs = Number(target.value) || 80;
      break;
    case "defaultReleaseMs":
      state.settings.defaultReleaseMs = Number(target.value) || 520;
      break;
    case "guessingIdleTimeoutSec":
      state.settings.guessingIdleTimeoutSec = Math.max(5, Number(target.value) || 30);
      break;
    case "preloadAudio":
      state.settings.preloadAudio = target.checked;
      break;
    case "inputInteractionsEnabled":
      state.settings.inputInteractionsEnabled = target.checked;
      renderControllerVisual();
      renderActionBindings();
      syncGamepadCaptureLoop();
      break;
    case "controllerMappingEnabled":
      state.settings.controllerMappingEnabled = target.checked;
      if (!target.checked && state.armedInput?.field === "controllerButton") {
        clearArmedInput();
      }
      renderControllerVisual();
      renderActionBindings();
      syncGamepadCaptureLoop();
      break;
    case "showInputBadges":
      state.settings.showInputBadges = target.checked;
      break;
    case "guessingSuccessChimeEnabled":
      state.settings.guessingSuccessChimeEnabled = target.checked;
      break;
    default:
      break;
  }
}

function queueSave() {
  setSaveStatus("Saving...");
  if (state.saveTimerId) {
    window.clearTimeout(state.saveTimerId);
  }
  state.saveTimerId = window.setTimeout(() => {
    state.saveTimerId = 0;
    void saveNow();
  }, 260);
}

async function saveNow() {
  if (state.saveInFlight) {
    queueSave();
    return;
  }

  state.saveInFlight = true;
  try {
    state.ignoreNextSettingsSavedEvent = true;
    await window.desktopApi.saveAppSettings(state.settings, state.settingsBody);
    setSaveStatus("Saved.");
  } catch (error) {
    console.error(error);
    state.ignoreNextSettingsSavedEvent = false;
    setSaveStatus("Save failed.");
  } finally {
    state.saveInFlight = false;
  }
}

function syncGamepadCaptureLoop() {
  if (state.gamepadFrameId) {
    cancelAnimationFrame(state.gamepadFrameId);
    state.gamepadFrameId = 0;
  }

  if (!state.armedInput || state.armedInput.field !== "controllerButton" || !state.settings.controllerMappingEnabled) {
    return;
  }

  const tick = () => {
    const pressedButtons = getPressedGamepadButtons();
    const nextPressedSet = new Set(pressedButtons);
    const firstNewPress = pressedButtons.find((buttonName) => !state.controllerButtonsSeen.has(buttonName));

    if (firstNewPress) {
      setBindingValue(state.armedInput.actionId, "controllerButton", firstNewPress);
      clearArmedInput();
      return;
    }

    state.controllerButtonsSeen = nextPressedSet;
    if (state.armedInput?.field === "controllerButton") {
      state.gamepadFrameId = requestAnimationFrame(tick);
    }
  };

  tick();
}

function getPressedGamepadButtons() {
  const gamepad = Array.from(navigator.getGamepads?.() || []).find(Boolean);
  if (!gamepad) {
    return [];
  }

  return gamepad.buttons.flatMap((button, index) => {
    const buttonName = GAMEPAD_BUTTON_NAMES[index];
    if (!buttonName) {
      return [];
    }
    return button.pressed || button.value >= 0.65 ? [buttonName] : [];
  });
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

function abbreviateAssignmentLabel(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) {
    return "";
  }
  if (cleaned.length <= 11) {
    return cleaned;
  }
  return `${cleaned.slice(0, 10)}...`;
}

function clampNumber(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numericValue));
}

function setValue(name, value) {
  const element = document.querySelector(`[name="${name}"]`);
  if (element) {
    element.value = value ?? "";
  }
}

function setChecked(name, checked) {
  const element = document.querySelector(`[name="${name}"]`);
  if (element) {
    element.checked = Boolean(checked);
  }
}

function setSaveStatus(message) {
  els.saveStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function syncModeSpecificFields() {
  if (!els.touchscreenModeField) {
    return;
  }
  els.touchscreenModeField.hidden = state.settings?.uiMode === "museum-display";
}
