import { isActiveQuery, matchesQuery, normalizeQuery, SECTION_QUERY } from "../lib/query";

const SECTION_IDS = [
  "official",
  "tutorials",
  "cases",
  "skills",
  "reviews",
  "alternatives",
  "community",
  "takes",
] as const;

type HistoryMode = "replace" | "push";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initDirectory(): void {
  const root = document.querySelector<HTMLElement>("[data-directory]");
  if (!root) return;

  const base = root.dataset.base || "/grok-bot-hub/";
  const search = root.querySelector<HTMLInputElement>("[data-search]");
  const searchWrap = root.querySelector<HTMLElement>(".search");
  const buttons = [...root.querySelectorAll<HTMLAnchorElement>("[data-filter]")];
  const cards = [...root.querySelectorAll<HTMLElement>("[data-card]")];
  const blocks = [...root.querySelectorAll<HTMLElement>("[data-section-block]")];
  const clusters = [...root.querySelectorAll<HTMLElement>("[data-cluster]")];
  const restWraps = [...root.querySelectorAll<HTMLElement>("[data-cluster-rest-wrap]")];
  const restExtras = [...root.querySelectorAll<HTMLDetailsElement>("[data-rest-extra]")];
  const casePinnedWrap = root.querySelector<HTMLElement>("[data-case-pinned]");
  const caseGroups = [...root.querySelectorAll<HTMLDetailsElement>("[data-case-group]")];
  const caseOpenGroups = [...root.querySelectorAll<HTMLElement>("[data-case-open]")];
  const salesExtras = [...root.querySelectorAll<HTMLDetailsElement>("[data-sales-extra]")];
  const opsExtras = [...root.querySelectorAll<HTMLDetailsElement>("[data-ops-extra]")];
  const casesExtras = [...root.querySelectorAll<HTMLDetailsElement>("[data-cases-extra]")];
  const communityExtras = [...root.querySelectorAll<HTMLDetailsElement>("[data-community-extra]")];
  const skillsLead = root.querySelector<HTMLElement>("[data-skills-lead]");
  const isSearchPage = root.dataset.searchPage === "true";
  const documentedQueries = new Set(
    (root.dataset.searchDocs ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const sectionQueryDocs = new Set(
    (root.dataset.sectionDocs ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const pageSection = root.dataset.pageSection ?? "";
  const isSectionPage = Boolean(pageSection);
  const takesBlock = root.querySelector<HTMLElement>("[data-takes-block]");
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  const emptyTitle = root.querySelector<HTMLElement>("[data-empty-title]");
  const emptyCopy = root.querySelector<HTMLElement>("[data-empty-copy]");
  const resultCount = root.querySelector<HTMLElement>("[data-result-count]");
  const resultLive = root.querySelector<HTMLElement>("[data-result-live]");
  const startPath = root.querySelector<HTMLElement>("[data-start-path]");
  const toolbar = root.querySelector<HTMLElement>(".toolbar");
  const filtersEl = root.querySelector<HTMLElement>("[data-filters]");
  const filtersWrap = root.querySelector<HTMLElement>(".filters-wrap");
  const sortButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-sort-value]")];
  const share = root.querySelector<HTMLButtonElement>("[data-share]");
  const shareStatus = root.querySelector<HTMLElement>("[data-share-status]");
  const shareFallback = root.querySelector<HTMLElement>("[data-share-fallback]");
  const shareText = root.querySelector<HTMLTextAreaElement>("[data-share-text]");
  type AddedSort = "new" | "old";
  const SORT_KEY = "hub-sort";
  const parseSort = (raw: string | null | undefined): AddedSort => {
    if (raw === "old" || raw === "added-asc") return "old";
    if (raw === "new" || raw === "added-desc") return "new";
    return "new";
  };
  let addedSort: AddedSort = (() => {
    const fromUrl = new URLSearchParams(location.search).get("sort");
    if (fromUrl === "new" || fromUrl === "old" || fromUrl === "added-desc" || fromUrl === "added-asc") return parseSort(fromUrl);
    try {
      return parseSort(localStorage.getItem(SORT_KEY));
    } catch {
      return "new";
    }
  })();

  const syncSortButtons = (): void => {
    for (const button of sortButtons) {
      button.setAttribute("aria-pressed", button.dataset.sortValue === addedSort ? "true" : "false");
    }
  };

  const sortCardNodes = (): void => {
    const containers = new Set<HTMLElement>();
    for (const card of cards) {
      const host = card.closest(".grid, .doc-list, .doc-index, .community-rank");
      if (host instanceof HTMLElement) containers.add(host);
    }
    for (const host of containers) {
      const items = [...host.children].filter((el): el is HTMLElement => {
        return el instanceof HTMLElement && Boolean(el.matches("[data-card]") || el.querySelector("[data-card]"));
      });
      if (items.length < 2) continue;
      const addedOf = (el: HTMLElement): string =>
        el.dataset.added || el.querySelector<HTMLElement>("[data-card]")?.dataset.added || "";
      const idOf = (el: HTMLElement): string =>
        el.dataset.id || el.querySelector<HTMLElement>("[data-card]")?.dataset.id || "";
      items.sort((a, b) => {
        const cmp = addedOf(a).localeCompare(addedOf(b));
        if (cmp !== 0) return addedSort === "old" ? cmp : -cmp;
        return idOf(a).localeCompare(idOf(b));
      });
      for (const item of items) host.appendChild(item);
    }
  };

  const withSort = (href: string): string => {
    const url = new URL(href, location.origin);
    if (addedSort === "old") url.searchParams.set("sort", "old");
    else url.searchParams.delete("sort");
    return `${url.pathname}${url.search}`;
  };

  const persistSort = (): void => {
    try {
      localStorage.setItem(SORT_KEY, addedSort);
    } catch {
      /* ignore quota / private mode */
    }
  };

  const catalogTitle = "Grok Bot 目录";
  const defaultCountLabel = resultCount?.textContent ?? `共 ${cards.length} 条`;
  const shareIdleLabel = share?.textContent ?? "复制链接";
  const placeholderLong = search?.dataset.placeholderLong ?? "搜索标题";
  const placeholderShort = search?.dataset.placeholderShort ?? "搜索目录";
  const placeholderCompact = search?.dataset.placeholderCompact ?? "搜索";

  const syncToolbarOffset = (): void => {
    if (!toolbar) return;
    document.documentElement.style.setProperty("--toolbar", `${Math.ceil(toolbar.getBoundingClientRect().height)}px`);
  };

  let activeSection = "all";
  let urlTimer = 0;
  let liveTimer = 0;
  let skipScroll = true;
  let applyingHistory = false;
  let liveImmediate = true;
  let allowLive = false;

  const sectionLabel = (id: string): string => {
    if (id === "all") return "全部";
    const button = buttons.find((item) => item.dataset.filter === id);
    return button?.dataset.label ?? button?.childNodes[0]?.textContent?.trim() ?? id;
  };

  const trimmedBase = (): string => (base.endsWith("/") ? base.slice(0, -1) : base);

  const pathRest = (pathname: string): string => {
    const prefix = trimmedBase();
    if (pathname === prefix || pathname === `${prefix}/`) return "";
    if (!pathname.startsWith(`${prefix}/`)) return "";
    return pathname.slice(prefix.length + 1).replace(/\/$/, "");
  };

  const pathSegments = (pathname: string): string[] => {
    return pathRest(pathname).split("/").filter(Boolean);
  };

  const isSearchPath = (pathname: string): boolean => {
    const segs = pathSegments(pathname);
    return segs[0] === "search";
  };

  const decodeSeg = (value: string): string => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const queryFromSearchPath = (pathname: string): string => {
    const segs = pathSegments(pathname);
    if (segs[0] !== "search" || segs.length < 2) return "";
    return decodeSeg(segs.slice(1).join("/"));
  };

  const queryFromSectionPath = (pathname: string): string => {
    const segs = pathSegments(pathname);
    if (segs.length < 2) return "";
    if (!SECTION_IDS.includes(segs[0] as (typeof SECTION_IDS)[number])) return "";
    return decodeSeg(segs.slice(1).join("/"));
  };

  const sectionQueryHref = (id: string, q: string): string => {
    return withSort(`${base}${id}/${encodeURIComponent(canonicalShareQuery(q))}/`);
  };

  const canonicalShareQuery = (q: string): string => {
    if (documentedQueries.has(q)) return q;
    const lower = q.toLocaleLowerCase("en-US");
    for (const item of documentedQueries) {
      if (item.toLocaleLowerCase("en-US") === lower) return item;
    }
    return q;
  };

  const hasSearchDoc = (q: string): boolean => {
    if (!q) return false;
    if (documentedQueries.has(q)) return true;
    const lower = q.toLocaleLowerCase("en-US");
    for (const item of documentedQueries) {
      if (item.toLocaleLowerCase("en-US") === lower) return true;
    }
    return false;
  };

  const hasSectionQueryDoc = (section: string, q: string): boolean => {
    if (!section || section === "all" || !q) return false;
    const key = canonicalShareQuery(q);
    if (sectionQueryDocs.has(`${section}\t${key}`) || sectionQueryDocs.has(`${section}\t${q}`)) return true;
    const lower = key.toLocaleLowerCase("en-US");
    for (const item of sectionQueryDocs) {
      const [id, doc] = item.split("\t");
      if (id === section && doc && doc.toLocaleLowerCase("en-US") === lower) return true;
    }
    return false;
  };

  const searchDocHref = (q: string): string => {
    const key = canonicalShareQuery(q);
    return withSort(`${base}search/${encodeURIComponent(key)}/`);
  };

  const sectionNameQuery = (q: string): string => {
    return SECTION_QUERY[q] ?? SECTION_QUERY[normalizeQuery(q)] ?? "";
  };

  const sectionFromPathname = (pathname: string): string => {
    const segs = pathSegments(pathname);
    if (!segs.length || segs[0] === "search") return "all";
    if (SECTION_IDS.includes(segs[0] as (typeof SECTION_IDS)[number])) return segs[0];
    return "all";
  };

  const sectionHref = (id: string, q = ""): string => {
    const path = !id || id === "all" ? base : `${base}${id}/`;
    if (!q) return withSort(path);
    const url = new URL(path, location.origin);
    url.searchParams.set("q", q);
    return withSort(`${url.pathname}${url.search}`);
  };

  const searchHref = (q: string): string => {
    if (q && hasSearchDoc(q)) return searchDocHref(q);
    const url = new URL(`${base}search/`, location.origin);
    if (q) url.searchParams.set("q", q);
    return withSort(`${url.pathname}${url.search}`);
  };

  const readUrl = (): { section: string; q: string; legacySection: string; searchPage: boolean } => {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get("section") ?? "";
    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    const hashSection = hash.includes("=") || hash === "main" ? "" : hash;
    const fromPath = sectionFromPathname(location.pathname);
    const legacy = fromQuery || hashSection;
    const searchPage = isSearchPath(location.pathname);
    const pathQuery = queryFromSearchPath(location.pathname) || queryFromSectionPath(location.pathname);
    const q = pathQuery || (params.get("q") ?? "");
    const legacySection =
      fromPath === "all" && !searchPage && SECTION_IDS.includes(legacy as (typeof SECTION_IDS)[number])
        ? legacy
        : "";
    const section =
      fromPath !== "all" && SECTION_IDS.includes(fromPath as (typeof SECTION_IDS)[number])
        ? fromPath
        : "all";
    return { section, q, legacySection, searchPage };
  };

  const activeQuery = (): string => {
    const q = (search?.value ?? "").trim();
    return isActiveQuery(normalizeQuery(q)) ? q : "";
  };

  const buildPath = (): string => {
    const q = activeQuery();
    if (isSearchPath(location.pathname)) {
      const pathQ = queryFromSearchPath(location.pathname);
      if (q && pathQ && canonicalShareQuery(q) === canonicalShareQuery(pathQ)) return withSort(location.pathname);
      if (!q) return withSort(`${base}search/`);
      return searchHref(q);
    }
    const sectionPathQ = queryFromSectionPath(location.pathname);
    if (sectionPathQ && q && canonicalShareQuery(q) === canonicalShareQuery(sectionPathQ)) {
      return withSort(location.pathname);
    }
    if (q && activeSection !== "all" && hasSectionQueryDoc(activeSection, q)) {
      return sectionQueryHref(activeSection, q);
    }
    const path = sectionHref(activeSection, "");
    if (!q) return withSort(path);
    if (activeSection === "all") return searchHref(q);
    return withSort(path);
  };

  const shareUrl = (): string | null => {
    const q = activeQuery();
    if (q) {
      const named = sectionNameQuery(q);
      if (named) return `${location.origin}${sectionHref(named, "")}`;
      if (activeSection !== "all" && hasSectionQueryDoc(activeSection, q)) {
        return `${location.origin}${sectionQueryHref(activeSection, q)}`;
      }
      if ((activeSection === "all" || isSearchPath(location.pathname)) && hasSearchDoc(q)) {
        return `${location.origin}${searchDocHref(q)}`;
      }
      return null;
    }
    if (isSearchPath(location.pathname)) return `${location.origin}${base}search/`;
    return `${location.origin}${sectionHref(activeSection, "")}`;
  };

  const shareAvailable = (): boolean => shareUrl() !== null;

  const writeUrl = (mode: HistoryMode): void => {
    if (applyingHistory) return;
    const next = buildPath();
    if (next === `${location.pathname}${location.search}` && !location.hash) return;
    const dest = new URL(next, location.origin);
    dest.hash = "";
    const state = { section: activeSection, q: (search?.value ?? "").trim() };
    if (mode === "push") history.pushState(state, "", dest.href);
    else history.replaceState(state, "", dest.href);
    if (location.hash) history.replaceState(state, "", dest.href);
  };

  const scheduleTypedUrl = (): void => {
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(() => {
      const q = activeQuery();
      const hadQuery = new URLSearchParams(location.search).has("q");
      writeUrl(q && !hadQuery ? "push" : "replace");
    }, 280);
  };

  const announceCount = (text: string, immediate: boolean): void => {
    if (!resultLive || !allowLive) return;
    window.clearTimeout(liveTimer);
    const run = (): void => {
      resultLive.textContent = text;
    };
    if (immediate) run();
    else liveTimer = window.setTimeout(run, 400);
  };

  const isChipNavigable = (button: HTMLAnchorElement): boolean => {
    return button.tabIndex >= 0;
  };

  const syncPlaceholder = (): void => {
    if (!search) return;
    const width = window.innerWidth;
    if (width < 520) search.placeholder = placeholderCompact;
    else if (width < 1280) search.placeholder = placeholderShort;
    else search.placeholder = placeholderLong;
  };

  const scrollChipIntoTrack = (button: HTMLAnchorElement): void => {
    if (!filtersEl) return;
    const last = buttons[buttons.length - 1];
    if (button === last) {
      filtersEl.scrollLeft = filtersEl.scrollWidth;
      syncFilterFade();
      return;
    }
    const wrapRect = filtersEl.getBoundingClientRect();
    const r = button.getBoundingClientRect();
    const pad = 12;
    if (r.left < wrapRect.left + pad) {
      filtersEl.scrollLeft += r.left - wrapRect.left - pad;
    } else if (r.right > wrapRect.right - pad) {
      filtersEl.scrollLeft += r.right - wrapRect.right + pad;
    }
    syncFilterFade();
  };

  const syncFilterFade = (): void => {
    if (!filtersEl || !filtersWrap) return;
    const max = filtersEl.scrollWidth - filtersEl.clientWidth;
    const left = filtersEl.scrollLeft > 2;
    const atEnd = max <= 2 || filtersEl.scrollLeft >= max - 2;
    const overflow = max > 2;
    filtersWrap.classList.toggle("has-left-fade", left);
    filtersWrap.classList.toggle("has-right-fade", overflow && !atEnd);
    filtersWrap.classList.toggle("is-at-end", overflow && atEnd);

    const wrapRect = filtersEl.getBoundingClientRect();
    const leftCover =
      overflow && atEnd ? parseFloat(getComputedStyle(filtersWrap, "::before").width || "0") || 0 : 0;
    const rightCover =
      overflow && !atEnd ? parseFloat(getComputedStyle(filtersWrap, "::after").width || "0") || 0 : 0;
    const leftBound = wrapRect.left + leftCover;
    const rightBound = wrapRect.right - rightCover;
    const focused = document.activeElement;
    for (const button of buttons) {
      const r = button.getBoundingClientRect();
      const whole = r.left >= leftBound - 1 && r.right <= rightBound + 1;
      const off = overflow && !whole && button !== focused;
      button.classList.toggle("is-off-track", off);
      button.removeAttribute("aria-hidden");
      const empty = button.classList.contains("is-empty");
      const keepInTab = !empty || button.dataset.filter === activeSection;
      button.tabIndex = keepInTab ? 0 : -1;
    }
  };

  const syncChipHrefs = (): void => {
    for (const button of buttons) {
      const id = button.dataset.filter ?? "all";
      button.setAttribute("href", sectionHref(id, ""));
    }
  };

  const setPressed = (): void => {
    for (const button of buttons) {
      button.setAttribute("aria-pressed", button.dataset.filter === activeSection ? "true" : "false");
    }
  };

  const shareTitle = (): string => {
    const q = activeQuery();
    if (q) {
      const named = sectionNameQuery(q);
      if (named) return `${sectionLabel(named)} · ${catalogTitle}`;
      if (activeSection !== "all" && hasSectionQueryDoc(activeSection, q)) {
        return `「${q}」的搜索 · ${sectionLabel(activeSection)} · ${catalogTitle}`;
      }
      if ((activeSection === "all" || isSearchPath(location.pathname)) && hasSearchDoc(q)) {
        return `「${q}」的搜索 · ${catalogTitle}`;
      }
      if (isSearchPath(location.pathname)) return `搜索 · ${catalogTitle}`;
      if (activeSection !== "all") return `${sectionLabel(activeSection)} · ${catalogTitle}`;
      return catalogTitle;
    }
    if (activeSection !== "all") return `${sectionLabel(activeSection)} · ${catalogTitle}`;
    if (isSearchPath(location.pathname)) return `搜索 · ${catalogTitle}`;
    return catalogTitle;
  };

  const sharePaste = (): string | null => {
    const url = shareUrl();
    if (!url) return null;
    return `${shareTitle()}\n${url}`;
  };

  const idleShareName = (): string => {
    if (!shareAvailable()) return "此搜索没有可分享的卡片";
    const q = activeQuery();
    if (q) {
      const named = sectionNameQuery(q);
      if (named) return `复制「${sectionLabel(named)}」页面的标题和链接`;
      if (activeSection !== "all" && hasSectionQueryDoc(activeSection, q)) {
        return `复制「${q}」在「${sectionLabel(activeSection)}」的标题和链接`;
      }
      if (hasSearchDoc(q)) return `复制「${q}」搜索页的标题和链接`;
    }
    if (isSearchPath(location.pathname)) return "复制搜索页的标题和链接";
    if (activeSection !== "all") return `复制「${sectionLabel(activeSection)}」页面的标题和链接`;
    return "复制标题和链接";
  };

  const syncShareAvailability = (): void => {
    if (!share) return;
    const ok = shareAvailable();
    share.hidden = !ok;
    share.classList.toggle("is-unavailable", !ok);
    share.toggleAttribute("aria-disabled", !ok);
    if (!ok) share.setAttribute("aria-hidden", "true");
    else share.removeAttribute("aria-hidden");
    if (share.textContent === shareIdleLabel || share.textContent === "请手动复制") {
      share.setAttribute("aria-label", idleShareName());
    }
  };

  const hideShareFallback = (): void => {
    if (shareFallback) shareFallback.hidden = true;
  };

  const showShareFallback = (text: string): void => {
    if (!shareFallback || !shareText) return;
    shareFallback.hidden = false;
    shareText.value = text;
    shareText.focus();
    shareText.select();
  };

  const resetShareChrome = (): void => {
    hideShareFallback();
    if (!share) return;
    share.textContent = shareIdleLabel;
    share.setAttribute("aria-label", idleShareName());
    if (shareStatus) shareStatus.textContent = "";
  };

  const updateDocumentTitle = (rawQuery: string): void => {
    const q = isActiveQuery(normalizeQuery(rawQuery)) ? rawQuery.trim() : "";
    if (q) {
      const named = sectionNameQuery(q);
      if (named) {
        document.title = `${sectionLabel(named)} · ${catalogTitle}`;
        return;
      }
      if (activeSection !== "all" && activeSection !== "takes") {
        document.title = `「${q}」的搜索 · ${sectionLabel(activeSection)} · ${catalogTitle}`;
        return;
      }
      document.title = `「${q}」的搜索 · ${catalogTitle}`;
      return;
    }
    document.title = shareTitle();
  };

  const cardWouldShow = (card: HTMLElement, sectionFilter: string, query: string): boolean => {
    if (isSearchPage && !isActiveQuery(query)) return false;
    const section = card.dataset.section ?? "";
    const primary = card.dataset.search ?? "";
    const blurb = card.dataset.searchBlurb ?? "";
    const urlField = card.dataset.searchUrl ?? "";
    if (!matchesQuery(primary, blurb, query, { url: urlField, section })) return false;
    if (card.dataset.caseTake === "true") {
      if (sectionFilter === "takes") return true;
      if (sectionFilter === "cases") return false;
      if (sectionFilter !== "all") return false;
    } else if (sectionFilter === "takes") {
      return false;
    } else if (sectionFilter !== "all" && section !== sectionFilter) {
      return false;
    }
    const hideDemoted = !isActiveQuery(query);
    if (hideDemoted && card.dataset.inStartPath === "true") {
      if (sectionFilter === "all") return false;
      if (sectionFilter !== activeSection) return false;
    }
    if (hideDemoted && card.dataset.demote) return false;
    if (hideDemoted && pageSection === "cases" && card.dataset.casesRest === "true") return false;
    return true;
  };

  const apply = (): void => {
    const rawQuery = search?.value.trim() ?? "";
    const query = isActiveQuery(normalizeQuery(rawQuery)) ? normalizeQuery(rawQuery) : "";
    let visible = 0;
    const visibleBySection = new Map<string, number>();
    let visibleTakes = 0;

    hideShareFallback();
    if (share?.textContent === "请手动复制") resetShareChrome();
    searchWrap?.classList.toggle("has-query", Boolean(rawQuery));

    for (const card of cards) {
      const section = card.dataset.section ?? "";
      const show = cardWouldShow(card, activeSection, query);
      card.hidden = !show;
      if (show) {
        visible += 1;
        if (card.dataset.caseTake === "true") visibleTakes += 1;
        else visibleBySection.set(section, (visibleBySection.get(section) ?? 0) + 1);
      }
    }

    for (const button of buttons) {
      const id = button.dataset.filter ?? "all";
      const countEl = button.querySelector("[data-count]");
      if (countEl) {
        const dest = Number(countEl.getAttribute("data-dest-count") ?? countEl.textContent ?? "0");
        countEl.textContent = String(dest);
        button.classList.toggle("is-empty", dest === 0);
      } else {
        button.classList.remove("is-empty");
      }
      button.removeAttribute("aria-disabled");
      const empty = button.classList.contains("is-empty");
      const keepInTab = !empty || id === activeSection;
      button.tabIndex = keepInTab ? 0 : -1;
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

    root.classList.toggle("is-searching", Boolean(query));

    for (const wrap of restWraps) {
      const nested = [...wrap.querySelectorAll<HTMLElement>("[data-card]")];
      const visibleRest = nested.filter((card) => !card.hidden);
      wrap.hidden = visibleRest.length === 0;
      const label = wrap.querySelector<HTMLElement>("[data-rest-label]");
      if (label) label.hidden = visibleRest.length === 0 || Boolean(query);
    }

    for (const extra of restExtras) {
      const nested = [...extra.querySelectorAll<HTMLElement>("[data-card]")];
      const visibleExtra = nested.filter((card) => !card.hidden);
      extra.hidden = visibleExtra.length === 0;
      if (query) extra.open = true;
    }

    if (casePinnedWrap) {
      const nested = [...casePinnedWrap.querySelectorAll<HTMLElement>("[data-card]")];
      casePinnedWrap.hidden = nested.every((card) => card.hidden);
    }

    if (skillsLead) {
      const nested = [...skillsLead.querySelectorAll<HTMLElement>("[data-card]")];
      skillsLead.hidden = nested.every((card) => card.hidden);
    }

    for (const group of caseGroups) {
      const nested = [...group.querySelectorAll<HTMLElement>("[data-card]")];
      const visibleGroup = nested.filter((card) => !card.hidden);
      group.hidden = visibleGroup.length === 0;
      const countEl = group.querySelector("[data-group-count]");
      if (countEl) countEl.textContent = String(visibleGroup.length);
      if (query) group.open = true;
    }

    for (const group of caseOpenGroups) {
      const nested = [...group.querySelectorAll<HTMLElement>("[data-card]")];
      group.hidden = nested.every((card) => card.hidden);
    }

    for (const extra of salesExtras) {
      const nested = [...extra.querySelectorAll<HTMLElement>("[data-card]")];
      const visibleExtra = nested.filter((card) => !card.hidden);
      extra.hidden = visibleExtra.length === 0;
      const countEl = extra.querySelector("[data-sales-extra-count]");
      if (countEl) countEl.textContent = String(visibleExtra.length);
      if (query) extra.open = true;
    }

    for (const extra of opsExtras) {
      const nested = [...extra.querySelectorAll<HTMLElement>("[data-card]")];
      const visibleExtra = nested.filter((card) => !card.hidden);
      extra.hidden = visibleExtra.length === 0;
      const countEl = extra.querySelector("[data-ops-extra-count]");
      if (countEl) countEl.textContent = String(visibleExtra.length);
      if (query) extra.open = true;
    }

    for (const extra of communityExtras) {
      const nested = [...extra.querySelectorAll<HTMLElement>("[data-card]")];
      const visibleExtra = nested.filter((card) => !card.hidden);
      extra.hidden = visibleExtra.length === 0;
      if (query) extra.open = true;
    }

    for (const extra of casesExtras) {
      const nested = [...extra.querySelectorAll<HTMLElement>("[data-card]")];
      const visibleExtra = nested.filter((card) => !card.hidden);
      extra.hidden = visibleExtra.length === 0;
      const countEl = extra.querySelector("[data-cases-extra-count]");
      if (countEl) countEl.textContent = String(visibleExtra.length);
      if (query) extra.open = true;
    }

    if (takesBlock) {
      takesBlock.hidden = visibleTakes === 0;
      const countEl = takesBlock.querySelector("[data-takes-visible]");
      if (countEl) countEl.textContent = String(visibleTakes);
    }

    if (startPath) {
      startPath.hidden = Boolean(query) || activeSection !== "all" || isSearchPath(location.pathname);
    }

    const inClosedExtra = (card: HTMLElement): boolean => {
      const extra = card.closest("[data-sales-extra], [data-ops-extra], [data-cases-extra]");
      return Boolean(extra && extra instanceof HTMLDetailsElement && !extra.open && !extra.hidden);
    };

    let counted = visible;
    if (pageSection === "cases" && !query) {
      counted = cards.filter((card) => !card.hidden && !inClosedExtra(card)).length;
    }

    const isEmpty = visible === 0;
    if (empty) empty.hidden = !isEmpty;
    if (isEmpty) {
      const label = sectionLabel(activeSection);
      const emptySearch = isSearchPath(location.pathname) && !query;
      if (emptyTitle) {
        emptyTitle.textContent = query ? "没有匹配的条目" : emptySearch ? "输入关键词" : "这个分区是空的";
      }
      if (emptyCopy) {
        if (query && activeSection !== "all") {
          emptyCopy.textContent = `「${rawQuery}」在「${label}」里没有结果。`;
        } else if (query) {
          emptyCopy.textContent = `「${rawQuery}」没有匹配的条目。`;
        } else if (emptySearch) {
          emptyCopy.textContent = "在目录里搜标题、别名和分区。";
        } else {
          emptyCopy.textContent = `「${label}」里暂时没有条目。`;
        }
      }
    }

    const countText =
      isSearchPath(location.pathname) && !query
        ? "输入关键词开始搜索"
        : query || activeSection !== "all"
          ? `当前显示 ${counted} 条`
          : defaultCountLabel;
    if (resultCount) resultCount.textContent = countText;
    announceCount(countText, liveImmediate);

    if (share && share.textContent === shareIdleLabel) {
      share.setAttribute("aria-label", idleShareName());
    }
    syncShareAvailability();
    updateDocumentTitle(rawQuery);
    syncChipHrefs();
    syncToolbarOffset();
    syncPlaceholder();
    syncFilterFade();
    syncSortButtons();
    sortCardNodes();
  };

  const scrollActiveSection = (): void => {
    if (skipScroll || activeSection === "all" || isSectionPage) return;
    const block = root.querySelector<HTMLElement>("[data-section-block=\"" + activeSection + "\"]");
    if (!block || block.hidden) return;
    block.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  const goToSection = (id: string, q: string, mode: HistoryMode): void => {
    const named = q ? sectionNameQuery(q) : "";
    const dest = named
      ? sectionHref(named, "")
      : id === "all" && q
        ? searchHref(q)
        : sectionHref(id, q && id !== "all" ? q : "");
    if (mode === "replace") location.replace(dest);
    else location.assign(dest);
  };

  const setSection = (id: string, options?: { scroll?: boolean; url?: HistoryMode | false }): void => {
    const next = id || "all";
    const q = activeQuery();
    if (next !== activeSection) {
      goToSection(next, next === "all" ? "" : q, options?.url === "replace" ? "replace" : "push");
      return;
    }
    activeSection = next;
    setPressed();
    liveImmediate = true;
    apply();
    if (options?.url !== false) writeUrl(options?.url ?? "replace");
    if (options?.scroll !== false) scrollActiveSection();
  };

  const restoreFromLocation = (): void => {
    const next = readUrl();
    if (next.legacySection) {
      goToSection(next.legacySection, next.q, "replace");
      return;
    }
    const named = next.q ? sectionNameQuery(next.q) : "";
    if (named) {
      goToSection(named, "", "replace");
      return;
    }
    if (next.q && next.section === "all" && !next.searchPage && hasSearchDoc(next.q)) {
      location.replace(searchDocHref(next.q));
      return;
    }
    if (next.q && next.section === "all" && !next.searchPage && !hasSearchDoc(next.q)) {
      location.replace(searchHref(next.q));
      return;
    }
    if (next.searchPage && next.q && !queryFromSearchPath(location.pathname) && hasSearchDoc(next.q)) {
      location.replace(searchDocHref(next.q));
      return;
    }
    if (
      next.q &&
      next.section !== "all" &&
      hasSectionQueryDoc(next.section, next.q) &&
      !queryFromSectionPath(location.pathname)
    ) {
      location.replace(sectionQueryHref(next.section, next.q));
      return;
    }
    if (search) search.value = next.q;
    activeSection = next.section;
    const sortParam = new URLSearchParams(location.search).get("sort");
    if (sortParam === "new" || sortParam === "old" || sortParam === "added-desc" || sortParam === "added-asc") {
      addedSort = parseSort(sortParam);
      persistSort();
    }
    skipScroll = true;
    setPressed();
    liveImmediate = true;
    apply();
  };

  const resetAll = (): void => {
    if (search) search.value = "";
    skipScroll = true;
    if (activeSection !== "all" || isSearchPath(location.pathname)) {
      goToSection("all", "", "push");
      return;
    }
    setSection("all", { scroll: false, url: "push" });
    search?.focus();
  };

  const clearSearch = (): void => {
    if (search) search.value = "";
    if (isSearchPath(location.pathname)) {
      location.assign(`${base}search/`);
      return;
    }
    liveImmediate = true;
    apply();
    writeUrl("push");
    search?.focus();
  };

  for (const button of buttons) {
    button.addEventListener("click", (event) => {
      const id = button.dataset.filter ?? "all";
      if (id === activeSection) {
        event.preventDefault();
        skipScroll = false;
        setSection(id, { url: "push" });
        return;
      }
      button.setAttribute("href", sectionHref(id, ""));
    });
  }

  for (const sortBtn of sortButtons) {
    sortBtn.addEventListener("click", () => {
      const next = parseSort(sortBtn.dataset.sortValue);
      if (!next || next === addedSort) return;
      addedSort = next;
      persistSort();
      apply();
      writeUrl("replace");
    });
  }

  const filterGroup = root.querySelector<HTMLElement>("[data-filters]");
  filterGroup?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    const enabled = buttons.filter(isChipNavigable);
    if (enabled.length === 0) return;
    const current = document.activeElement as HTMLAnchorElement | null;
    const index = current ? enabled.indexOf(current) : -1;
    event.preventDefault();
    let next: HTMLAnchorElement | undefined;
    if (event.key === "Home") next = enabled[0];
    else if (event.key === "End") next = enabled[enabled.length - 1];
    else {
      const from = index < 0 ? 0 : index;
      const delta = event.key === "ArrowRight" ? 1 : -1;
      next = enabled[(from + delta + enabled.length) % enabled.length];
    }
    next?.focus();
    if (next) scrollChipIntoTrack(next);
  });

  for (const button of buttons) {
    button.addEventListener("focus", () => {
      scrollChipIntoTrack(button);
    });
  }

  search?.addEventListener("input", () => {
    liveImmediate = false;
    apply();
    liveImmediate = true;
    const typed = (search?.value ?? "").trim();
    const named = sectionNameQuery(typed);
    if (named) {
      window.clearTimeout(urlTimer);
      urlTimer = window.setTimeout(() => {
        goToSection(named, "", "push");
      }, 400);
      return;
    }
    if (typed && hasSearchDoc(typed) && (activeSection === "all" || isSearchPath(location.pathname))) {
      const dest = searchDocHref(typed);
      const destPath = new URL(dest, location.origin).pathname;
      if (location.pathname !== destPath) {
        window.clearTimeout(urlTimer);
        urlTimer = window.setTimeout(() => {
          location.assign(dest);
        }, 400);
        return;
      }
    }
    if (typed && activeSection !== "all" && hasSectionQueryDoc(activeSection, typed)) {
      const dest = sectionQueryHref(activeSection, typed);
      const destPath = new URL(dest, location.origin).pathname;
      if (location.pathname !== destPath) {
        window.clearTimeout(urlTimer);
        urlTimer = window.setTimeout(() => {
          location.assign(dest);
        }, 400);
        return;
      }
    }
    scheduleTypedUrl();
  });
  search?.addEventListener("search", () => {
    liveImmediate = true;
    apply();
    writeUrl("push");
  });

  root.querySelector("[data-reset]")?.addEventListener("click", resetAll);
  root.querySelector("[data-clear-search]")?.addEventListener("click", clearSearch);

  for (const suggest of root.querySelectorAll<HTMLButtonElement>("[data-suggest]")) {
    suggest.addEventListener("click", () => {
      const sectionHint = suggest.dataset.suggestSection ?? "";
      if (sectionHint && SECTION_IDS.includes(sectionHint as (typeof SECTION_IDS)[number])) {
        goToSection(sectionHint, "", "push");
        return;
      }
      if (search) search.value = suggest.dataset.suggest ?? "";
      skipScroll = true;
      liveImmediate = true;
      if (activeSection !== "all") {
        goToSection("all", search?.value.trim() ?? "", "push");
        return;
      }
      setSection("all", { scroll: false, url: "push" });
      search?.focus();
    });
  }

  let shareTimer = 0;

  share?.addEventListener("click", async () => {
    const titled = sharePaste();
    hideShareFallback();
    window.clearTimeout(shareTimer);
    if (!titled) {
      if (shareStatus) shareStatus.textContent = "此搜索没有可分享的卡片";
      share.setAttribute("aria-label", "此搜索没有可分享的卡片");
      return;
    }
    try {
      await navigator.clipboard.writeText(titled);
      share.textContent = "已复制";
      share.setAttribute("aria-label", "已复制");
      if (shareStatus) shareStatus.textContent = "";
      shareTimer = window.setTimeout(() => resetShareChrome(), 2200);
    } catch {
      if (shareStatus) shareStatus.textContent = "";
      showShareFallback(titled);
      share.textContent = "请手动复制";
      share.setAttribute("aria-label", "剪贴板不可用，请手动全选下面的文本。");
    }
  });

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

  window.addEventListener("popstate", () => {
    applyingHistory = true;
    window.clearTimeout(urlTimer);
    restoreFromLocation();
    applyingHistory = false;
    skipScroll = false;
  });

  const initial = readUrl();
  if (initial.legacySection) {
    goToSection(initial.legacySection, initial.q, "replace");
    return;
  }
  const initialNamed = initial.q ? sectionNameQuery(initial.q) : "";
  if (initialNamed) {
    goToSection(initialNamed, "", "replace");
    return;
  }
  if (initial.q && initial.section === "all" && !initial.searchPage && hasSearchDoc(initial.q)) {
    location.replace(searchDocHref(initial.q));
    return;
  }
  if (initial.q && initial.section === "all" && !initial.searchPage && !hasSearchDoc(initial.q)) {
    location.replace(searchHref(initial.q));
    return;
  }
  if (initial.searchPage && initial.q && !queryFromSearchPath(location.pathname) && hasSearchDoc(initial.q)) {
    location.replace(searchDocHref(initial.q));
    return;
  }
  if (
    initial.q &&
    initial.section !== "all" &&
    hasSectionQueryDoc(initial.section, initial.q) &&
    !queryFromSectionPath(location.pathname)
  ) {
    location.replace(sectionQueryHref(initial.section, initial.q));
    return;
  }
  if (search) search.value = initial.q;
  activeSection = initial.section;
  persistSort();
  setPressed();
  liveImmediate = true;
  apply();
  allowLive = true;
  writeUrl("replace");
  syncToolbarOffset();
  syncPlaceholder();
  syncFilterFade();
  filtersEl?.addEventListener("scroll", syncFilterFade, { passive: true });
  window.addEventListener("resize", () => {
    syncToolbarOffset();
    syncPlaceholder();
    syncFilterFade();
  });
  for (const extra of [...salesExtras, ...opsExtras, ...casesExtras, ...communityExtras, ...caseGroups]) {
    extra.addEventListener("toggle", () => {
      liveImmediate = true;
      apply();
    });
  }
  if (initial.section !== "all" && !isSectionPage) {
    skipScroll = false;
    requestAnimationFrame(() => scrollActiveSection());
  }
  skipScroll = false;
}
