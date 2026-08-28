import { isActiveQuery, matchesQuery, normalizeQuery } from "../lib/query";

type HistoryMode = "replace" | "push";

export function initDirectory(): void {
  const root = document.querySelector<HTMLElement>("[data-directory]");
  if (!root) return;

  const base = root.dataset.base || "/grok-bot-hub/";
  const search = root.querySelector<HTMLInputElement>("[data-search]");
  const searchWrap = root.querySelector<HTMLElement>(".search");
  const buttons = [...root.querySelectorAll<HTMLAnchorElement>("[data-filter]")];
  const cards = [...root.querySelectorAll<HTMLElement>("[data-card]")];
  const isSearchPage = root.dataset.searchPage === "true";
  const documentedQueries = new Set(
    (root.dataset.searchDocs ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  const emptyTitle = root.querySelector<HTMLElement>("[data-empty-title]");
  const emptyCopy = root.querySelector<HTMLElement>("[data-empty-copy]");
  const resultCount = root.querySelector<HTMLElement>("[data-result-count]");
  const resultLive = root.querySelector<HTMLElement>("[data-result-live]");
  const toolbar = root.querySelector<HTMLElement>(".toolbar");
  const share = root.querySelector<HTMLButtonElement>("[data-share]");
  const shareStatus = root.querySelector<HTMLElement>("[data-share-status]");
  const shareFallback = root.querySelector<HTMLElement>("[data-share-fallback]");
  const shareText = root.querySelector<HTMLTextAreaElement>("[data-share-text]");

  const catalogTitle = "Grok Bot 目录";
  const defaultCountLabel = `共 ${cards.length} 条`;
  const shareIdleLabel = share?.textContent ?? "复制链接";
  const placeholderLong = search?.dataset.placeholderLong ?? "搜索标题";
  const placeholderShort = search?.dataset.placeholderShort ?? "搜索目录";
  const placeholderCompact = search?.dataset.placeholderCompact ?? "搜索";

  let activeTag = "";
  let urlTimer = 0;
  let liveTimer = 0;
  let applyingHistory = false;
  let liveImmediate = true;
  let allowLive = false;

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

  const isSearchPath = (pathname: string): boolean => pathSegments(pathname)[0] === "search";

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

  const searchDocHref = (q: string): string => {
    return `${base}search/${encodeURIComponent(canonicalShareQuery(q))}/`;
  };

  const homeHref = (tag = "", q = ""): string => {
    const url = new URL(base, location.origin);
    if (tag) url.searchParams.set("tag", tag);
    if (q) url.searchParams.set("q", q);
    return `${url.pathname}${url.search}`;
  };

  const searchHref = (q: string): string => {
    if (q && hasSearchDoc(q)) return searchDocHref(q);
    const url = new URL(`${base}search/`, location.origin);
    if (q) url.searchParams.set("q", q);
    return `${url.pathname}${url.search}`;
  };

  const activeQuery = (): string => {
    const q = (search?.value ?? "").trim();
    return isActiveQuery(normalizeQuery(q)) ? q : "";
  };

  const tagHref = (tag: string): string => homeHref(tag, "");

  const readUrl = (): { tag: string; q: string; searchPage: boolean } => {
    const params = new URLSearchParams(location.search);
    const searchPage = isSearchPath(location.pathname);
    const pathQuery = queryFromSearchPath(location.pathname);
    const q = pathQuery || (params.get("q") ?? "");
    const tag = searchPage ? "" : (params.get("tag") ?? "");
    return { tag, q, searchPage };
  };

  const buildPath = (): string => {
    const q = activeQuery();
    if (isSearchPath(location.pathname)) {
      const pathQ = queryFromSearchPath(location.pathname);
      if (q && pathQ && canonicalShareQuery(q) === canonicalShareQuery(pathQ)) return location.pathname;
      if (!q) return `${base}search/`;
      return searchHref(q);
    }
    if (q) return searchHref(q);
    return homeHref(activeTag);
  };

  const shareUrl = (): string | null => {
    const q = activeQuery();
    if (q) {
      if (hasSearchDoc(q)) return `${location.origin}${searchDocHref(q)}`;
      return null;
    }
    if (isSearchPath(location.pathname)) return `${location.origin}${base}search/`;
    return `${location.origin}${homeHref(activeTag)}`;
  };

  const writeUrl = (mode: HistoryMode): void => {
    if (applyingHistory) return;
    const next = buildPath();
    if (next === `${location.pathname}${location.search}` && !location.hash) return;
    const dest = new URL(next, location.origin);
    dest.hash = "";
    const state = { tag: activeTag, q: (search?.value ?? "").trim() };
    if (mode === "push") history.pushState(state, "", dest.href);
    else history.replaceState(state, "", dest.href);
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

  const syncToolbarOffset = (): void => {
    if (!toolbar) return;
    document.documentElement.style.setProperty(
      "--toolbar",
      `${Math.ceil(toolbar.getBoundingClientRect().height)}px`,
    );
  };

  const syncPlaceholder = (): void => {
    if (!search) return;
    const width = window.innerWidth;
    if (width < 520) search.placeholder = placeholderCompact;
    else if (width < 1280) search.placeholder = placeholderShort;
    else search.placeholder = placeholderLong;
  };

  const setPressed = (): void => {
    for (const button of buttons) {
      const id = button.dataset.filter ?? "";
      button.setAttribute("aria-pressed", id === activeTag ? "true" : "false");
    }
  };

  const cardHasTag = (card: HTMLElement, tag: string): boolean => {
    if (!tag) return true;
    return (card.dataset.tags ?? "").split("\t").includes(tag);
  };

  const shareTitle = (): string => {
    const q = activeQuery();
    if (q) return hasSearchDoc(q) ? `「${q}」的搜索 · ${catalogTitle}` : catalogTitle;
    if (activeTag) return `${activeTag} · ${catalogTitle}`;
    if (isSearchPath(location.pathname)) return `搜索 · ${catalogTitle}`;
    return catalogTitle;
  };

  const sharePaste = (): string | null => {
    const url = shareUrl();
    if (!url) return null;
    return `${shareTitle()}\n${url}`;
  };

  const idleShareName = (): string => {
    if (shareUrl() === null) return "此搜索没有可分享的卡片";
    const q = activeQuery();
    if (q && hasSearchDoc(q)) return `复制「${q}」搜索页的标题和链接`;
    if (activeTag) return `复制「${activeTag}」的标题和链接`;
    return "复制标题和链接";
  };

  const syncShareAvailability = (): void => {
    if (!share) return;
    const ok = shareUrl() !== null;
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
      document.title = `「${q}」的搜索 · ${catalogTitle}`;
      return;
    }
    document.title = shareTitle();
  };

  const apply = (): void => {
    const rawQuery = search?.value.trim() ?? "";
    const query = isActiveQuery(normalizeQuery(rawQuery)) ? normalizeQuery(rawQuery) : "";
    let visible = 0;

    hideShareFallback();
    if (share?.textContent === "请手动复制") resetShareChrome();
    searchWrap?.classList.toggle("has-query", Boolean(rawQuery));

    for (const card of cards) {
      const primary = card.dataset.search ?? "";
      const blurb = card.dataset.searchBlurb ?? "";
      const urlField = card.dataset.searchUrl ?? "";
      const section = card.dataset.section ?? "";
      const queryOk =
        !query || matchesQuery(primary, blurb, query, { url: urlField, section });
      const show = !(isSearchPage && !query) && queryOk && cardHasTag(card, activeTag);
      card.hidden = !show;
      if (show) visible += 1;
    }

    root.classList.toggle("is-searching", Boolean(query));

    const isEmpty = visible === 0;
    if (empty) empty.hidden = !isEmpty;
    if (isEmpty) {
      const emptySearch = isSearchPath(location.pathname) && !query;
      if (emptyTitle) {
        emptyTitle.textContent = query
          ? "没有匹配的条目"
          : emptySearch
            ? "输入关键词"
            : activeTag
              ? "这个标签是空的"
              : "没有匹配的条目";
      }
      if (emptyCopy) {
        if (query && activeTag) {
          emptyCopy.textContent = `「${rawQuery}」在「${activeTag}」里没有结果。`;
        } else if (query) {
          emptyCopy.textContent = `「${rawQuery}」没有匹配的条目。`;
        } else if (emptySearch) {
          emptyCopy.textContent = "在目录里搜标题、别名和标签。";
        } else if (activeTag) {
          emptyCopy.textContent = `「${activeTag}」里暂时没有条目。`;
        } else {
          emptyCopy.textContent = "换个词试试，或清空筛选。";
        }
      }
    }

    const countText =
      isSearchPath(location.pathname) && !query
        ? "输入关键词开始搜索"
        : query || activeTag
          ? `当前显示 ${visible} 条`
          : defaultCountLabel;
    if (resultCount) resultCount.textContent = countText;
    announceCount(countText, liveImmediate);

    if (share && share.textContent === shareIdleLabel) {
      share.setAttribute("aria-label", idleShareName());
    }
    syncShareAvailability();
    updateDocumentTitle(rawQuery);
    syncToolbarOffset();
    syncPlaceholder();
    setPressed();
  };

  const setTag = (tag: string, mode: HistoryMode = "push"): void => {
    activeTag = tag;
    liveImmediate = true;
    apply();
    writeUrl(mode);
  };

  const restoreFromLocation = (): void => {
    const next = readUrl();
    if (next.q && !next.searchPage && hasSearchDoc(next.q)) {
      location.replace(searchDocHref(next.q));
      return;
    }
    if (next.q && !next.searchPage && !hasSearchDoc(next.q)) {
      location.replace(searchHref(next.q));
      return;
    }
    if (next.searchPage && next.q && !queryFromSearchPath(location.pathname) && hasSearchDoc(next.q)) {
      location.replace(searchDocHref(next.q));
      return;
    }
    if (search) search.value = next.q;
    activeTag = next.tag;
    liveImmediate = true;
    apply();
  };

  const resetAll = (): void => {
    if (search) search.value = "";
    if (isSearchPath(location.pathname)) {
      location.assign(base);
      return;
    }
    activeTag = "";
    liveImmediate = true;
    apply();
    writeUrl("push");
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
      event.preventDefault();
      setTag(button.dataset.filter ?? "", "push");
    });
  }

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const chip = target.closest<HTMLElement>("[data-tag]");
    if (!chip || !root.contains(chip)) return;
    event.preventDefault();
    event.stopPropagation();
    setTag(chip.dataset.tag ?? "", "push");
  });

  search?.addEventListener("input", () => {
    liveImmediate = false;
    apply();
    liveImmediate = true;
    const typed = (search?.value ?? "").trim();
    if (typed && hasSearchDoc(typed)) {
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
    scheduleTypedUrl();
  });
  search?.addEventListener("search", () => {
    liveImmediate = true;
    apply();
    writeUrl("push");
  });

  root.querySelector("[data-reset]")?.addEventListener("click", resetAll);
  root.querySelector("[data-clear-search]")?.addEventListener("click", clearSearch);

  for (const suggest of root.querySelectorAll<HTMLButtonElement>("[data-suggest-tag]")) {
    suggest.addEventListener("click", () => {
      if (search) search.value = "";
      if (isSearchPath(location.pathname)) {
        location.assign(tagHref(suggest.dataset.suggestTag ?? ""));
        return;
      }
      setTag(suggest.dataset.suggestTag ?? "", "push");
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
      if (search && search.value) {
        event.preventDefault();
        clearSearch();
        return;
      }
      if (activeTag) {
        event.preventDefault();
        setTag("", "push");
        return;
      }
      if (event.target === search) search?.blur();
      return;
    }
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
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
  });

  const initial = readUrl();
  if (initial.q && !initial.searchPage && hasSearchDoc(initial.q)) {
    location.replace(searchDocHref(initial.q));
    return;
  }
  if (initial.q && !initial.searchPage && !hasSearchDoc(initial.q)) {
    location.replace(searchHref(initial.q));
    return;
  }
  if (search) search.value = initial.q;
  activeTag = initial.tag;
  liveImmediate = true;
  apply();
  allowLive = true;
  writeUrl("replace");
  syncToolbarOffset();
  syncPlaceholder();
  window.addEventListener("resize", () => {
    syncToolbarOffset();
    syncPlaceholder();
  });
}
