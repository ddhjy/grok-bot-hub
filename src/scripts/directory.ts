const SECTION_IDS = [
  "official",
  "tutorials",
  "cases",
  "skills",
  "reviews",
  "alternatives",
  "community",
] as const;

const QUERY_EXPAND: Record<string, string[]> = {
  发布稿: ["introducing"],
  introducing: ["发布稿"],
  定价: ["plans", "用量", "计费", "ultra", "heavy"],
  技能: ["skill", "routine", "插件", "mcp"],
  坑: ["踩坑", "论坛", "安全边界", "风控"],
  安装: ["get-started", "setup", "桌面端"],
  anzhuang: ["安装"],
  dingjia: ["定价", "plans"],
  jineng: ["技能", "skill"],
  keng: ["坑", "踩坑"],
  jiaocheng: ["教程"],
  shequ: ["社区"],
  chajian: ["插件"],
  denglu: ["登录"],
  anquan: ["安全"],
};

function normalize(value: string): string {
  return value.toLocaleLowerCase("zh-CN").trim();
}

function matchesQuery(haystack: string, query: string): boolean {
  if (!query) return true;
  if (haystack.includes(query)) return true;
  const extra = QUERY_EXPAND[query] ?? QUERY_EXPAND[query.replace(/\s+/g, "")];
  if (extra?.some((term) => haystack.includes(normalize(term)))) return true;
  return false;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initDirectory(): void {
  const root = document.querySelector<HTMLElement>("[data-directory]");
  if (!root) return;

  const search = root.querySelector<HTMLInputElement>("[data-search]");
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-filter]")];
  const cards = [...root.querySelectorAll<HTMLElement>("[data-card]")];
  const blocks = [...root.querySelectorAll<HTMLElement>("[data-section-block]")];
  const clusters = [...root.querySelectorAll<HTMLElement>("[data-cluster]")];
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  const emptyTitle = root.querySelector<HTMLElement>("[data-empty-title]");
  const emptyCopy = root.querySelector<HTMLElement>("[data-empty-copy]");
  const resultCount = root.querySelector<HTMLElement>("[data-result-count]");
  const startPath = root.querySelector<HTMLElement>("[data-start-path]");
  const toolbar = root.querySelector<HTMLElement>(".toolbar");
  const originalTitle = document.title;
  const defaultCountLabel = resultCount?.textContent ?? `共 ${cards.length} 条`;

  const syncToolbarOffset = (): void => {
    if (!toolbar) return;
    document.documentElement.style.setProperty("--toolbar", `${Math.ceil(toolbar.getBoundingClientRect().height)}px`);
  };

  let activeSection = "all";
  let urlTimer = 0;
  let skipScroll = true;

  const sectionLabel = (id: string): string => {
    if (id === "all") return "全部";
    const button = buttons.find((item) => item.dataset.filter === id);
    return button?.dataset.label ?? button?.childNodes[0]?.textContent?.trim() ?? id;
  };

  const readUrl = (): { section: string; q: string } => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") ?? "";
    const fromQuery = params.get("section") ?? "";
    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    const hashSection = hash.includes("=") ? "" : hash;
    const candidate = fromQuery || hashSection;
    const section = candidate === "all" || SECTION_IDS.includes(candidate as (typeof SECTION_IDS)[number]) ? candidate || "all" : "all";
    return { section, q };
  };

  const writeUrl = (): void => {
    const url = new URL(location.href);
    const q = (search?.value ?? "").trim();
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    if (activeSection && activeSection !== "all") url.searchParams.set("section", activeSection);
    else url.searchParams.delete("section");
    url.hash = "";
    const next = `${url.pathname}${url.search}`;
    const current = `${location.pathname}${location.search}`;
    if (next !== current) history.replaceState(null, "", next);
  };

  const scheduleUrl = (): void => {
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(writeUrl, 280);
  };

  const setPressed = (): void => {
    for (const button of buttons) {
      button.setAttribute("aria-pressed", button.dataset.filter === activeSection ? "true" : "false");
    }
  };

  const updateDocumentTitle = (query: string): void => {
    if (query && activeSection !== "all") {
      document.title = `${query} · ${sectionLabel(activeSection)} · Grok Bot 目录`;
    } else if (query) {
      document.title = `${query} · Grok Bot 目录`;
    } else if (activeSection !== "all") {
      document.title = `${sectionLabel(activeSection)} · Grok Bot 目录`;
    } else {
      document.title = originalTitle;
    }
  };

  const apply = (): void => {
    const query = normalize(search?.value ?? "");
    let visible = 0;
    const queryBySection = new Map<string, number>();
    const visibleBySection = new Map<string, number>();

    for (const card of cards) {
      const section = card.dataset.section ?? "";
      const haystack = card.dataset.search ?? "";
      const queryOk = matchesQuery(haystack, query);
      const sectionOk = activeSection === "all" || section === activeSection;
      const show = queryOk && sectionOk;
      card.hidden = !show;
      if (queryOk) {
        queryBySection.set(section, (queryBySection.get(section) ?? 0) + 1);
      }
      if (show) {
        visible += 1;
        visibleBySection.set(section, (visibleBySection.get(section) ?? 0) + 1);
      }
    }

    const queryTotal = [...queryBySection.values()].reduce((sum, n) => sum + n, 0);

    for (const button of buttons) {
      const id = button.dataset.filter ?? "all";
      const count = id === "all" ? queryTotal : (queryBySection.get(id) ?? 0);
      const countEl = button.querySelector("[data-count]");
      if (countEl) countEl.textContent = String(count);
      button.classList.toggle("is-empty", count === 0);
    }

    for (const block of blocks) {
      const id = block.dataset.sectionBlock ?? "";
      const count = visibleBySection.get(id) ?? 0;
      block.hidden = count === 0;
      const countEl = block.querySelector("[data-section-visible]");
      if (countEl) countEl.textContent = String(count);
    }

    for (const cluster of clusters) {
      const nested = [...cluster.querySelectorAll<HTMLElement>("[data-card]")];
      cluster.hidden = nested.every((card) => card.hidden);
    }

    if (startPath) {
      startPath.hidden = Boolean(query) || activeSection !== "all";
    }

    const isEmpty = visible === 0;
    if (empty) empty.hidden = !isEmpty;
    if (isEmpty) {
      const label = sectionLabel(activeSection);
      if (emptyTitle) {
        emptyTitle.textContent = query ? "没有匹配的条目" : "这个分区是空的";
      }
      if (emptyCopy) {
        if (query && activeSection !== "all") {
          emptyCopy.textContent = `「${search?.value.trim()}」在「${label}」里没有结果。`;
        } else if (query) {
          emptyCopy.textContent = `「${search?.value.trim()}」没有匹配的条目。`;
        } else {
          emptyCopy.textContent = `「${label}」里暂时没有条目。`;
        }
      }
    }

    if (resultCount) {
      resultCount.textContent = query || activeSection !== "all" ? `当前显示 ${visible} 条` : defaultCountLabel;
    }

    updateDocumentTitle(search?.value.trim() ?? "");
    syncToolbarOffset();
  };

  const scrollActiveSection = (): void => {
    if (skipScroll || activeSection === "all") return;
    const block = root.querySelector<HTMLElement>(`[data-section-block="${activeSection}"]`);
    if (!block || block.hidden) return;
    block.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  const setSection = (id: string, options?: { scroll?: boolean; immediateUrl?: boolean }): void => {
    activeSection = id || "all";
    setPressed();
    apply();
    if (options?.immediateUrl) writeUrl();
    else scheduleUrl();
    if (options?.scroll !== false) scrollActiveSection();
  };

  const resetAll = (): void => {
    if (search) search.value = "";
    skipScroll = true;
    setSection("all", { scroll: false, immediateUrl: true });
    search?.focus();
  };

  const clearSearch = (): void => {
    if (search) search.value = "";
    apply();
    writeUrl();
    search?.focus();
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      skipScroll = false;
      setSection(button.dataset.filter ?? "all", { immediateUrl: true });
    });
  }

  const filterGroup = root.querySelector<HTMLElement>("[data-filters]");
  filterGroup?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const enabled = buttons.filter((button) => !button.disabled);
    const current = document.activeElement as HTMLButtonElement | null;
    const index = current ? enabled.indexOf(current) : -1;
    if (index < 0) return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = enabled[(index + delta + enabled.length) % enabled.length];
    next?.focus();
  });

  search?.addEventListener("input", () => {
    apply();
    scheduleUrl();
  });
  search?.addEventListener("search", () => {
    apply();
    writeUrl();
  });

  root.querySelector("[data-reset]")?.addEventListener("click", resetAll);
  root.querySelector("[data-clear-search]")?.addEventListener("click", clearSearch);

  for (const suggest of root.querySelectorAll<HTMLButtonElement>("[data-suggest]")) {
    suggest.addEventListener("click", () => {
      if (search) search.value = suggest.dataset.suggest ?? "";
      skipScroll = true;
      setSection("all", { scroll: false, immediateUrl: true });
      search?.focus();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const target = event.target as HTMLElement | null;
      if (search && search.value) {
        event.preventDefault();
        clearSearch();
        return;
      }
      if (target === search) {
        search.blur();
      }
      return;
    }
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
      return;
    }
    event.preventDefault();
    search?.focus();
  });

  const initial = readUrl();
  if (search) search.value = initial.q;
  activeSection = initial.section;
  setPressed();
  apply();
  writeUrl();
  syncToolbarOffset();
  window.addEventListener("resize", syncToolbarOffset);
  if (initial.section !== "all") {
    skipScroll = false;
    requestAnimationFrame(() => scrollActiveSection());
  }
  skipScroll = false;
}
