# Battlefield rotation — October 27 update

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

The nine off-world battlefields now support four quarter-turn camera angles in both isometric and tactical views.

- Click **↶ Rotate** / **Rotate ↷**, or press **Q / E** while the map or its controls have focus.
- The compass shows north and the current view, 1–4. The heading and X/Y/Z direction labels follow the camera.
- **Reset** restores view 1, normal zoom, and centered pan. A fresh deployment/retry also restores view 1. Coordinate-label preference is retained.
- Zoom and pan remain available; the pan offset turns with the map. The chosen angle persists through selection, orders, enemy turns, and switching between isometric/tactical view.
- Arrow-key tile navigation follows the displayed ground axes. Coordinates, movement rules, weapon ranges, and action costs continue to use the original map squares.

This is a presentation change. The renderer recalculates the projected positions, front cliff faces, depth order, hidden-unit proxies, sprite-facing choice, movement/effect paths, and enforcement targeting. Props remain upright sprite artwork. No new gameplay actions or camera events enter saved mission replays. The original Roman tutorial remains its flat map.

## Verification

76 tests passed, including quarter-turn projection, height preservation, rectangular-map tile uniqueness, visible neighbor directions, and sprite-facing mapping. The original menu illustrations still match their recorded hashes.

`scripts/check-camera-browser.mjs` verified every one of the 96 squares at all four angles, cliff-face counts, draw order, enforcer target alignment, keyboard navigation, path-preview retention, pan/zoom/reset, retry, tactical view, phone layout, and normal-motion movement. It then completed Glassfire Foundry while rotating between rounds: success in 8 rounds / 54 actions, with an exact saved gameplay replay. 428 mouse selections and one keyboard fallback; no browser errors or failed assets. No fabricated human playtest record was saved.

[Browser report](../reports/checks/camera-browser-check.json) · [Four-angle preview](../screenshots/camera-four-angles.png) · [Phone controls](../screenshots/camera-mobile.png)

Run `node --test` for the rules/art/API suite. With Playwright exposed through `PLAYWRIGHT_MODULE`, run `node scripts/check-camera-browser.mjs` for camera integration checks. It closes its temporary test server; the regular playtest server stays stopped.
