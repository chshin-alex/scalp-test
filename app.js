(() => {
  "use strict";

  const MAX_PHOTOS = 6;
  const MAX_BYTES = 10 * 1024 * 1024;
  const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

  const stages = [
    {
      label: "건강 유지",
      meaning: "건강 상태 유지",
      title: "두피 0단계 · 건강 유지 구간",
      summary: "뚜렷한 붉은기와 각질이 관찰되지 않는 상태로 확정됐습니다.",
      currentCopy: "뚜렷한 염증 소견이 관찰되지 않습니다.",
      nextCopy: "초기 변화가 반복되면 예방 관리 단계로 구분할 수 있습니다.",
      goal: "현재 상태 유지와 정기 확인",
      protocols: [
        ["01", "정기 확인", "동일 조건에서 두피 변화를 확인합니다.", "기본"],
        ["02", "홈케어 유지", "의료진이 안내한 관리 원칙을 유지합니다.", "기본"],
        ["＋", "증상 발생 시 진료", "붉은기·각질·불편감이 생기면 상담합니다.", "조건부"]
      ]
    },
    {
      label: "예방 관리",
      meaning: "초기 변화 예방 관리",
      title: "두피 염증 1단계 · 예방 관리 구간",
      summary: "초기 변화가 일부 관찰되어 예방 관리가 필요한 1단계로 확정됐습니다.",
      currentCopy: "초기 변화가 관찰되어 예방 관리가 권장됩니다.",
      nextCopy: "붉은기·각질·유분이 치료가 필요한 수준으로 커질 수 있습니다.",
      goal: "초기 변화 안정화와 정기 확인",
      protocols: [
        ["01", "두피 환경 정돈", "각질·피지 상태를 확인하고 관리 환경을 정돈합니다.", "기본"],
        ["02", "홈케어 점검", "사용 제품과 관리 습관을 점검합니다.", "기본"],
        ["＋", "경과 확인", "확인 시점은 의료진이 결정합니다.", "조건부"]
      ]
    },
    {
      label: "치료 필요",
      meaning: "염증·장벽 치료 필요",
      title: "두피 염증 2단계 · 치료가 필요한 구간",
      summary: "붉은기와 각질이 여러 부위에서 관찰되어 2단계로 확정됐습니다.",
      currentCopy: "붉은기·각질이 여러 부위에서 관찰됩니다.",
      nextCopy: "염증 소견의 범위와 강도가 더 커질 수 있습니다.",
      goal: "홈케어 전환 기준 충족까지",
      protocols: [
        ["01", "프리컨디셔닝", "각질·피지를 정돈해 관리 환경을 준비합니다.", "기본"],
        ["02", "ARCHE 두피 관리", "두피 장벽 관리 목적으로 안내합니다.", "기본"],
        ["＋", "추가 치료 검토", "적응증과 단계 매핑 승인 시에만 제안합니다.", "조건부"]
      ]
    },
    {
      label: "적극 치료",
      meaning: "적극 치료·경과 확인",
      title: "두피 염증 3단계 · 적극 치료 구간",
      summary: "염증 소견의 범위와 강도가 높아 적극적인 치료가 필요한 3단계로 확정됐습니다.",
      currentCopy: "적극적인 치료와 경과 확인이 필요한 상태입니다.",
      nextCopy: "집중 치료와 의료진 평가가 필요한 고위험 단계입니다.",
      goal: "집중 관리 종료·전환 기준 충족까지",
      protocols: [
        ["01", "의료진 진료", "증상 범위와 악화 요인을 우선 확인합니다.", "필수"],
        ["02", "집중 두피 관리", "승인된 단계별 기준에 따라 관리합니다.", "기본"],
        ["03", "경과 재평가", "동일 조건 촬영으로 변화를 재확인합니다.", "필수"]
      ]
    },
    {
      label: "집중 치료",
      meaning: "의료진 집중 치료 필요",
      title: "두피 염증 4단계 · 집중 치료 구간",
      summary: "고도 염증 소견이 관찰되어 의료진의 집중 평가가 필요한 4단계로 확정됐습니다.",
      currentCopy: "집중 치료와 의료진 평가가 필요한 고위험 단계입니다.",
      nextCopy: "다음 단계 예측 대신 의료진 진료와 경과 확인을 우선합니다.",
      goal: "고위험 상태 안정화·재평가까지",
      protocols: [
        ["01", "의료진 집중 진료", "고위험 소견과 감별 필요성을 확인합니다.", "필수"],
        ["02", "승인 치료 계획", "의료진이 확정한 계획만 안내합니다.", "필수"],
        ["03", "단기 경과 확인", "재평가 시점은 의료진이 결정합니다.", "필수"]
      ]
    }
  ];

  const state = {
    photos: [],
    primaryPhotoId: null,
    activePhotoId: null,
    stage: 2,
    redness: 2,
    scale: 2,
    sebum: 1,
    note: "",
    reviewed: false,
    handedOff: false,
    analysisTimer: null,
    auditLog: [],
    capture: { site: "vertex", device: "demo-device", magnification: "x100" }
  };

  const views = Array.from(document.querySelectorAll(".view"));
  const pageTitle = document.getElementById("pageTitle");
  const photoInput = document.getElementById("photoInput");
  const photoGrid = document.getElementById("photoGrid");
  const uploadCount = document.getElementById("uploadCount");
  const analyzeButton = document.getElementById("analyzeButton");
  const uploadHelper = document.getElementById("uploadHelper");
  const uploadZone = document.getElementById("uploadZone");
  const validationMessage = document.getElementById("validationMessage");
  const reviewPhoto = document.getElementById("reviewPhoto");
  const reviewThumbnails = document.getElementById("reviewThumbnails");
  const resultPhoto = document.getElementById("resultPhoto");
  const resultThumbnails = document.getElementById("resultThumbnails");
  const evidencePhoto = document.getElementById("evidencePhoto");
  const stageSelect = document.getElementById("stageSelect");
  const reviewForm = document.getElementById("reviewForm");
  const handoffButton = document.getElementById("handoffButton");
  const footerHandoffButton = document.getElementById("footerHandoffButton");
  const toast = document.getElementById("toast");

  function showView(viewId, title) {
    views.forEach((view) => view.classList.toggle("is-visible", view.id === viewId));
    pageTitle.textContent = title;
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeMobileMenu();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function addAudit(action, detail) {
    const time = new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date());
    state.auditLog.unshift({ time, action, detail });
    renderAuditLog();
  }

  function renderAuditLog() {
    const list = document.getElementById("auditLogList");
    if (!list) return;
    list.replaceChildren();
    const entries = state.auditLog.length
      ? state.auditLog
      : [{ time: "—", action: "대기", detail: "아직 기록된 작업이 없습니다." }];
    entries.forEach((entry) => {
      const item = document.createElement("li");
      const time = document.createElement("time");
      time.textContent = entry.time;
      const copy = document.createElement("span");
      const title = document.createElement("b");
      title.textContent = entry.action;
      const detail = document.createElement("small");
      detail.textContent = entry.detail;
      copy.append(title, detail);
      item.append(time, copy);
      list.appendChild(item);
    });
  }

  function showValidation(message) {
    validationMessage.textContent = message;
    validationMessage.hidden = !message;
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function createButton(label, handler, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener("click", handler);
    return button;
  }

  function addFiles(fileList) {
    const errors = [];
    const availableSlots = MAX_PHOTOS - state.photos.length;
    Array.from(fileList).slice(0, availableSlots).forEach((file) => {
      if (!ACCEPTED_TYPES.has(file.type)) {
        errors.push(`${file.name}: 지원하지 않는 형식입니다.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        errors.push(`${file.name}: 10MB를 초과했습니다.`);
        return;
      }
      const id = `photo-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
      state.photos.push({ id, file, url: URL.createObjectURL(file) });
      if (!state.primaryPhotoId) state.primaryPhotoId = id;
      addAudit("사진 등록", `${file.name} · ${formatBytes(file.size)}`);
    });
    if (fileList.length > availableSlots) errors.push(`사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있습니다.`);
    showValidation(errors.join(" "));
    renderUploadPhotos();
  }

  function renderUploadPhotos() {
    photoGrid.replaceChildren();
    state.photos.forEach((photo, index) => {
      const card = document.createElement("article");
      card.className = `photo-card${state.primaryPhotoId === photo.id ? " is-primary" : ""}`;

      const image = document.createElement("img");
      image.src = photo.url;
      image.alt = `업로드 사진 ${index + 1} 미리보기`;

      const body = document.createElement("div");
      body.className = "photo-card-body";
      const title = document.createElement("div");
      title.className = "photo-card-title";
      const name = document.createElement("b");
      name.textContent = photo.file.name;
      title.appendChild(name);
      if (state.primaryPhotoId === photo.id) {
        const tag = document.createElement("span");
        tag.className = "primary-tag";
        tag.textContent = "대표";
        title.appendChild(tag);
      }

      const meta = document.createElement("p");
      meta.className = "photo-meta";
      meta.textContent = `${photo.file.type.replace("image/", "").toUpperCase()} · ${formatBytes(photo.file.size)}`;

      const actions = document.createElement("div");
      actions.className = "photo-card-actions";
      if (state.primaryPhotoId !== photo.id) {
        actions.appendChild(createButton("대표 지정", () => {
          state.primaryPhotoId = photo.id;
          renderUploadPhotos();
        }));
      }
      if (index > 0) actions.appendChild(createButton("앞으로", () => movePhoto(index, index - 1)));
      if (index < state.photos.length - 1) actions.appendChild(createButton("뒤로", () => movePhoto(index, index + 1)));
      actions.appendChild(createButton("삭제", () => removePhoto(photo.id), "is-danger"));

      body.append(title, meta, actions);
      card.append(image, body);
      photoGrid.appendChild(card);
    });

    uploadCount.textContent = String(state.photos.length);
    analyzeButton.disabled = state.photos.length === 0;
    document.getElementById("photoPickerButton").disabled = state.photos.length >= MAX_PHOTOS;
    uploadHelper.textContent = state.photos.length === 0
      ? "사진을 1장 이상 등록하면 분석을 시작할 수 있습니다."
      : `${state.photos.length}장 등록됨 · 사진은 브라우저 메모리에서만 사용됩니다.`;
  }

  function movePhoto(from, to) {
    const [photo] = state.photos.splice(from, 1);
    state.photos.splice(to, 0, photo);
    renderUploadPhotos();
  }

  function removePhoto(id) {
    const photo = state.photos.find((item) => item.id === id);
    if (!photo || !window.confirm("이 사진을 진단 세션에서 삭제할까요?")) return;
    URL.revokeObjectURL(photo.url);
    state.photos = state.photos.filter((item) => item.id !== id);
    if (state.primaryPhotoId === id) state.primaryPhotoId = state.photos[0]?.id || null;
    if (state.activePhotoId === id) state.activePhotoId = state.primaryPhotoId;
    addAudit("사진 삭제", photo.file.name);
    renderUploadPhotos();
  }

  function clearPhotos() {
    state.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    state.photos = [];
    state.primaryPhotoId = null;
    state.activePhotoId = null;
    renderUploadPhotos();
  }

  function resetSession() {
    if (state.photos.length && !window.confirm("현재 진단 내용을 지우고 새 진단을 시작할까요?")) return;
    window.clearTimeout(state.analysisTimer);
    clearPhotos();
    state.stage = 2;
    state.redness = 2;
    state.scale = 2;
    state.sebum = 1;
    state.note = "";
    state.reviewed = false;
    state.handedOff = false;
    state.auditLog = [];
    state.capture = { site: "vertex", device: "demo-device", magnification: "x100" };
    reviewForm.reset();
    stageSelect.value = "2";
    document.getElementById("rednessInput").value = "2";
    document.getElementById("scaleInput").value = "2";
    document.getElementById("sebumInput").value = "1";
    document.getElementById("captureSite").value = "vertex";
    document.getElementById("captureDevice").value = "demo-device";
    document.getElementById("captureMagnification").value = "x100";
    showResultTab("overview");
    updateHandoffUI();
    renderAuditLog();
    showView("uploadView", "사진 등록");
  }

  function activePhoto() {
    if (!state.activePhotoId || !state.photos.some((photo) => photo.id === state.activePhotoId)) {
      state.activePhotoId = state.primaryPhotoId || state.photos[0]?.id || null;
    }
    return state.photos.find((photo) => photo.id === state.activePhotoId) || null;
  }

  function setPhoto(container, photo, alt) {
    container.querySelectorAll("img").forEach((image) => image.remove());
    if (!photo) return;
    const image = document.createElement("img");
    image.src = photo.url;
    image.alt = alt;
    container.prepend(image);
  }

  function renderThumbnails(container) {
    container.replaceChildren();
    state.photos.forEach((photo, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `thumbnail-button${photo.id === state.activePhotoId ? " is-active" : ""}`;
      button.setAttribute("aria-label", `진단 사진 ${index + 1} 보기`);
      const image = document.createElement("img");
      image.src = photo.url;
      image.alt = "";
      button.appendChild(image);
      button.addEventListener("click", () => {
        state.activePhotoId = photo.id;
        renderAllGalleries();
      });
      container.appendChild(button);
    });
  }

  function renderAllGalleries() {
    const photo = activePhoto();
    setPhoto(reviewPhoto, photo, "의료진 검토용 두피 사진");
    setPhoto(resultPhoto, photo, "자동 결과 두피 사진");
    setPhoto(evidencePhoto, photo, "판정 근거 표시 두피 사진");
    renderThumbnails(reviewThumbnails);
    renderThumbnails(resultThumbnails);
    document.getElementById("reviewPhotoCount").textContent = `${state.photos.length}장`;
  }

  function intensity(value) {
    const levels = [
      { label: "미관찰", finding: "뚜렷한 소견이 관찰되지 않음", pill: "미관찰", width: 8 },
      { label: "경도 관찰", finding: "일부 부위에서 경미한 소견 관찰", pill: "경도", width: 34 },
      { label: "중등도 관찰", finding: "여러 부위에서 중등도 소견 관찰", pill: "관찰됨", width: 67 },
      { label: "고도 관찰", finding: "넓은 범위에서 고도 소견 관찰", pill: "고도", width: 100 }
    ];
    return levels[Math.max(0, Math.min(3, Number(value)))] || levels[0];
  }

  function renderStageRail() {
    const rail = document.getElementById("stageRail");
    rail.replaceChildren();
    stages.forEach((stage, index) => {
      const item = document.createElement("div");
      if (index === state.stage) item.className = "is-current";
      const number = document.createElement("strong");
      number.textContent = String(index);
      const label = document.createTextNode(stage.label);
      item.append(number, label);
      rail.appendChild(item);
    });
  }

  function createPathNode(kind, pillText, title, copy) {
    const node = document.createElement("article");
    node.className = `path-node ${kind}`;
    const pill = document.createElement("span");
    pill.className = `stage-pill${kind === "is-current" ? " is-amber" : kind === "is-final" ? " is-red" : ""}`;
    pill.textContent = pillText;
    const heading = document.createElement("strong");
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = copy;
    node.append(pill, heading, paragraph);
    return node;
  }

  function createPathArrow() {
    const arrow = document.createElement("div");
    arrow.className = "path-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    return arrow;
  }

  function renderProgression() {
    const path = document.getElementById("progressionPath");
    path.replaceChildren();
    const current = stages[state.stage];
    path.appendChild(createPathNode("is-current", "현재 진단", `${state.stage}단계 · ${current.label}`, current.currentCopy));

    if (state.stage < 4) {
      const nextStage = state.stage + 1;
      path.appendChild(createPathArrow());
      path.appendChild(createPathNode("is-next", "다음 단계 가능성", `${nextStage}단계 참고`, current.nextCopy));
      if (nextStage < 4) {
        path.appendChild(createPathArrow());
        path.appendChild(createPathNode("is-final", "장기 위험 참고", "4단계 참고", "현재 진단이 아니며 장기 관리 부족 시의 고위험 예시입니다."));
      }
    } else {
      path.appendChild(createPathArrow());
      path.appendChild(createPathNode("is-next", "다음 행동", "의료진 우선 평가", current.nextCopy));
    }

    const nodeCount = path.children.length;
    path.style.gridTemplateColumns = nodeCount <= 3 ? "1fr 42px 1fr" : "1fr 42px 1fr 42px 1fr";
  }

  function renderProtocols() {
    const list = document.getElementById("protocolList");
    list.replaceChildren();
    stages[state.stage].protocols.forEach(([numberText, titleText, copyText, tagText]) => {
      const item = document.createElement("div");
      item.className = "protocol";
      const number = document.createElement("b");
      number.textContent = numberText;
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = titleText;
      const description = document.createElement("p");
      description.textContent = copyText;
      copy.append(title, description);
      const tag = document.createElement("span");
      tag.className = `stage-pill${tagText === "조건부" ? " is-gray" : ""}`;
      tag.textContent = tagText;
      item.append(number, copy, tag);
      list.appendChild(item);
    });
  }

  function updateFinding(prefix, value, noun) {
    const item = intensity(value);
    document.getElementById(`${prefix}Label`).textContent = item.label;
    document.getElementById(`${prefix}Meter`).style.width = `${item.width}%`;
    document.getElementById(`${prefix}Finding`).textContent = `${item.finding.replace("소견", noun)}`;
    document.getElementById(`${prefix}FindingPill`).textContent = item.pill;
    document.getElementById(`${prefix}FindingPill`).className = `stage-pill${Number(value) >= 2 ? " is-amber" : ""}`;
  }

  function renderResult() {
    const stage = stages[state.stage];
    document.getElementById("resultMetaStage").textContent = `${state.stage}단계 · ${stage.label}`;
    document.getElementById("overviewTitle").textContent = stage.title;
    document.getElementById("overviewStagePill").textContent = `현재 ${state.stage}단계`;
    document.getElementById("stageMeaningPill").textContent = stage.meaning;
    document.getElementById("overviewStageNumber").textContent = String(state.stage);
    document.getElementById("overviewSummary").textContent = stage.summary;
    document.getElementById("treatmentStagePill").textContent = `${state.stage}단계 · ${stage.label}`;
    document.getElementById("treatmentGoal").textContent = stage.goal;
    document.getElementById("resultReviewNote").textContent = state.note || "등록된 메모가 없습니다.";
    const reviewStatus = document.getElementById("reviewStatus");
    reviewStatus.textContent = state.reviewed ? "예외 검토 완료" : "자동 판정 결과";

    updateFinding("redness", state.redness, "붉은기");
    updateFinding("scale", state.scale, "각질");
    updateFinding("sebum", state.sebum, "유분");
    renderStageRail();
    renderProgression();
    renderProtocols();
    renderAllGalleries();
    renderAuditLog();
    updateHandoffUI();
  }

  function showResultTab(name) {
    document.querySelectorAll("[data-result-tab]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.resultTab === name));
    });
    document.querySelectorAll("[data-result-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.resultPanel === name);
    });
    const nav = document.querySelector(".result-nav");
    if (document.getElementById("resultView").classList.contains("is-visible")) {
      window.scrollTo({ top: Math.max(0, nav.offsetTop - 95), behavior: "smooth" });
    }
  }

  function updateHandoffUI() {
    const label = state.handedOff ? "상담 인계 완료" : "상담 인계";
    handoffButton.textContent = label;
    footerHandoffButton.textContent = state.handedOff ? "상담 인계 완료" : "상담실장에게 인계";
    handoffButton.disabled = state.handedOff;
    footerHandoffButton.disabled = state.handedOff;
    const source = state.reviewed ? "예외 검토" : "자동 판정";
    document.getElementById("handoffStatusText").textContent = state.handedOff
      ? `${source} · 인계 완료`
      : `${source} · 인계 대기`;
  }

  function handoff() {
    if (state.handedOff) return;
    if (!window.confirm("확정된 진단 결과를 상담실장에게 인계할까요?")) return;
    state.handedOff = true;
    addAudit("상담 인계", "결과와 기준표 버전을 상담실장에게 인계함");
    updateHandoffUI();
    showToast("상담 인계가 완료되었습니다. 이 기록은 새로고침하면 사라집니다.");
  }

  function openUpload() {
    showView("uploadView", "사진 등록");
  }

  function startAnalysis() {
    if (!state.photos.length) return;
    showValidation("");
    showView("analysisView", "데모 분석 중");
    state.capture = {
      site: document.getElementById("captureSite").value,
      device: document.getElementById("captureDevice").value,
      magnification: document.getElementById("captureMagnification").value
    };
    addAudit("품질 확인", `${state.photos.length}장 · 형식과 용량 통과`);
    addAudit("분석 시작", `${state.capture.site} · ${state.capture.device} · ${state.capture.magnification}`);
    window.clearTimeout(state.analysisTimer);
    state.analysisTimer = window.setTimeout(() => {
      state.activePhotoId = state.primaryPhotoId || state.photos[0]?.id || null;
      state.reviewed = false;
      state.handedOff = false;
      addAudit("자동 결과 생성", "합성 2단계 · 기준표 VER.4.1 적용");
      renderResult();
      showResultTab("overview");
      showView("resultView", "자동 진단 결과");
    }, 900);
  }

  function closeMobileMenu() {
    document.body.classList.remove("sidebar-open");
    document.getElementById("mobileMenuButton").setAttribute("aria-expanded", "false");
    document.getElementById("sidebarBackdrop").hidden = true;
  }

  document.getElementById("heroStartButton").addEventListener("click", openUpload);
  document.getElementById("diagnosisStartButton").addEventListener("click", resetSession);
  document.getElementById("backHomeButton").addEventListener("click", () => showView("homeView", "두피진단 VER.4.1"));
  document.getElementById("cancelUploadButton").addEventListener("click", () => showView("homeView", "두피진단 VER.4.1"));
  document.getElementById("photoPickerButton").addEventListener("click", () => photoInput.click());
  photoInput.addEventListener("change", (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  });
  analyzeButton.addEventListener("click", startAnalysis);
  document.getElementById("backUploadButton").addEventListener("click", openUpload);
  document.getElementById("editReviewButton").addEventListener("click", () => {
    renderAllGalleries();
    showView("reviewView", "예외 검토");
  });
  document.getElementById("printButton").addEventListener("click", () => window.print());
  handoffButton.addEventListener("click", handoff);
  footerHandoffButton.addEventListener("click", handoff);
  document.getElementById("doctorEscalationButton").addEventListener("click", () => showToast("의료진 상담 요청 상태로 전환했습니다. 로컬 프로토타입이라 서버에는 저장되지 않습니다."));

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.remove("is-dragover");
    });
  });
  uploadZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.stage = Number(stageSelect.value);
    state.redness = Number(document.getElementById("rednessInput").value);
    state.scale = Number(document.getElementById("scaleInput").value);
    state.sebum = Number(document.getElementById("sebumInput").value);
    state.note = document.getElementById("reviewNote").value.trim();
    state.reviewed = true;
    state.handedOff = false;
    addAudit("예외 검토 반영", `${state.stage}단계로 수정 · 사유 메모 ${state.note ? "기록" : "없음"}`);
    renderResult();
    showResultTab("overview");
    showView("resultView", "예외 검토 결과");
    showToast("예외 검토 결과가 새 버전으로 반영되었습니다.");
  });

  document.querySelectorAll("[data-result-tab]").forEach((button) => {
    button.addEventListener("click", () => showResultTab(button.dataset.resultTab));
  });
  document.querySelectorAll("[data-next-tab]").forEach((button) => {
    button.addEventListener("click", () => showResultTab(button.dataset.nextTab));
  });

  document.getElementById("mobileMenuButton").addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("sidebar-open");
    document.getElementById("mobileMenuButton").setAttribute("aria-expanded", String(isOpen));
    document.getElementById("sidebarBackdrop").hidden = !isOpen;
  });
  document.getElementById("sidebarBackdrop").addEventListener("click", closeMobileMenu);

  window.addEventListener("pagehide", () => {
    state.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  });

  renderUploadPhotos();
  renderAuditLog();
  updateHandoffUI();
})();
