(() => {
  "use strict";

  const MAX_PHOTOS = 6;
  const MAX_BYTES = 10 * 1024 * 1024;
  const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const ALL_STAGES = ["0", "1", "1+", "2", "2+", "3", "3+", "4", "4+"];
  const PATIENT_STAGES = ["2", "2+", "3", "3+", "4"];

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
      label: "거의 깨끗함",
      image: "assets/stage-1.jpg",
      summary: "대체로 맑지만 군데군데 옅은 분홍빛과 잔각질이 관찰되는 단계입니다.",
      symptoms: ["군데군데 옅은 분홍빛", "가는 붉은 점이 살짝 보임", "모공 근처 잔가루 정도의 각질"],
      metrics: {
        sensitivity: "대체로 맑지만 옅은 분홍빛과 가는 붉은 점이 일부 관찰됩니다.",
        scale: "모공 근처에 잔가루 정도의 하얀 각질이 일부 보입니다.",
        oil: "유분 변화가 뚜렷하지 않은 유지기 참고 상태입니다."
      }
    },
    "1+": {
      name: "Almost clear+",
      label: "거의 깨끗함+",
      image: "assets/stage-1.jpg",
      summary: "1단계보다 붉음과 잔각질이 조금 더 보이지만 아직 유지기에 가까운 단계입니다.",
      symptoms: ["옅은 분홍빛 범위 증가", "모공 입구 잔각질", "피로·환절기에 반복 가능"],
      metrics: {
        sensitivity: "옅은 붉음이 1단계보다 조금 더 넓게 관찰되는 참고 상태입니다.",
        scale: "일부 모공 입구에 하얀 잔각질이 모여 보일 수 있습니다.",
        oil: "피로·환경 변화에 따라 번들거림이 나타날 수 있습니다."
      }
    },
    "2": {
      name: "Mild",
      label: "경도",
      image: "assets/stage-2.jpg",
      summary: "붉음과 얇은 각질이 보이기 시작해 관리를 시작하기 좋은 단계입니다.",
      symptoms: ["분홍~옅은 붉은빛", "얇고 하얀 각질", "모공 입구의 하얀·노르스름한 각질"],
      metrics: {
        sensitivity: "분홍빛에서 옅은 붉은빛이 넓게 관찰되는 경도 상태입니다.",
        scale: "얇고 하얀 각질이 흩어져 보이고 모공 입구에 각질이 끼기 시작합니다.",
        oil: "기름막이 살짝 번들거릴 수 있는 초기 유분 변화가 관찰됩니다."
      }
    },
    "2+": {
      name: "Mild+",
      label: "경도+",
      image: "assets/stage-2.jpg",
      summary: "2단계보다 붉음·각질·유분 변화가 뚜렷해지는 경도 상단 단계입니다.",
      symptoms: ["옅은 붉은 테가 뚜렷해짐", "하얀·노르스름한 각질 증가", "가려움이 시작될 수 있음"],
      metrics: {
        sensitivity: "모공 주변의 붉은 테와 옅은 붉음이 2단계보다 뚜렷합니다.",
        scale: "하얀 각질과 노르스름한 각질이 여러 모공에서 보이기 시작합니다.",
        oil: "두피 표면의 번들거림과 유분성 각질이 조금 더 뚜렷합니다."
      }
    },
    "3": {
      name: "Moderate",
      label: "중등도",
      image: "assets/stage-3.jpg",
      summary: "붉음과 겹쳐 쌓인 각질이 명확해 집중 관리가 필요한 단계입니다.",
      symptoms: ["한눈에 보이는 붉음", "겹쳐 쌓이는 각질", "노르스름하고 기름진 각질"],
      metrics: {
        sensitivity: "붉은기가 뚜렷하고 가는 혈관이 나뭇가지처럼 보일 수 있습니다.",
        scale: "각질이 겹쳐 쌓이고 모공 주변을 테처럼 둘러싸기 시작합니다.",
        oil: "노르스름하고 기름진 각질이 모공 입구를 덮는 중등도 상태입니다."
      }
    },
    "3+": {
      name: "Moderate+",
      label: "중등도+",
      image: "assets/stage-3.jpg",
      summary: "중등도 증상이 넓고 뚜렷하며 화끈거림·진물 가능성을 함께 확인해야 하는 단계입니다.",
      symptoms: ["넓고 뚜렷한 붉음", "머리카락 사이로 보이는 각질", "화끈거림·진물 가능성"],
      metrics: {
        sensitivity: "넓은 붉음과 모공 주변 붉은 테가 3단계보다 강하게 관찰됩니다.",
        scale: "겹친 각질이 머리카락 사이에서도 눈에 띄는 상태입니다.",
        oil: "기름진 각질과 번들거림이 넓게 보여 집중 관리가 필요합니다."
      }
    },
    "4": {
      name: "Severe",
      label: "중증",
      image: "assets/stage-4.jpg",
      summary: "강한 붉음과 두껍고 거친 각질이 넓게 보이며 우선 진료가 필요한 단계입니다.",
      symptoms: ["진하고 강한 붉은빛", "두껍고 거친 판 모양 각질", "각질로 가려진 모공 입구"],
      metrics: {
        sensitivity: "진하고 강한 붉은빛이 넓게 퍼져 있고 염증 범위를 직접 확인해야 합니다.",
        scale: "두껍고 거친 판 모양 각질이 모공 입구를 덮고 있습니다.",
        oil: "각질과 유분성 부착물이 엉겨 모발이 붙어 보일 수 있는 중증 상태입니다."
      }
    },
    "4+": {
      name: "Severe+",
      label: "최악 상태 예시",
      image: "assets/stage-4.jpg",
      summary: "4단계보다 악화된 최악 상태를 설명하기 위한 예시 단계입니다. 별도 의료 기준 확정이 필요합니다.",
      symptoms: ["최악 상태 비교용", "환자 현재 결과로 사용하지 않음", "의료진 기준·이미지 확정 필요"],
      metrics: {
        sensitivity: "4+단계의 독립 기준은 제공 자료에 없어 의료진 확정이 필요합니다.",
        scale: "4+단계의 독립 각질 기준과 대표 사진은 별도 확정이 필요합니다.",
        oil: "4+단계의 독립 유분 기준은 별도 확정이 필요합니다."
      }
    }
  };

  const treatmentGuidelines = {
    "2": { required: "프리컨디셔닝 + 아르케", count: "10–15회", enhanced: "보톡스" },
    "2+": { required: "프리컨디셔닝 + 아르케", count: "15–20회", enhanced: "보톡스 + 리쥬란" },
    "3": { required: "프리컨디셔닝 + 아르케", count: "20–25회", enhanced: "보톡스 + 줄기세포 배양액" },
    "3+": { required: "프리컨디셔닝 + 아르케", count: "25–30회", enhanced: "보톡스 + 엑소좀" },
    "4": { required: "프리컨디셔닝 + 아르케", count: "30–40회", enhanced: "보톡스 + 엑소좀" }
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
    return bytes ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : "합성 샘플";
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
      { name: "합성-민감성-샘플.jpg", url: "assets/stage-2.jpg" },
      { name: "합성-각질-샘플.jpg", url: "assets/stage-3.jpg" },
      { name: "합성-유분-샘플.jpg", url: "assets/stage-4.jpg" }
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
      meta.textContent = `${photo.synthetic ? "SYNTHETIC" : photo.type.replace("image/", "").toUpperCase()} · ${formatBytes(photo.size)}`;
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
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric) || numeric <= 2) return "2";
    if (numeric >= 4) return "4";
    return "3";
  }

  function getNextStage(stage) {
    const transitions = { "2": "2+", "2+": "3", "3": "3+", "3+": "4", "4": "4+" };
    return transitions[normalizePatientStage(stage)] || "4+";
  }

  function seedFromPhotos() {
    return state.photos.reduce((total, photo, photoIndex) => {
      const nameSeed = Array.from(photo.name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return total + nameSeed + photo.size + ((photoIndex + 1) * 97);
    }, 211);
  }

  function generateDemoAssessment() {
    const stageByCount = ["2", "2+", "3", "3+", "4", "4"];
    const suggestedStage = stageByCount[Math.max(0, Math.min(state.photos.length - 1, stageByCount.length - 1))];
    const seed = seedFromPhotos();
    return {
      stage: suggestedStage,
      metrics: {
        sensitivity: 1 + ((seed * 7 + 3) % 30),
        scale: 1 + ((seed * 11 + 9) % 30),
        oil: 1 + ((seed * 13 + 17) % 30)
      }
    };
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
      if (stageKey.includes("+")) {
        const assetBadge = document.createElement("span");
        assetBadge.textContent = stageKey === "4+" ? "자산 확인 필요" : "+단계 공용 이미지";
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
      outOf.textContent = "/ 100";
      scoreRow.append(scoreText, outOf);
      const gauge = document.createElement("div");
      gauge.className = "metric-gauge";
      gauge.setAttribute("role", "img");
      gauge.setAttribute("aria-label", `${metric.label} 점수 ${score}점, 0에 가까울수록 심각`);
      const track = document.createElement("div");
      track.className = "metric-gauge-track";
      const marker = document.createElement("span");
      marker.className = "metric-gauge-marker";
      marker.style.left = `${score}%`;
      track.appendChild(marker);
      const labels = document.createElement("div");
      labels.className = "metric-gauge-labels";
      const serious = document.createElement("span");
      serious.textContent = "심각 0";
      const normal = document.createElement("span");
      normal.textContent = "정상 100";
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

  function buildProgressionArrow() {
    const arrow = document.createElement("div");
    arrow.className = "progression-arrow";
    arrow.setAttribute("aria-hidden", "true");
    const icon = document.createElement("span");
    icon.textContent = "→";
    const duration = document.createElement("small");
    duration.textContent = "2–4개월";
    arrow.append(icon, duration);
    return arrow;
  }

  function renderProgression() {
    const grid = $("progressionGrid");
    const primary = getPrimaryPhoto();
    const current = state.finalStage;
    const next = getNextStage(current);
    grid.replaceChildren();
    grid.append(
      buildProgressionCard("current", current, primary?.url || stageData[current].image, "현재 상태", stageData[current].label),
      buildProgressionArrow(),
      buildProgressionCard("next", next, stageData[next].image, "다음 단계 예시", stageData[next].summary),
      buildProgressionArrow(),
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
    status.textContent = state.confirmed ? "의료진 확정" : "데모 제안 · 미확정";
    status.className = `status-badge ${state.confirmed ? "is-confirmed" : "is-pending"}`;
    renderStageReference();
    renderMetricCards();
    renderProgression();
    renderTreatmentPlan();
    renderCases();
    updateHandoffButtons();
  }

  function prepareResult() {
    const assessment = generateDemoAssessment();
    state.suggestedStage = normalizePatientStage(assessment.stage);
    state.finalStage = state.suggestedStage;
    state.metrics = assessment.metrics;
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
    clearAnalysisTimers();
    setAnalysisStep(0);
    showView("analysis");
    analysisTimers.push(window.setTimeout(() => setAnalysisStep(1), 260));
    analysisTimers.push(window.setTimeout(() => setAnalysisStep(2), 620));
    analysisTimers.push(window.setTimeout(() => {
      prepareResult();
      showView("result");
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
