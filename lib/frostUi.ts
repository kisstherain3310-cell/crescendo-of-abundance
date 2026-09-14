const FROST_UI_SELECTOR = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[data-frost-ui]",
  "[role='dialog']",
  "[role='alertdialog']",
].join(",");

export function isFrostUiTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(FROST_UI_SELECTOR));
}

export function isFrostSkipTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("#frost-skip, #frost-boot-skip"));
}
