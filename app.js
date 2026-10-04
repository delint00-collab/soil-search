(() => {
  "use strict";

  const BASE_W = 2120;
  const BASE_H = 1890;

  // 商品入れ替えだけなら、ここは編集不要です。
  const LAYOUT = {
    cellWidth: 210,
    cellHeight: 125,
    mainX: 70,
    blockYs: [20, 340, 660, 980, 1300, 1620],

    labelX: 42,
    labelWidth: 24.62,
    labelHeight: 70.15,

    upperIslandX: 1670,
    upperIslandY: 785,

    turfIslandX: 1670,
    turfIslandY: 980
  };

  const data = window.SOIL_DATA;

  const q = document.getElementById("q");
  const searchBtn = document.getElementById("searchBtn");
  const clearBtn = document.getElementById("clearBtn");
  const flipBtn = document.getElementById("flipBtn");
  const status = document.getElementById("status");
  const results = document.getElementById("results");
  const resultTitle = document.getElementById("resultTitle");
  const resultList = document.getElementById("resultList");
  const floorScroll = document.getElementById("floorScroll");
  const mapSizer = document.getElementById("mapSizer");
  const layout = document.getElementById("layout");
  const updatedAt = document.getElementById("updatedAt");

  let items = [];
  let targets = [];
  let currentScale = 1;
  let flipped = false;

  async function loadUpdatedAt() {
    if (!updatedAt) return;

    updatedAt.textContent = "取得中…";

    const apiUrl =
      "https://api.github.com/repos/delint00-collab/soil-search/commits?path=data.js&per_page=1";

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/vnd.github+json"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`GitHub API: ${response.status}`);
      }

      const commits = await response.json();
      const iso =
        commits?.[0]?.commit?.committer?.date ||
        commits?.[0]?.commit?.author?.date;

      if (!iso) {
        throw new Error("更新日時が取得できませんでした");
      }

      const date = new Date(iso);

      const parts = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(date);

      const value = Object.fromEntries(
        parts.map(part => [part.type, part.value])
      );

      updatedAt.textContent =
        `${value.year}/${value.month}/${value.day} ${value.hour}:${value.minute}`;

    } catch (error) {
      console.warn("更新日時の取得に失敗しました:", error);
      updatedAt.textContent = "取得失敗";
    }
  }

  const normalize = (s) => String(s || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s・･,，。．/／()（）\[\]【】「」『』＋+\-－_%％]/g, "");

  function parseCell(cell) {
    if (cell === null) {
      return { skip: true };
    }

    if (cell === "") {
      return { items: [], rowSpan: 1 };
    }

    if (typeof cell === "string") {
      return { items: [cell], rowSpan: 1 };
    }

    if (Array.isArray(cell)) {
      return { items: cell, rowSpan: 1 };
    }

    if (cell && typeof cell === "object" && Array.isArray(cell.items)) {
      return {
        items: cell.items,
        rowSpan: Number(cell.rowSpan) || 1
      };
    }

    return { items: [], rowSpan: 1 };
  }

  function saveNormalBox(el, left, top, width, height) {
    el.dataset.normalLeft = String(left);
    el.dataset.normalTop = String(top);
    el.dataset.boxWidth = String(width);
    el.dataset.boxHeight = String(height);
  }

  function createItem(cell, left, top) {
    const parsed = parseCell(cell);
    if (parsed.skip) return;

    const width = LAYOUT.cellWidth;
    const height = LAYOUT.cellHeight * parsed.rowSpan;

    const el = document.createElement("div");
    el.className = "item";
    el.style.left = left.toFixed(2) + "px";
    el.style.top = top.toFixed(2) + "px";
    el.style.width = width.toFixed(2) + "px";
    el.style.height = height.toFixed(2) + "px";
    el.style.fontSize = "18px";

    saveNormalBox(el, left, top, width, height);

    if (parsed.items.length === 0) {
      el.classList.add("blank");
      layout.appendChild(el);
      return;
    }

    el.dataset.label = parsed.items.join(" / ");
    el.dataset.search = normalize(parsed.items.join(" "));

    if (parsed.items.length > 1) {
      el.classList.add("multi-cell");

      parsed.items.forEach(name => {
        const line = document.createElement("div");
        line.className = "multi-product";
        line.textContent = name;
        el.appendChild(line);
      });
    } else {
      const line = document.createElement("div");
      line.textContent = parsed.items[0];
      el.appendChild(line);
    }

    layout.appendChild(el);
  }

  function createLabel(text, top) {
    if (!text) return;

    const left = LAYOUT.labelX;
    const width = LAYOUT.labelWidth;
    const height = LAYOUT.labelHeight;
    const y = top + (LAYOUT.cellHeight - height) / 2;

    const el = document.createElement("div");
    el.className = "label";
    el.textContent = text;
    el.style.left = left.toFixed(2) + "px";
    el.style.top = y.toFixed(2) + "px";
    el.style.width = width.toFixed(2) + "px";
    el.style.height = height.toFixed(2) + "px";
    el.style.fontSize = "16px";

    saveNormalBox(el, left, y, width, height);
    layout.appendChild(el);
  }

  function renderMainBlocks() {
    data.mainBlocks.forEach((block, blockIndex) => {
      const blockTop = LAYOUT.blockYs[blockIndex];

      for (let rowIndex = 0; rowIndex < 2; rowIndex++) {
        const rowTop = blockTop + rowIndex * LAYOUT.cellHeight;
        createLabel(block.labels?.[rowIndex] || "", rowTop);

        const row = block.rows?.[rowIndex] || [];

        for (let colIndex = 0; colIndex < 7; colIndex++) {
          createItem(
            colIndex < row.length ? row[colIndex] : "",
            LAYOUT.mainX + colIndex * LAYOUT.cellWidth,
            rowTop
          );
        }
      }
    });
  }

  function renderGrid(rows, startX, startY) {
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        createItem(
          cell,
          startX + colIndex * LAYOUT.cellWidth,
          startY + rowIndex * LAYOUT.cellHeight
        );
      });
    });
  }

  function renderLayout() {
    layout.replaceChildren();

    renderMainBlocks();

    renderGrid(
      data.side.upperIsland || [],
      LAYOUT.upperIslandX,
      LAYOUT.upperIslandY
    );

    renderGrid(
      data.side.turfIsland || [],
      LAYOUT.turfIslandX,
      LAYOUT.turfIslandY
    );

    items = [...layout.querySelectorAll(".item")];
    targets = [...layout.querySelectorAll(".item, .label")];
  }

  function fitText() {
    items.forEach(el => {
      if (el.classList.contains("blank")) return;

      let size = 18;
      el.style.fontSize = size + "px";

      while (
        size > 7 &&
        (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)
      ) {
        size -= 1;
        el.style.fontSize = size + "px";
      }
    });
  }

  function fitMap() {
    const mobile = window.matchMedia("(max-width:720px)").matches;
    const available = Math.max(
      280,
      floorScroll.clientWidth - (mobile ? 12 : 20)
    );

    currentScale = Math.min(1, available / BASE_W);

    layout.style.transform = `scale(${currentScale})`;
    mapSizer.style.width = (BASE_W * currentScale) + "px";
    mapSizer.style.height = (BASE_H * currentScale) + "px";
  }

  function clearMatches() {
    items.forEach(el => el.classList.remove("match"));
    results.classList.remove("show");
    resultList.replaceChildren();
  }

  function jumpTo(el) {
    const cardTop =
      document.querySelector(".floor-card").getBoundingClientRect().top +
      window.scrollY;

    const top = parseFloat(el.style.top || 0) * currentScale;

    window.scrollTo({
      top: Math.max(0, cardTop + top - 160),
      behavior: "smooth"
    });

    el.classList.remove("match");
    void el.offsetWidth;
    el.classList.add("match");
  }

  function runSearch() {
    clearMatches();

    const raw = q.value.trim();
    const terms = raw.split(/\s+/).map(normalize).filter(Boolean);

    if (!terms.length) {
      status.textContent =
        "商品名を入力すると該当する場所が点滅します。";
      return;
    }

    const matches = items.filter(el => {
      if (el.classList.contains("blank")) return false;

      const hay = el.dataset.search || "";
      return terms.every(term => hay.includes(term));
    });

    matches.forEach(el => el.classList.add("match"));

    if (!matches.length) {
      status.innerHTML =
        '<span class="no-result">「' +
        escapeHtml(raw) +
        '」に一致する商品は見つかりませんでした。</span>';
      return;
    }

    status.textContent =
      `「${raw}」：${matches.length}か所見つかりました。`;

    resultTitle.textContent =
      `該当する場所 ${matches.length}件`;

    matches.forEach((el, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "result-chip";
      button.textContent =
        `${index + 1}. ${el.dataset.label || "該当場所"}`;
      button.addEventListener("click", () => jumpTo(el));
      resultList.appendChild(button);
    });

    results.classList.add("show");

    setTimeout(() => jumpTo(matches[0]), 80);
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function applyOrientation() {
    targets.forEach(el => {
      const normalLeft = Number(el.dataset.normalLeft);
      const normalTop = Number(el.dataset.normalTop);
      const width = Number(el.dataset.boxWidth);
      const height = Number(el.dataset.boxHeight);

      if (
        !Number.isFinite(normalLeft) ||
        !Number.isFinite(normalTop) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height)
      ) return;

      if (flipped) {
        el.style.left =
          (BASE_W - normalLeft - width).toFixed(2) + "px";
        el.style.top =
          (BASE_H - normalTop - height).toFixed(2) + "px";
      } else {
        el.style.left = normalLeft.toFixed(2) + "px";
        el.style.top = normalTop.toFixed(2) + "px";
      }
    });

    // ボタン名は常に「反転」
    flipBtn.textContent = "反転";
    flipBtn.setAttribute(
      "aria-pressed",
      flipped ? "true" : "false"
    );
  }

  searchBtn.addEventListener("click", runSearch);

  q.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });

  clearBtn.addEventListener("click", () => {
    q.value = "";
    clearMatches();
    status.textContent =
      "商品名を入力すると該当する場所が点滅します。";
    q.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  flipBtn.addEventListener("click", () => {
    flipped = !flipped;
    applyOrientation();
  });

  window.addEventListener("resize", fitMap, { passive: true });

  renderLayout();
  fitText();
  fitMap();
  applyOrientation();
  loadUpdatedAt();
})();
