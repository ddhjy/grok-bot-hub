function normalize(value: string): string {
  return value.toLocaleLowerCase("zh-CN").trim();
}

export function initDirectory(): void {
  const root = document.querySelector<HTMLElement>("[data-directory]");
  if (!root) return;

  const search = root.querySelector<HTMLInputElement>("[data-search]");
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-filter]")];
  const cards = [...root.querySelectorAll<HTMLElement>("[data-card]")];
  const blocks = [...root.querySelectorAll<HTMLElement>("[data-section-block]")];
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  const resultCount = root.querySelector<HTMLElement>("[data-result-count]");

  let activeSection = "all";

  const apply = () => {
    const query = normalize(search?.value ?? "");
    let visible = 0;
    const visibleBySection = new Map<string, number>();

    for (const card of cards) {
      const section = card.dataset.section ?? "";
      const haystack = card.dataset.search ?? "";
      const sectionOk = activeSection === "all" || section === activeSection;
      const queryOk = query.length === 0 || haystack.includes(query);
      const show = sectionOk && queryOk;
      card.hidden = !show;
      if (show) {
        visible += 1;
        visibleBySection.set(section, (visibleBySection.get(section) ?? 0) + 1);
      }
    }

    for (const block of blocks) {
      const id = block.dataset.sectionBlock ?? "";
      const count = visibleBySection.get(id) ?? 0;
      block.hidden = count === 0;
      const countEl = block.querySelector("[data-section-visible]");
      if (countEl) countEl.textContent = String(count);
    }

    if (empty) empty.classList.toggle("is-visible", visible === 0);
    if (resultCount) {
      resultCount.textContent = query || activeSection !== "all" ? `当前显示 ${visible} 条` : `共 ${cards.length} 条`;
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      activeSection = button.dataset.filter ?? "all";
      for (const item of buttons) {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      }
      apply();
    });
  }

  search?.addEventListener("input", apply);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return;
    }
    event.preventDefault();
    search?.focus();
  });

  apply();
}
