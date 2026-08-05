const state = {
  sessionId: new URLSearchParams(window.location.search).get("sessionId"),
  session: null,
  stream: null,
  mediaRecorder: null,
  recordedBlob: null,
  recordedUrl: "",
  referenceAudio: null,
  chunks: [],
  timerId: 0,
  maxDurationTimerId: 0,
  startedAt: 0,
  teleprompterEnabled: true,
  teleprompterTimerId: 0,
  teleprompterWordIndex: -1,
  teleprompterWords: [],
};

const els = {
  recordingKicker: document.querySelector("#recording-kicker"),
  recordingTitle: document.querySelector("#recording-title"),
  recordingSubtitle: document.querySelector("#recording-subtitle"),
  promptPanelTitle: document.querySelector("#prompt-panel-title"),
  promptImage: document.querySelector("#prompt-image"),
  keyFactsList: document.querySelector("#key-facts-list"),
  scienceList: document.querySelector("#science-list"),
  question35: document.querySelector("#question-3-5"),
  question58: document.querySelector("#question-5-8"),
  question813: document.querySelector("#question-8-13"),
  clipLabel: document.querySelector("#clip-label"),
  narratorLabel: document.querySelector("#narrator-label"),
  narratorName: document.querySelector("#narrator-name"),
  audioInputSelect: document.querySelector("#audio-input-select"),
  modeNote: document.querySelector("#mode-note"),
  micStatus: document.querySelector("#mic-status"),
  timerPill: document.querySelector("#timer-pill"),
  refreshInputs: document.querySelector("#refresh-inputs"),
  playReference: document.querySelector("#play-reference"),
  startRecording: document.querySelector("#start-recording"),
  stopRecording: document.querySelector("#stop-recording"),
  saveRecording: document.querySelector("#save-recording"),
  audioPreview: document.querySelector("#audio-preview"),
  scriptTitle: document.querySelector("#script-title"),
  scriptScroller: document.querySelector("#script-scroller"),
  scriptBody: document.querySelector("#script-body"),
  teleprompterToggle: document.querySelector("#teleprompter-toggle"),
  narratorDialog: document.querySelector("#narrator-dialog"),
  narratorDialogInput: document.querySelector("#narrator-dialog-input"),
  closeWindow: document.querySelector("#close-window"),
};

bootstrap().catch((error) => {
  console.error(error);
  setMicStatus("The recording window could not load its session.");
});

async function bootstrap() {
  wireEvents();

  if (!state.sessionId) {
    throw new Error("Missing recording session id.");
  }

  const session = await window.desktopApi.loadRecordingSession(state.sessionId);
  if (!session) {
    throw new Error("Recording session expired.");
  }

  state.session = session;
  renderSession(session);
  await primeAudioInputs();
}

function wireEvents() {
  els.refreshInputs.addEventListener("click", () => {
    void populateAudioInputs();
  });
  els.playReference.addEventListener("click", () => {
    void toggleReferenceAudio();
  });
  els.startRecording.addEventListener("click", () => {
    void startRecording();
  });
  els.stopRecording.addEventListener("click", () => stopRecording());
  els.saveRecording.addEventListener("click", () => {
    void saveRecording();
  });
  els.teleprompterToggle.addEventListener("click", () => {
    toggleTeleprompterMode();
  });
  els.closeWindow.addEventListener("click", () => {
    void window.desktopApi.closeCurrentWindow();
  });

  window.addEventListener("beforeunload", () => {
    stopTimer();
    stopTeleprompter({ reset: true });
    stopStream();
    releasePreviewUrl();
    stopReferenceAudio();
  });

  if (navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", () => {
      void populateAudioInputs();
    });
  }
}

function renderSession(session) {
  const mode = session.mode || "facts-narration";
  const displayName =
    session?.animalDraft?.aboutSettings?.animalName ||
    session?.animalDraft?.settings?.displayName ||
    "Animal";
  const clipLabel =
    mode === "guest-copy"
      ? session.referenceLabel || "Copy This Sound"
      : session?.clipDraft?.label || "Creature Facts";
  const about = session?.animalDraft?.aboutSettings || {};
  const script =
    mode === "guest-copy"
      ? buildGuestScript(session)
      : session?.animalDraft?.aboutBody || buildFallbackScript(session);

  document.title = `${displayName} Recorder`;
  els.recordingTitle.textContent = `${displayName} | ${clipLabel}`;
  els.recordingSubtitle.textContent =
    "Uses the computer's default microphone unless you choose a different input below.";
  els.clipLabel.value = clipLabel;
  els.narratorName.value = session?.clipDraft?.performerName || "";
  els.promptImage.src = session?.imageUrl || "";
  els.promptImage.alt = displayName;
  els.promptImage.style.objectPosition = session?.cropPosition || "50% 50%";
  els.question35.textContent = about.curiousQuestionAge3To5 || "No question added yet.";
  els.question58.textContent = about.curiousQuestionAge5To8 || "No question added yet.";
  els.question813.textContent = about.curiousQuestionAge8To13 || "No question added yet.";
  renderScript(script);

  fillList(els.keyFactsList, about.keyFacts || []);
  fillList(els.scienceList, about.scienceHighlights || []);

  if (mode === "guest-copy") {
    els.recordingKicker.textContent = "Guest Sound Recorder";
    els.promptPanelTitle.textContent = "Animal Sound Reference";
    els.narratorLabel.textContent = "Guest Name";
    els.narratorName.placeholder = "Museum Guest";
    els.modeNote.textContent =
      "Guest copy recordings are limited to 15 seconds and stored with a time stamp for staff review.";
    els.scriptTitle.textContent = "Try The Animal Sound";
    els.teleprompterToggle.hidden = false;
  } else {
    els.recordingKicker.textContent = "Creature Facts Recorder";
    els.promptPanelTitle.textContent = "Facts And Science";
    els.narratorLabel.textContent = "Voice Name";
    els.narratorName.placeholder = "Museum Guest";
    els.modeNote.textContent =
      "If no name is entered, this facts recording will be saved as Museum Guest.";
    els.scriptTitle.textContent = "Read This Into The Mic";
    els.teleprompterToggle.hidden = false;
  }

  els.playReference.disabled = !session.referenceAudioUrl && !session.referenceAudioPath;
  syncTeleprompterButton();
}

function fillList(listElement, items) {
  listElement.replaceChildren();
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    listElement.appendChild(li);
  });
}

function buildFallbackScript(session) {
  const animalName = session?.animalDraft?.aboutSettings?.animalName || "This animal";
  const facts = session?.animalDraft?.aboutSettings?.keyFacts || [];
  const science = session?.animalDraft?.aboutSettings?.scienceHighlights || [];
  const question = session?.animalDraft?.aboutSettings?.curiousQuestionAge8To13 || "";

  return [animalName, facts[0] || "", facts[1] || "", science[0] || "", question || ""]
    .filter(Boolean)
    .join(" ");
}

function buildGuestScript(session) {
  const animalName =
    session?.animalDraft?.aboutSettings?.animalName ||
    session?.animalDraft?.settings?.displayName ||
    "This animal";
  return [
    `Try your best ${animalName} sound.`,
    "Listen to the reference sound first if you want.",
    "You have up to 15 seconds.",
    "Say your name if you want staff to save it for your family, or leave it blank to save as Museum Guest.",
  ].join(" ");
}

function renderScript(script) {
  const paragraphs = String(script || "")
    .split(/\r?\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  els.scriptBody.replaceChildren();
  state.teleprompterWords = [];
  state.teleprompterWordIndex = -1;

  (paragraphs.length ? paragraphs : ["No script has been added yet."]).forEach((paragraph) => {
    const block = document.createElement("p");
    block.className = "script-paragraph";

    paragraph.split(/\s+/).forEach((word, index, words) => {
      const span = document.createElement("span");
      span.className = "script-word";
      span.textContent = word;
      state.teleprompterWords.push(span);
      block.appendChild(span);
      if (index < words.length - 1) {
        block.appendChild(document.createTextNode(" "));
      }
    });

    els.scriptBody.appendChild(block);
  });

  if (els.scriptScroller) {
    els.scriptScroller.scrollTop = 0;
  }
}

async function primeAudioInputs() {
  try {
    const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    tempStream.getTracks().forEach((track) => track.stop());
    await populateAudioInputs();
    setMicStatus("Ready. The recorder will use the default microphone unless you switch devices.");
  } catch (error) {
    console.error(error);
    await populateAudioInputs();
    setMicStatus("Microphone access was blocked or unavailable. You can try refreshing inputs.");
  }
}

async function populateAudioInputs() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter((device) => device.kind === "audioinput");
  const previousValue = els.audioInputSelect.value || "default";

  els.audioInputSelect.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "default";
  defaultOption.textContent = "System Default Microphone";
  els.audioInputSelect.appendChild(defaultOption);

  audioInputs
    .filter((device) => device.deviceId !== "default")
    .forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label || `Microphone ${index + 1}`;
      els.audioInputSelect.appendChild(option);
    });

  els.audioInputSelect.value = Array.from(els.audioInputSelect.options).some(
    (option) => option.value === previousValue,
  )
    ? previousValue
    : "default";
}

async function toggleReferenceAudio() {
  if (!state.session?.referenceAudioUrl) {
    return;
  }

  if (state.referenceAudio && !state.referenceAudio.paused) {
    stopReferenceAudio();
    return;
  }

  stopReferenceAudio();
  state.referenceAudio = new Audio(state.session.referenceAudioUrl);
  state.referenceAudio.addEventListener("ended", () => {
    stopReferenceAudio();
  }, { once: true });
  await state.referenceAudio.play();
}

function stopReferenceAudio() {
  if (state.referenceAudio) {
    state.referenceAudio.pause();
    state.referenceAudio.currentTime = 0;
    state.referenceAudio = null;
  }
}

async function startRecording() {
  if (state.mediaRecorder?.state === "recording") {
    return;
  }

  releasePreviewUrl();
  state.recordedBlob = null;
  state.chunks = [];
  els.saveRecording.disabled = true;
  els.audioPreview.removeAttribute("src");

  const selectedInput = els.audioInputSelect.value;
  const constraints =
    selectedInput && selectedInput !== "default"
      ? { audio: { deviceId: { exact: selectedInput } } }
      : { audio: true };

  try {
    state.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const mimeType = pickSupportedMimeType();
    state.mediaRecorder = mimeType
      ? new MediaRecorder(state.stream, { mimeType })
      : new MediaRecorder(state.stream);

    state.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        state.chunks.push(event.data);
      }
    });

    state.mediaRecorder.addEventListener("stop", () => {
      const blobType = state.mediaRecorder?.mimeType || mimeType || "audio/webm";
      state.recordedBlob = new Blob(state.chunks, { type: blobType });
      state.recordedUrl = URL.createObjectURL(state.recordedBlob);
      els.audioPreview.src = state.recordedUrl;
      els.saveRecording.disabled = false;
      stopStream();
      stopTimer();
      setMicStatus("Recording stopped. Preview it, then save when you're ready.");
    });

    state.mediaRecorder.start(250);
    els.startRecording.disabled = true;
    els.stopRecording.disabled = false;
    startTimer();
    if (state.teleprompterEnabled) {
      startTeleprompter();
    }
    scheduleMaxDurationStop();
    setMicStatus(
      selectedInput && selectedInput !== "default"
        ? "Recording from the selected microphone."
        : "Recording from the system default microphone.",
    );
  } catch (error) {
    console.error(error);
    setMicStatus("Could not start recording. Check microphone permissions and input selection.");
  }
}

function scheduleMaxDurationStop() {
  if (state.maxDurationTimerId) {
    window.clearTimeout(state.maxDurationTimerId);
    state.maxDurationTimerId = 0;
  }

  const maxDurationSec = Number(state.session?.maxDurationSec) || 0;
  if (maxDurationSec <= 0) {
    return;
  }

  state.maxDurationTimerId = window.setTimeout(() => {
    stopRecording();
    setMicStatus(`Recording reached the ${maxDurationSec}-second limit.`);
  }, maxDurationSec * 1000);
}

function stopRecording() {
  if (!state.mediaRecorder || state.mediaRecorder.state !== "recording") {
    return;
  }

  if (state.maxDurationTimerId) {
    window.clearTimeout(state.maxDurationTimerId);
    state.maxDurationTimerId = 0;
  }

  state.mediaRecorder.stop();
  stopTeleprompter();
  els.startRecording.disabled = false;
  els.stopRecording.disabled = true;
}

async function saveRecording() {
  if (!state.recordedBlob) {
    return;
  }

  const narratorName = await resolveNarratorNameBeforeSave();
  if (narratorName === null) {
    return;
  }
  const bytes = new Uint8Array(await state.recordedBlob.arrayBuffer());

  els.saveRecording.disabled = true;
  setMicStatus("Saving recorded audio...");

  await window.desktopApi.saveRecordedClip({
    sessionId: state.sessionId,
    narratorName,
    mimeType: state.recordedBlob.type || "audio/webm",
    bytes,
  });

  setMicStatus("Recording saved. The main app will refresh automatically.");
  window.setTimeout(() => {
    void window.desktopApi.closeCurrentWindow();
  }, 700);
}

async function resolveNarratorNameBeforeSave() {
  const trimmedName = els.narratorName.value.trim();
  const normalizedName = trimmedName.toLowerCase();
  const shouldPromptForName =
    state.session?.mode === "facts-narration" &&
    (!trimmedName || normalizedName === "museum guest");

  if (!shouldPromptForName) {
    return trimmedName || "Museum Guest";
  }

  const chosenName = await promptForNarratorName();
  if (chosenName === null) {
    return null;
  }

  els.narratorName.value = chosenName;
  return chosenName;
}

function promptForNarratorName() {
  els.narratorDialogInput.value = "";
  els.narratorDialog.showModal();
  els.narratorDialogInput.focus();

  return new Promise((resolve) => {
    const closeHandler = () => {
      els.narratorDialog.removeEventListener("close", closeHandler);

      if (els.narratorDialog.returnValue === "confirm") {
        const value = els.narratorDialogInput.value.trim();
        resolve(value || "Museum Guest");
        return;
      }

      if (els.narratorDialog.returnValue === "guest") {
        resolve("Museum Guest");
        return;
      }

      resolve(null);
    };

    els.narratorDialog.addEventListener("close", closeHandler);
  });
}

function pickSupportedMimeType() {
  const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

function toggleTeleprompterMode() {
  state.teleprompterEnabled = !state.teleprompterEnabled;
  if (!state.teleprompterEnabled) {
    stopTeleprompter({ reset: true });
  } else if (state.mediaRecorder?.state === "recording") {
    startTeleprompter();
  }
  syncTeleprompterButton();
}

function syncTeleprompterButton() {
  if (!els.teleprompterToggle) {
    return;
  }
  els.teleprompterToggle.setAttribute("aria-pressed", state.teleprompterEnabled ? "true" : "false");
  els.teleprompterToggle.textContent = state.teleprompterEnabled
    ? "Teleprompter On"
    : "Teleprompter Off";
}

function startTeleprompter() {
  stopTeleprompter({ reset: true });
  if (!state.teleprompterEnabled || state.teleprompterWords.length === 0) {
    return;
  }

  const maxDurationSec = Number(state.session?.maxDurationSec) || 45;
  const msPerWord = Math.max(220, (maxDurationSec * 1000) / Math.max(state.teleprompterWords.length, 1));

  const advance = () => {
    state.teleprompterWordIndex += 1;
    if (state.teleprompterWordIndex >= state.teleprompterWords.length) {
      stopTeleprompter();
      return;
    }

    state.teleprompterWords.forEach((word, index) => {
      word.classList.toggle("is-active", index === state.teleprompterWordIndex);
    });

    state.teleprompterWords[state.teleprompterWordIndex]?.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });

    state.teleprompterTimerId = window.setTimeout(advance, msPerWord);
  };

  advance();
}

function stopTeleprompter(options = {}) {
  if (state.teleprompterTimerId) {
    window.clearTimeout(state.teleprompterTimerId);
    state.teleprompterTimerId = 0;
  }

  if (options.reset) {
    state.teleprompterWordIndex = -1;
    state.teleprompterWords.forEach((word) => word.classList.remove("is-active"));
    if (els.scriptScroller) {
      els.scriptScroller.scrollTop = 0;
    }
  }
}

function startTimer() {
  stopTimer();
  state.startedAt = Date.now();
  state.timerId = window.setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    els.timerPill.textContent = `${minutes}:${seconds}`;
  }, 200);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = 0;
  }
  if (state.maxDurationTimerId) {
    window.clearTimeout(state.maxDurationTimerId);
    state.maxDurationTimerId = 0;
  }
  els.timerPill.textContent = "00:00";
}

function stopStream() {
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }
}

function releasePreviewUrl() {
  if (state.recordedUrl) {
    URL.revokeObjectURL(state.recordedUrl);
    state.recordedUrl = "";
  }
}

function setMicStatus(message) {
  els.micStatus.textContent = message;
}
