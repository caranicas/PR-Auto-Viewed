# PR Auto Viewed

A Chrome extension that ticks the **Viewed** checkbox on a GitHub pull request file once you've scrolled past it.

Works on both the classic `Files changed` page (`/pull/N/files`) and the newer one (`/pull/N/changes`).

## Behavior

- A file is marked Viewed when the bottom of its diff scrolls up past the sticky header.
- Only files that were actually on screen count, so jumping through the file tree doesn't mark everything you skipped.
- It never un-ticks anything.
- If you un-tick a file yourself, it leaves that file alone for the rest of the page visit.

## Install

1. Clone this repo.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the repo folder.
4. Refresh any open PR tabs.

## Tuning

`TOP_OFFSET` at the top of `content.js` (default `120`) sets how far from the top of the window a file's diff has to end before it counts as scrolled past.
