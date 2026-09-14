const FROST_UI_SELECTOR = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[data-frost-ui]",
  "[data-frost-chrome]",
  "[role='dialog']",
  "[role='alertdialog']",
].join(",");

function asElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

export function isFrostUiTarget(target: EventTarget | null) {
  const el = asElement(target);
  if (!el) return false;
  return Boolean(el.closest(FROST_UI_SELECTOR));
}

export function isFrostSkipTarget(target: EventTarget | null) {
  const el = asElement(target);
  if (!el) return false;
  return Boolean(el.closest("#frost-skip, #frost-boot-skip"));
}

export function isFrostSkipKey(event: KeyboardEvent) {
  return (
    event.key === "Escape" ||
    event.key === "Enter" ||
    event.key === " " ||
    event.key === "Spacebar" ||
    event.code === "Space"
  );
}

export function isTypingTarget(target: EventTarget | null) {
  const el =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  if (!el) return false;
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    return true;
  }
  return Boolean(el.closest("input, textarea, select, [contenteditable='true']"));
}
