// Marks a PR file as "Viewed" once you've scrolled past the end of its diff.
// Rules:
//  - A file only counts if part of it was on screen at some point, so jumping
//    through the file tree doesn't mark everything you skipped over.
//  - It never un-ticks anything.
//  - If you un-tick a file by hand, it leaves that file alone from then on.

const TOP_OFFSET = 120; // sticky PR header + sticky file header, in px

const seen = new WeakSet();     // containers that have been visible on screen
const optedOut = new WeakSet(); // containers the user manually un-viewed
const containerCache = new WeakMap();

function isPrFilesPage() {
  return /\/pull\/\d+\/(files|changes)/.test(location.pathname);
}

// Classic UI: <input class="js-reviewed-checkbox">. New React UI: a toggle button labelled "Viewed".
function isToggle(el) {
  if (el.matches('input.js-reviewed-checkbox')) return true;
  return el.matches('button[aria-pressed]') && el.textContent.trim() === 'Viewed';
}

function findToggles(root = document) {
  return [...root.querySelectorAll('input.js-reviewed-checkbox, button[aria-pressed]')].filter(isToggle);
}

function isViewed(toggle) {
  return toggle.tagName === 'INPUT' ? toggle.checked : toggle.getAttribute('aria-pressed') === 'true';
}

// The file's diff container: a known wrapper if there is one, otherwise the
// largest ancestor that holds only this one toggle.
function fileContainer(toggle) {
  if (containerCache.has(toggle)) return containerCache.get(toggle);
  let el = toggle.closest('.file, [data-tagsearch-path]');
  if (!el) {
    el = toggle;
    while (el.parentElement && el.parentElement !== document.body && findToggles(el.parentElement).length === 1) {
      el = el.parentElement;
    }
  }
  containerCache.set(toggle, el);
  return el;
}

function check() {
  if (!isPrFilesPage()) return;
  const viewportBottom = window.innerHeight;
  for (const toggle of findToggles()) {
    const container = fileContainer(toggle);
    const rect = container.getBoundingClientRect();
    if (rect.height === 0) continue;

    if (rect.bottom > TOP_OFFSET && rect.top < viewportBottom) seen.add(container);

    const scrolledPast = rect.bottom <= TOP_OFFSET;
    if (scrolledPast && seen.has(container) && !optedOut.has(container) && !isViewed(toggle)) {
      toggle.click();
    }
  }
}

let scheduled = false;
window.addEventListener('scroll', () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    check();
  });
}, { passive: true });

// Remember files the user un-views by hand (real clicks only; ours are untrusted).
// Classic checkbox: its state has already flipped by the time "change" fires.
document.addEventListener('change', (e) => {
  if (e.isTrusted && e.target.matches('input.js-reviewed-checkbox') && !e.target.checked) {
    optedOut.add(fileContainer(e.target));
  }
}, true);
// React button: aria-pressed hasn't flipped yet when the click is captured.
document.addEventListener('click', (e) => {
  if (!e.isTrusted) return;
  const button = e.target.closest('button[aria-pressed]');
  if (button && isToggle(button) && isViewed(button)) optedOut.add(fileContainer(button));
}, true);

check();
