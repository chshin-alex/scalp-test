(() => {
  "use strict";

  const MAX_PHOTOS = 6;
  const MAX_BYTES = 10 * 1024 * 1024;
  const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const ALL_STAGES = ["0", "1", "1+", "2", "2+", "3", "3+", "4", "4+"];
  const PATIENT_STAGES = [...ALL_STAGES];

  const stageData = {
    "0": {
      name: "Clear",
      label: "정상 상태",
      image: "assets/stage-0.jpg",
      summary: "과도한 붉음과 보이는 각질이 거의 없는 건강한 두피 참고 상태입니다.",
      symptoms: ["뚜렷한 붉음 없음", "보이는 각질 없음", "모공 주변이 비교적 깨끗함"],
      metrics: {
        sensitivity: "과도한 붉음이 관찰되지 않는 정상 참고 상태입니다.",
        scale: "두꺼운 각질이나 모공 주변 잔각질이 거의 없습니다.",
        oil: "과도한 번들거림이나 유분성 부착물이 관찰되지 않습니다."
      }
    },
    "1": {
      name: "Almost clear",
      label: "잔각질",
      image: "assets/stage-1.jpg",
      summary: "홍반 없이 미세한 잔각질이 두피 표면에 고르게 보이는 단계입니다.",
      symptoms: ["홍반 없음", "미세 각질이 고르게 깔림", "큰 비듬 덩어리 없음"],
      metrics: {
        sensitivity: "두피 바탕색은 정상 범위이며 뚜렷한 붉은기가 관찰되지 않습니다.",
        scale: "가는 잔각질이 넓게 보이지만 큰 각질판이나 비듬 덩어리는 없습니다.",
        oil: "모공 주변에 소량 각질이 보이나 뚜렷한 유분성 부착물은 없습니다."
      }
    },
    "1+": {
      name: "Almost clear+",
      label: "모공 각질",
      image: "assets/stage-1-plus.jpg",
      summary: "홍반은 없지만 모공 둘레의 각질 조각과 얇은 각질판이 1단계보다 뚜렷한 단계입니다.",
      symptoms: ["홍반 없음", "모공 둘레 각질 고리", "작은 비듬 조각·얇은 각질판"],
      metrics: {
        sensitivity: "피부색은 정상 범위이며 붉은기는 아직 뚜렷하지 않습니다.",
        scale: "모공마다 각질이 붙기 시작하고 떨어진 작은 비듬 조각이 여러 곳에 보입니다.",
        oil: "모공 입구의 각질 고리가 선명해지지만 유분 변화는 제한적입니다."
      }
    },
    "2": {
      name: "Mild",
      label: "비듬+분홍",
      image: "assets/stage-2.jpg",
      summary: "눈에 보이는 비듬·각질이 시야에 흩어지고 두피 바탕에 옅은 분홍빛이 동반되는 단계입니다.",
      symptoms: ["옅은 분홍빛", "시야에 흩어진 흰 비듬·각질", "모공 주변 기름진 각질"],
      metrics: {
        sensitivity: "두피 바탕이 정상색에서 옅은 분홍빛으로 변하기 시작합니다.",
        scale: "큰 비듬 조각과 흰 각질이 시야 전체에 흩어져 보입니다.",
        oil: "일부 모공을 기름진 각질이 덮는 초기 유분 변화가 관찰됩니다."
      }
    },
    "2+": {
      name: "Mild+",
      label: "각질판",
      image: "assets/stage-2-plus.jpg",
      summary: "반투명 각질판이 넓어지고 분홍~붉은 바탕과 국소 홍반이 2단계보다 진해진 단계입니다.",
      symptoms: ["넓어진 반투명 각질판", "분홍~붉은 바탕", "뚜렷한 붉은 반점과 주변 각질"],
      metrics: {
        sensitivity: "2단계보다 홍반이 진하고 붉은 반점의 범위가 넓게 관찰됩니다.",
        scale: "여러 곳의 각질 조각이 이어져 반투명한 판 모양으로 보입니다.",
        oil: "각질판 가장자리와 모공 주변의 유분성 부착물이 더 뚜렷합니다."
      }
    },
    "3": {
      name: "Moderate",
      label: "홍반",
      image: "assets/stage-3.jpg",
      summary: "시야 전반에 뚜렷한 홍반이 보이고 모공 주변 부종·혈관 확장과 기름진 각질이 동반되는 단계입니다.",
      symptoms: ["시야 전반의 뚜렷한 홍반", "모공 주변 부종·혈관 확장", "붉은 바탕 위 기름진 각질"],
      metrics: {
        sensitivity: "붉은 바탕이 넓고 모공 주변이 부어 보이거나 혈관이 확장되어 보일 수 있습니다.",
        scale: "붉은 바탕 위에 각질판과 미세 각질이 함께 관찰됩니다.",
        oil: "노르스름하고 기름진 각질이 모공 입구를 덮는 상태입니다."
      }
    },
    "3+": {
      name: "Moderate+",
      label: "홍반 확대",
      image: "assets/stage-3-plus.jpg",
      summary: "진한 홍반이 넓게 퍼지고 두꺼운 각질판이 들뜨거나 시야 대부분을 덮는 단계입니다.",
      symptoms: ["넓고 진한 홍반", "시야 대부분의 각질", "모공마다 붙은 각질·들뜬 각질판"],
      metrics: {
        sensitivity: "3단계보다 진한 홍반이 넓게 퍼져 모공 사이 바탕 전체가 붉게 보입니다.",
        scale: "두꺼운 각질판이 들뜨고 흰 각질이 시야 대부분을 덮습니다.",
        oil: "기름진 각질이 여러 모공에 붙고 넓은 범위에서 관찰됩니다."
      }
    },
    "4": {
      name: "Severe",
      label: "두꺼운 각질",
      image: "assets/stage-4.jpg",
      summary: "진한 홍반 위에 두꺼운 각질판과 노란 딱지가 쌓이고 일부 점상 출혈이 동반될 수 있는 단계입니다.",
      symptoms: ["진한 홍반", "두꺼운 판 모양 각질", "노란 딱지·일부 점상 출혈"],
      metrics: {
        sensitivity: "진한 홍반이 넓게 보이고 점상 출혈 여부를 의료진이 확인해야 합니다.",
        scale: "두꺼운 각질판이 붉은 바탕 위에 쌓여 시야 대부분을 덮습니다.",
        oil: "노란 딱지와 두꺼운 각질이 엉겨 모공 주변에 붙어 있습니다."
      }
    },
    "4+": {
      name: "Severe+",
      label: "최중증",
      image: "assets/stage-4-plus.jpg",
      summary: "시야 전체가 두꺼운 각질판으로 덮이고 진한 홍반·딱지·진물 소견이 함께 보이는 최중증 단계입니다.",
      symptoms: ["시야 전체를 덮는 두꺼운 각질판", "진한 홍반", "노란 진물 딱지·출혈점 가능"],
      metrics: {
        sensitivity: "바탕 전체가 진한 붉은색으로 보이며 출혈점 여부를 우선 확인해야 합니다.",
        scale: "두꺼운 각질판이 빈틈 없이 시야를 채우는 가장 심한 범위입니다.",
        oil: "노란 진물 딱지와 유분성 부착물이 두꺼운 각질판과 함께 관찰될 수 있습니다."
      }
    }
  };

  const treatmentGuidelines = {
    "0": { required: "정상 유지 관리", count: "정기 점검", enhanced: "홈케어 유지" },
    "1": { required: "두피 상태 상담", count: "의료진 확인 후 결정", enhanced: "세정·홈케어 검토" },
    "1+": { required: "두피 상태 상담", count: "의료진 확인 후 결정", enhanced: "세정·진정 관리 검토" },
    "2": { required: "프리컨디셔닝 + 아르케", count: "10–15회", enhanced: "보톡스" },
    "2+": { required: "프리컨디셔닝 + 아르케", count: "15–20회", enhanced: "보톡스 + 리쥬란" },
    "3": { required: "프리컨디셔닝 + 아르케", count: "20–25회", enhanced: "보톡스 + 줄기세포 배양액" },
    "3+": { required: "프리컨디셔닝 + 아르케", count: "25–30회", enhanced: "보톡스 + 엑소좀" },
    "4": { required: "프리컨디셔닝 + 아르케", count: "30–40회", enhanced: "보톡스 + 엑소좀" },
    "4+": { required: "의료진 우선 평가", count: "개별 치료계획 수립", enhanced: "중증 관리 프로토콜 검토" }
  };

  const metricDefinitions = [
    { key: "sensitivity", label: "민감성(붉음)", icon: "R" },
    { key: "scale", label: "각질", icon: "S" },
    { key: "oil", label: "유분", icon: "O" }
  ];

  const state = {
    photos: [],
    primaryPhotoId: null,
    galleryPhotoId: null,
    suggestedStage: "3+",
    finalStage: "3+",
    metrics: { sensitivity: 18, scale: 12, oil: 24 },
    confidence: 0,
    analysisWarnings: [],
    confirmed: false,
    handedOff: false
  };

  const $ = (id) => document.getElementById(id);
  const views = { home: $("homeView"), upload: $("uploadView"), analysis: $("analysisView"), result: $("resultView") };
  const photoInput = $("photoInput");
  const uploadZone = $("uploadZone");
  const photoGrid = $("photoGrid");
  const analyzeButton = $("analyzeButton");
  const stageSelect = $("stageSelect");
  const reviewForm = $("reviewForm");
  const handoffButton = $("handoffButton");
  const footerHandoffButton = $("footerHandoffButton");
  let analysisTimers = [];
  let toastTimer = null;

  function showView(name) {
    Object.entries(views).forEach(([key, node]) => node.classList.toggle("is-visible", key === name));
    const titles = { home: "두피 진단", upload: "두피 사진 등록", analysis: "두피 분석", result: "두피 진단 결과" };
    $("pageTitle").textContent = titles[name];
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").hidden = false;
    toastTimer = window.setTimeout(() => { $("toast").hidden = true; }, 2800);
  }

  function showValidation(message) {
    $("validationMessage").textContent = message;
    $("validationMessage").hidden = !message;
  }

  function formatBytes(bytes) {
    return bytes ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : "센터 참고사진";
  }

  function validateFiles(fileList) {
    const accepted = [];
    const errors = [];
    const remaining = MAX_PHOTOS - state.photos.length;
    Array.from(fileList).slice(0, remaining).forEach((file) => {
      if (!ACCEPTED_TYPES.has(file.type)) errors.push(`${file.name}: 지원하지 않는 형식입니다.`);
      else if (file.size > MAX_BYTES) errors.push(`${file.name}: 10MB를 초과했습니다.`);
      else accepted.push(file);
    });
    if (fileList.length > remaining) errors.push(`최대 ${MAX_PHOTOS}장까지만 등록할 수 있습니다.`);
    return { accepted, errors };
  }

  function createPhotoFromFile(file) {
    return {
      id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      ownedUrl: true,
      synthetic: false
    };
  }

  function addPhotos(fileList) {
    const { accepted, errors } = validateFiles(fileList);
    accepted.forEach((file) => state.photos.push(createPhotoFromFile(file)));
    if (!state.primaryPhotoId && state.photos[0]) state.primaryPhotoId = state.photos[0].id;
    showValidation(errors.join(" "));
    renderUploadPhotos();
  }

  function loadSamplePhotos() {
    const samples = [
      { name: "원장선정-2단계-참고.jpg", url: "assets/stage-2.jpg" },
      { name: "원장선정-3단계-참고.jpg", url: "assets/stage-3.jpg" },
      { name: "원장선정-4단계-참고.jpg", url: "assets/stage-4.jpg" }
    ];
    const remaining = MAX_PHOTOS - state.photos.length;
    if (remaining === 0) {
      showValidation("최대 6장까지 등록되어 있습니다.");
      return;
    }
    samples.slice(0, remaining).forEach((sample, index) => {
      state.photos.push({
        id: `sample-${Date.now()}-${index}`,
        name: sample.name,
        type: "image/jpeg",
        size: 0,
        url: sample.url,
        ownedUrl: false,
        synthetic: true
      });
    });
    if (!state.primaryPhotoId) state.primaryPhotoId = state.photos[0].id;
    showValidation("");
    renderUploadPhotos();
  }

  function createActionButton(label, handler, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener("click", handler);
    return button;
  }

  function renderUploadPhotos() {
    photoGrid.replaceChildren();
    state.photos.forEach((photo, index) => {
      const card = document.createElement("article");
      card.className = `photo-card${state.primaryPhotoId === photo.id ? " is-primary" : ""}`;
      const image = document.createElement("img");
      image.src = photo.url;
      image.alt = `등록 사진 ${index + 1} 미리보기`;
      const body = document.createElement("div");
      body.className = "photo-card-body";
      const title = document.createElement("div");
      title.className = "photo-card-title";
      const name = document.createElement("b");
      name.textContent = photo.name;
      title.appendChild(name);
      if (state.primaryPhotoId === photo.id) {
        const tag = document.createElement("span");
        tag.className = "primary-tag";
        tag.textContent = "대표";
        title.appendChild(tag);
      }
      const meta = document.createElement("p");
      meta.className = "photo-meta";
      meta.textContent = `${photo.synthetic ? "DIRECTOR REFERENCE" : photo.type.replace("image/", "").toUpperCase()} · ${formatBytes(photo.size)}`;
      const actions = document.createElement("div");
      actions.className = "photo-card-actions";
      if (state.primaryPhotoId !== photo.id) actions.appendChild(createActionButton("대표 지정", () => { state.primaryPhotoId = photo.id; renderUploadPhotos(); }));
      if (index > 0) actions.appendChild(createActionButton("앞으로", () => movePhoto(index, index - 1)));
      if (index < state.photos.length - 1) actions.appendChild(createActionButton("뒤로", () => movePhoto(index, index + 1)));
      actions.appendChild(createActionButton("삭제", () => removePhoto(photo.id), "is-danger"));
      body.append(title, meta, actions);
      card.append(image, body);
      photoGrid.appendChild(card);
    });
    $("uploadCount").textContent = String(state.photos.length);
    analyzeButton.disabled = state.photos.length === 0;
    $("photoPickerButton").disabled = state.photos.length >= MAX_PHOTOS;
    $("loadSampleButton").disabled = state.photos.length >= MAX_PHOTOS;
    $("uploadHelper").textContent = state.photos.length === 0
      ? "사진을 1장 이상 등록하면 분석을 시작할 수 있습니다."
      : `${state.photos.length}장 등록됨 · 서버에 저장하지 않습니다.`;
  }

  function movePhoto(from, to) {
    const [photo] = state.photos.splice(from, 1);
    state.photos.splice(to, 0, photo);
    renderUploadPhotos();
  }

  function removePhoto(id) {
    const photo = state.photos.find((item) => item.id === id);
    if (!photo || !window.confirm("이 사진을 진단 세션에서 삭제할까요?")) return;
    if (photo.ownedUrl) URL.revokeObjectURL(photo.url);
    state.photos = state.photos.filter((item) => item.id !== id);
    if (state.primaryPhotoId === id) state.primaryPhotoId = state.photos[0]?.id || null;
    renderUploadPhotos();
  }

  function clearPhotos() {
    state.photos.forEach((photo) => { if (photo.ownedUrl) URL.revokeObjectURL(photo.url); });
    state.photos = [];
    state.primaryPhotoId = null;
    state.galleryPhotoId = null;
    state.confidence = 0;
    state.analysisWarnings = [];
    state.confirmed = false;
    state.handedOff = false;
    renderUploadPhotos();
  }

  function getPrimaryPhoto() {
    return state.photos.find((photo) => photo.id === state.primaryPhotoId) || state.photos[0] || null;
  }

  function normalizePatientStage(stage) {
    const value = String(stage);
    if (PATIENT_STAGES.includes(value)) return value;
    return "2";
  }

  function getNextStage(stage) {
    const transitions = {
      "0": "1",
      "1": "1+",
      "1+": "2",
      "2": "2+",
      "2+": "3",
      "3": "3+",
      "3+": "4",
      "4": "4+",
      "4+": "4+"
    };
    return transitions[normalizePatientStage(stage)] || "4+";
  }

  function renderPatientGallery() {
    if (!state.galleryPhotoId || !state.photos.some((photo) => photo.id === state.galleryPhotoId)) state.galleryPhotoId = state.primaryPhotoId || state.photos[0]?.id || null;
    const active = state.photos.find((photo) => photo.id === state.galleryPhotoId);
    $("patientGallery").replaceChildren();
    $("thumbnailStrip").replaceChildren();
    if (active) {
      const image = document.createElement("img");
      image.src = active.url;
      image.alt = "선택한 환자 두피 사진";
      $("patientGallery").appendChild(image);
    }
    state.photos.forEach((photo, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `thumbnail-button${photo.id === state.galleryPhotoId ? " is-active" : ""}`;
      button.setAttribute("aria-label", `환자 사진 ${index + 1} 보기`);
      const thumb = document.createElement("img");
      thumb.src = photo.url;
      thumb.alt = "";
      button.appendChild(thumb);
      button.addEventListener("click", () => { state.galleryPhotoId = photo.id; renderPatientGallery(); });
      $("thumbnailStrip").appendChild(button);
    });
    $("galleryPhotoCount").textContent = `${state.photos.length}장`;
  }

  function renderList(id, items) {
    const list = $(id);
    list.replaceChildren();
    items.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
  }

  function renderStageReference() {
    const container = $("stageReferenceGrid");
    container.replaceChildren();
    ALL_STAGES.forEach((stageKey) => {
      const data = stageData[stageKey];
      const tile = document.createElement("article");
      tile.className = `stage-tile${stageKey === state.finalStage ? " is-current" : ""}`;
      const imageWrap = document.createElement("div");
      imageWrap.className = "stage-tile-image";
      const image = document.createElement("img");
      image.src = data.image;
      image.alt = `${stageKey}단계 ${data.label} 참고 이미지`;
      imageWrap.appendChild(image);
      if (stageKey !== "0") {
        const assetBadge = document.createElement("span");
        assetBadge.textContent = "원장 선정 대표사진";
        imageWrap.appendChild(assetBadge);
      }
      const text = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = `${stageKey}단계 · ${data.name}`;
      const caption = document.createElement("small");
      caption.textContent = data.label;
      text.append(title, caption);
      tile.append(imageWrap, text);
      container.appendChild(tile);
    });
  }

  function getMetricPhoto(index) {
    return state.photos[index] || state.photos[0] || null;
  }

  function getSeverityLabel(score) {
    if (score <= 10) return "매우 심각";
    if (score <= 20) return "심각";
    return "주의";
  }

  function renderMetricCards() {
    const grid = $("metricGrid");
    const data = stageData[state.finalStage];
    grid.replaceChildren();
    metricDefinitions.forEach((metric, index) => {
      const score = state.metrics[metric.key];
      const photo = getMetricPhoto(index);
      const card = document.createElement("article");
      card.className = "metric-card";
      card.dataset.metric = metric.key;
      const head = document.createElement("div");
      head.className = "metric-card-head";
      const icon = document.createElement("span");
      icon.textContent = metric.icon;
      const title = document.createElement("div");
      const heading = document.createElement("h4");
      heading.textContent = metric.label;
      const severity = document.createElement("small");
      severity.textContent = getSeverityLabel(score);
      title.append(heading, severity);
      head.append(icon, title);
      const imageWrap = document.createElement("div");
      imageWrap.className = "metric-image";
      if (photo) {
        const image = document.createElement("img");
        image.src = photo.url;
        image.alt = `${metric.label} 상태 참고 사진`;
        imageWrap.appendChild(image);
      }
      const scoreRow = document.createElement("div");
      scoreRow.className = "metric-score-row";
      const scoreText = document.createElement("strong");
      scoreText.textContent = String(score);
      const outOf = document.createElement("span");
      outOf.textContent = "/ 30";
      scoreRow.append(scoreText, outOf);
      const gauge = document.createElement("div");
      gauge.className = "metric-gauge";
      gauge.setAttribute("role", "img");
      gauge.setAttribute("aria-label", `${metric.label} 점수 ${score}점, 1에 가까울수록 심각`);
      const track = document.createElement("div");
      track.className = "metric-gauge-track";
      const marker = document.createElement("span");
      marker.className = "metric-gauge-marker";
      marker.style.left = `${((score - 1) / 29) * 100}%`;
      track.appendChild(marker);
      const labels = document.createElement("div");
      labels.className = "metric-gauge-labels";
      const serious = document.createElement("span");
      serious.textContent = "심각 1";
      const normal = document.createElement("span");
      normal.textContent = "정상 30";
      labels.append(serious, normal);
      gauge.append(track, labels);
      const description = document.createElement("p");
      description.textContent = data.metrics[metric.key];
      card.append(head, imageWrap, scoreRow, gauge, description);
      grid.appendChild(card);
    });
  }

  function buildProgressionCard(kind, stageKey, photoUrl, title, description) {
    const card = document.createElement("article");
    card.className = `progression-card ${kind}`;
    card.dataset.progressionCard = kind;
    const image = document.createElement("img");
    image.src = photoUrl;
    image.alt = `${stageKey}단계 ${title} 이미지`;
    const badge = document.createElement("span");
    badge.className = "progression-badge";
    badge.textContent = title;
    const heading = document.createElement("h4");
    heading.textContent = `${stageKey}단계`;
    const body = document.createElement("p");
    body.textContent = description;
    card.append(image, badge, heading, body);
    return card;
  }

  function buildProgressionArrow(durationText) {
    const arrow = document.createElement("div");
    arrow.className = "progression-arrow";
    arrow.setAttribute("aria-hidden", "true");
    const icon = document.createElement("span");
    icon.textContent = "→";
    const duration = document.createElement("small");
    duration.textContent = durationText;
    arrow.append(icon, duration);
    return arrow;
  }

  function getCumulativeProgressionDuration(fromStage, toStage = "4+") {
    const fromIndex = ALL_STAGES.indexOf(fromStage);
    const toIndex = ALL_STAGES.indexOf(toStage);
    if (fromIndex < 0 || toIndex < fromIndex) return "2–4개월";
    const stageCount = Math.max(1, toIndex - fromIndex + 1);
    return `${stageCount * 2}–${stageCount * 4}개월`;
  }

  function renderProgression() {
    const grid = $("progressionGrid");
    const primary = getPrimaryPhoto();
    const current = state.finalStage;
    const next = getNextStage(current);
    grid.replaceChildren();
    grid.append(
      buildProgressionCard("current", current, primary?.url || stageData[current].image, "현재 상태", stageData[current].label),
      buildProgressionArrow("2–4개월"),
      buildProgressionCard("next", next, stageData[next].image, "다음 단계 예시", stageData[next].summary),
      buildProgressionArrow(getCumulativeProgressionDuration(next)),
      buildProgressionCard("worst", "4+", stageData["4+"].image, "최악 상태 예시", stageData["4+"].summary)
    );
  }

  function renderTreatmentPlan() {
    const guideline = treatmentGuidelines[state.finalStage];
    const primary = getPrimaryPhoto();
    $("treatmentPatientImage").replaceChildren();
    if (primary) {
      const image = document.createElement("img");
      image.src = primary.url;
      image.alt = "현재 환자 대표 두피 사진";
      $("treatmentPatientImage").appendChild(image);
    }
    $("treatmentStage").textContent = `${state.finalStage}단계`;
    $("treatmentPatientSummary").textContent = stageData[state.finalStage].summary;
    $("requiredTreatmentTitle").textContent = guideline.required;
    $("requiredTreatmentCount").textContent = guideline.count;
    $("enhancedTreatmentTitle").textContent = guideline.enhanced;
    $("treatmentStatus").textContent = state.confirmed ? "의료진 확정 기준" : "예상 치료안 · 확정 전";
  }

  function renderCases() {
    const current = state.finalStage;
    const adjacent = getNextStage(current);
    $("caseAStartImage").src = stageData[current].image;
    $("caseAStartImage").alt = `${current}단계 참고 이미지`;
    $("caseAStartLabel").textContent = `${current}단계 시작 참고`;
    $("caseBStartImage").src = stageData[adjacent].image;
    $("caseBStartImage").alt = `${adjacent}단계 참고 이미지`;
    $("caseBStartLabel").textContent = `${adjacent}단계 인접 참고`;
  }

  function updateHandoffButtons() {
    if (state.handedOff) {
      handoffButton.textContent = "상담 인계 완료";
      footerHandoffButton.textContent = "상담 인계 완료";
      handoffButton.disabled = true;
      footerHandoffButton.disabled = true;
      return;
    }
    handoffButton.textContent = "상담 인계";
    footerHandoffButton.textContent = "상담실장에게 인계";
    handoffButton.disabled = !state.confirmed;
    footerHandoffButton.disabled = !state.confirmed;
  }

  function updateDiagnosisUI() {
    const data = stageData[state.finalStage];
    $("displayStage").textContent = `${state.finalStage}단계`;
    $("displayStageName").textContent = data.name;
    $("stageSummary").textContent = data.summary;
    renderList("symptomList", data.symptoms);
    const status = $("reviewStatus");
    status.textContent = state.confirmed ? "의료진 확정" : "39장 유사도 제안 · 미확정";
    status.className = `status-badge ${state.confirmed ? "is-confirmed" : "is-pending"}`;
    $("modelVersion").textContent = window.ScalpClassifier.modelVersion;
    $("analysisEvidence").textContent = `원장 선정 39장 전체 특징값과 등록 사진 ${state.photos.length}장을 비교했습니다. 단계 유사도 신뢰도 ${state.confidence}% · 최종 확정은 의료진이 진행합니다.`;
    $("analysisWarnings").textContent = state.analysisWarnings.length
      ? `촬영 확인: ${state.analysisWarnings.join(" · ")}`
      : "촬영 품질 경고 없음 · 흐림·강한 반사·비질환 소견은 의료진이 별도 제외합니다.";
    renderStageReference();
    renderMetricCards();
    renderProgression();
    renderTreatmentPlan();
    renderCases();
    updateHandoffButtons();
  }

  function prepareResult(assessment) {
    state.suggestedStage = normalizePatientStage(assessment.stage);
    state.finalStage = state.suggestedStage;
    state.metrics = assessment.metrics;
    state.confidence = assessment.confidence;
    state.analysisWarnings = assessment.warnings;
    state.confirmed = false;
    state.handedOff = false;
    stageSelect.value = state.finalStage;
    $("changeReason").value = "";
    $("reviewNote").value = "";
    $("reviewError").hidden = true;
    $("analysisDate").textContent = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    renderPatientGallery();
    updateDiagnosisUI();
  }

  function clearAnalysisTimers() {
    analysisTimers.forEach((timer) => window.clearTimeout(timer));
    analysisTimers = [];
  }

  function setAnalysisStep(activeIndex) {
    document.querySelectorAll("[data-analysis-step]").forEach((node, index) => {
      node.classList.toggle("is-done", index < activeIndex);
      node.classList.toggle("is-active", index === activeIndex);
    });
  }

  function startAnalysis() {
    if (state.photos.length === 0) return;
    if (!window.ScalpClassifier || window.ScalpClassifier.directorReferenceCount !== 39) {
      showValidation("39장 기준 모델을 불러오지 못했습니다. 페이지를 새로고침해주세요.");
      showView("upload");
      return;
    }
    clearAnalysisTimers();
    analyzeButton.disabled = true;
    setAnalysisStep(0);
    showView("analysis");
    analysisTimers.push(window.setTimeout(() => setAnalysisStep(1), 260));
    analysisTimers.push(window.setTimeout(() => setAnalysisStep(2), 620));
    analysisTimers.push(window.setTimeout(async () => {
      try {
        const assessment = await window.ScalpClassifier.analyzePhotos(state.photos);
        prepareResult(assessment);
        showView("result");
      } catch (error) {
        showView("upload");
        showValidation(error instanceof Error ? error.message : "사진 분석 중 오류가 발생했습니다.");
      } finally {
        analyzeButton.disabled = state.photos.length === 0;
      }
    }, 980));
  }

  function confirmReview(event) {
    event.preventDefault();
    const selectedStage = normalizePatientStage(stageSelect.value);
    const reason = $("changeReason").value.trim();
    if (!PATIENT_STAGES.includes(selectedStage)) {
      $("reviewError").textContent = "허용된 환자 결과 단계를 선택해주세요.";
      $("reviewError").hidden = false;
      return;
    }
    if (selectedStage !== state.suggestedStage && !reason) {
      $("reviewError").textContent = "제안 단계와 다르게 확정할 때는 수정 사유를 입력해주세요.";
      $("reviewError").hidden = false;
      $("changeReason").focus();
      return;
    }
    state.finalStage = selectedStage;
    state.confirmed = true;
    state.handedOff = false;
    $("reviewError").hidden = true;
    updateDiagnosisUI();
    showToast("의료진 확정 결과가 저장되었습니다. (로컬 데모)");
  }

  function previewStageChange() {
    state.finalStage = normalizePatientStage(stageSelect.value);
    state.confirmed = false;
    state.handedOff = false;
    $("reviewError").hidden = true;
    updateDiagnosisUI();
  }

  function handoff() {
    if (!state.confirmed) return;
    state.handedOff = true;
    updateHandoffButtons();
    showToast("상담실장에게 인계되었습니다. 실제 서버 저장은 연결 전입니다.");
  }

  [$("diagnosisStartButton"), $("heroStartButton")].forEach((button) => button.addEventListener("click", () => showView("upload")));
  $("photoPickerButton").addEventListener("click", () => photoInput.click());
  $("loadSampleButton").addEventListener("click", loadSamplePhotos);
  photoInput.addEventListener("change", (event) => { addPhotos(event.target.files); event.target.value = ""; });

  ["dragenter", "dragover"].forEach((name) => uploadZone.addEventListener(name, (event) => {
    event.preventDefault();
    uploadZone.classList.add("is-dragover");
  }));
  ["dragleave", "drop"].forEach((name) => uploadZone.addEventListener(name, (event) => {
    event.preventDefault();
    uploadZone.classList.remove("is-dragover");
  }));
  uploadZone.addEventListener("drop", (event) => addPhotos(event.dataTransfer.files));

  $("backHomeButton").addEventListener("click", () => showView("home"));
  $("cancelUploadButton").addEventListener("click", () => {
    if (state.photos.length > 0 && !window.confirm("등록한 사진을 모두 지우고 고객 차트로 돌아갈까요?")) return;
    clearPhotos();
    showView("home");
  });
  $("backUploadButton").addEventListener("click", () => showView("upload"));
  analyzeButton.addEventListener("click", startAnalysis);
  reviewForm.addEventListener("submit", confirmReview);
  stageSelect.addEventListener("change", previewStageChange);
  handoffButton.addEventListener("click", handoff);
  footerHandoffButton.addEventListener("click", handoff);
  $("printButton").addEventListener("click", () => window.print());

  window.addEventListener("beforeunload", () => {
    state.photos.forEach((photo) => { if (photo.ownedUrl) URL.revokeObjectURL(photo.url); });
  });

  renderUploadPhotos();
  renderStageReference();
})();
