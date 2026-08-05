const i18n = window.MuseumI18n;
const folderName = new URLSearchParams(window.location.search).get("folderName");

const state = {
  animal: null,
  currentLanguage: "en",
  selectedSizeIndex: 0,
  videoReady: false,
};

const els = {
  windowEyebrow: document.querySelector("#window-eyebrow"),
  animalName: document.querySelector("#animal-name"),
  scientificLine: document.querySelector("#scientific-line"),
  heroImage: document.querySelector("#hero-image"),
  playVideoButton: document.querySelector("#play-video-button"),
  heroVideo: document.querySelector("#hero-video"),
  videoNote: document.querySelector("#video-note"),
  unforgettableEyebrow: document.querySelector("#unforgettable-eyebrow"),
  unforgettableTitle: document.querySelector("#unforgettable-title"),
  unforgettableFact: document.querySelector("#unforgettable-fact"),
  sizeEyebrow: document.querySelector("#size-eyebrow"),
  sizeTitle: document.querySelector("#size-title"),
  sizeButtons: document.querySelector("#size-buttons"),
  sizeDetail: document.querySelector("#size-detail"),
  sizeNote: document.querySelector("#size-note"),
  aboutEyebrow: document.querySelector("#about-eyebrow"),
  aboutTitle: document.querySelector("#about-title"),
  keyfactsEyebrow: document.querySelector("#keyfacts-eyebrow"),
  keyfactsTitle: document.querySelector("#keyfacts-title"),
  scienceEyebrow: document.querySelector("#science-eyebrow"),
  scienceTitle: document.querySelector("#science-title"),
  questionsEyebrow: document.querySelector("#questions-eyebrow"),
  question35Label: document.querySelector("#question-3-5-label"),
  question58Label: document.querySelector("#question-5-8-label"),
  question813Label: document.querySelector("#question-8-13-label"),
  keyFactsList: document.querySelector("#key-facts-list"),
  scienceList: document.querySelector("#science-list"),
  question35: document.querySelector("#question-3-5"),
  question58: document.querySelector("#question-5-8"),
  question813: document.querySelector("#question-8-13"),
  aboutBody: document.querySelector("#about-body"),
  closeWindow: document.querySelector("#close-window"),
};

bootstrap().catch((error) => {
  console.error(error);
});

async function bootstrap() {
  const payload = await window.desktopApi.loadAppData();
  const animal = (payload.animals || []).find((entry) => entry.folderName === folderName);
  if (!animal) {
    throw new Error(`Could not find animal ${folderName}.`);
  }

  state.currentLanguage = i18n.normalizeLanguage(payload.settings?.language);
  state.animal = i18n.localizeAnimal(animal, state.currentLanguage);
  renderAnimal(state.animal);

  els.closeWindow.addEventListener("click", () => {
    stopVideoPlayback();
    void window.desktopApi.closeCurrentWindow();
  });

  els.playVideoButton.addEventListener("click", () => {
    if (!state.videoReady) {
      return;
    }

    if (els.heroVideo.paused || els.heroVideo.ended || els.heroVideo.hidden) {
      els.heroVideo.hidden = false;
      els.heroVideo.controls = true;
      void els.heroVideo.play();
      return;
    }

    stopVideoPlayback();
  });

  els.heroVideo.addEventListener("play", updateVideoUi);
  els.heroVideo.addEventListener("pause", updateVideoUi);
  els.heroVideo.addEventListener("ended", () => {
    stopVideoPlayback({ resetTime: true });
  });

  window.addEventListener("beforeunload", () => stopVideoPlayback());
}

function renderAnimal(animal) {
  document.title = `${animal.displayName} Info`;

  els.windowEyebrow.textContent = i18n.t(state.currentLanguage, "info.eyebrow");
  els.animalName.textContent = animal.displayName || animal.folderName;
  els.scientificLine.innerHTML = `<em>${escapeHtml(animal.about?.scientificName || "")}</em>${
    animal.about?.scientificPronunciation
      ? ` | ${escapeHtml(animal.about.scientificPronunciation)}`
      : ""
  }`;

  els.aboutEyebrow.textContent = i18n.t(state.currentLanguage, "info.aboutEyebrow");
  els.aboutTitle.textContent = i18n.t(state.currentLanguage, "info.aboutTitle");
  els.unforgettableEyebrow.textContent = i18n.t(state.currentLanguage, "info.unforgettableEyebrow");
  els.unforgettableTitle.textContent = i18n.t(state.currentLanguage, "info.unforgettableTitle");
  els.sizeEyebrow.textContent = i18n.t(state.currentLanguage, "info.sizeEyebrow");
  els.sizeTitle.textContent = i18n.t(state.currentLanguage, "info.sizeTitle");
  els.keyfactsEyebrow.textContent = i18n.t(state.currentLanguage, "info.keyFactsEyebrow");
  els.keyfactsTitle.textContent = i18n.t(state.currentLanguage, "info.keyFactsTitle");
  els.scienceEyebrow.textContent = i18n.t(state.currentLanguage, "info.scienceEyebrow");
  els.scienceTitle.textContent = i18n.t(state.currentLanguage, "info.scienceTitle");
  els.questionsEyebrow.textContent = i18n.t(state.currentLanguage, "info.questionsEyebrow");
  els.question35Label.textContent = i18n.t(state.currentLanguage, "info.ages35");
  els.question58Label.textContent = i18n.t(state.currentLanguage, "info.ages58");
  els.question813Label.textContent = i18n.t(state.currentLanguage, "info.ages813");
  els.closeWindow.textContent = i18n.t(state.currentLanguage, "common.close");

  els.heroImage.src = animal.imageUrl;
  els.heroImage.alt = animal.displayName || animal.folderName;
  els.heroImage.style.objectPosition = animal.cropPosition || "50% 50%";
  els.aboutBody.textContent = animal.aboutBody || "";
  els.unforgettableFact.textContent = animal.unforgettableFact || animal.about?.keyFacts?.[0] || "";

  fillList(els.keyFactsList, animal.about?.keyFacts || []);
  fillList(els.scienceList, animal.about?.scienceHighlights || []);
  els.question35.textContent = animal.about?.curiousQuestionAge3To5 || "";
  els.question58.textContent = animal.about?.curiousQuestionAge5To8 || "";
  els.question813.textContent = animal.about?.curiousQuestionAge8To13 || "";

  renderSizeComparisons(animal);

  if (animal.videoMediaUrl) {
    els.heroVideo.src = animal.videoMediaUrl;
    els.heroVideo.hidden = true;
    els.heroVideo.controls = false;
    els.videoNote.textContent = i18n.t(state.currentLanguage, "info.videoReady");
    els.playVideoButton.disabled = false;
    state.videoReady = true;
  } else {
    els.heroVideo.removeAttribute("src");
    els.heroVideo.hidden = true;
    els.heroVideo.controls = false;
    els.videoNote.textContent = i18n.t(state.currentLanguage, "common.noVideo");
    els.playVideoButton.disabled = true;
    state.videoReady = false;
  }

  updateVideoUi();
}

function fillList(listElement, items) {
  listElement.replaceChildren();
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    listElement.appendChild(li);
  });
}

function renderSizeComparisons(animal) {
  els.sizeButtons.replaceChildren();
  const comparisons = Array.isArray(animal.sizeComparisons) ? animal.sizeComparisons : [];
  els.sizeNote.textContent = i18n.t(state.currentLanguage, "info.sizePrompt");

  if (comparisons.length === 0) {
    els.sizeDetail.textContent = "";
    return;
  }

  state.selectedSizeIndex = Math.min(state.selectedSizeIndex, comparisons.length - 1);
  comparisons.forEach((comparison, index) => {
    const button = document.createElement("button");
    button.className = "size-button";
    button.type = "button";
    button.textContent = comparison.label;
    button.classList.toggle("is-selected", index === state.selectedSizeIndex);
    button.addEventListener("click", () => {
      state.selectedSizeIndex = index;
      renderSizeComparisons(animal);
    });
    els.sizeButtons.appendChild(button);
  });

  els.sizeDetail.textContent = comparisons[state.selectedSizeIndex]?.detail || "";
}

function stopVideoPlayback(options = {}) {
  const resetTime = options.resetTime !== false;

  els.heroVideo.pause();
  if (resetTime && Number.isFinite(els.heroVideo.currentTime)) {
    els.heroVideo.currentTime = 0;
  }
  els.heroVideo.hidden = true;
  els.heroVideo.controls = false;
  updateVideoUi();
}

function updateVideoUi() {
  const isPlaying = !els.heroVideo.paused && !els.heroVideo.ended && !els.heroVideo.hidden;
  els.playVideoButton.textContent = i18n.t(
    state.currentLanguage,
    isPlaying ? "common.stopVideo" : "common.playVideo",
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
