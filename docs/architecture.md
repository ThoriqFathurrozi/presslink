# Architecture

[Back to README](../README.md) · [Adapters](adapters.md) · [Development](development.md)

## Source map

```text
presslink-meta.user.js           Userscript metadata template
src/
  main.js                       Bootstrap and engine instance replacement
  config/constants.js           Defaults, DOM markers, window/event keys
  adapters/
    BaseAdapter.js              Default adapter contract
    registry.js                 Ordered active adapter list and resolution
    utils.js                    Shared site and article helpers
    medium.js, nyt.js, wapos.js  Publisher implementations
    bloomberg.js, reuters.js    Publisher implementations
    economist.js                Unregistered draft
    example.js                  Unregistered extension example
  actions/
    registry.js                 Ordered enabled actions
    actions/                    Copy URL, Open URL, Open FREE
  core/
    PageBreakdownEngine.js      Lifecycle, card/page processing, action execution
    Scanner.js                  Serialized delayed scan scheduling
    DomObserver.js              DOM change subscription
    NavigationObserver.js      History API patch and navigation events
    utils.js                    URL, DOM, hash, style, and logging helpers
  ui/
    createLauncher.js           Styled launcher button
    createPopup.js              Menu positioning, focus, and dismissal
    createActionItem.js         Action button and pending execution state
scripts/build.js                esbuild browser bundle and watch mode
scripts/test.js                 Test discovery, bundling, and Node test runner
tests/                          Adapter, core, and UI fixture tests
presslink.user.js                Generated installable bundle
```

The browser bundle is an unminified ES2020-targeted IIFE. Source modules use ES module syntax, while build/test scripts use CommonJS. There is no framework, stylesheet pipeline, application backend, or production npm runtime dependency.

## Startup

1. The userscript manager applies the metadata match rules and runs the bundle at `document-end` in a top-level page.
2. `src/main.js` creates a logger and resolves the first matching adapter in registry order: NYT, Medium, Washington Post, Bloomberg, Reuters. A failing `match()` is logged and resolution continues. No match ends startup.
3. Any previous engine stored at `window.__PAGE_BREAKDOWN_ENGINE__` is destroyed.
4. A new engine receives the selected adapter, active actions, popup configuration, and scan delay. The instance is stored on that window key.
5. `start()` installs page lifecycle, DOM, and navigation listeners and awaits an immediate scan. If startup throws, bootstrap logs the error, destroys the engine, and removes its window reference if still current.

Adapter resolution happens once per bootstrap. Navigation rescans with the same adapter rather than resolving a new one.

## Scanning and identity

The scan path is `pruneInjectedUi()` → optional `onBeforeProcess()` → `processCards()` → `processPage()` → optional `onAfterProcess()`. Errors in hooks, individual cards, and page processing are logged so other work can continue where possible.

`Scanner` keeps the first scheduled deadline. More mutations before that deadline do not continually postpone scanning. Scans never overlap: a request while a scan is running sets one pending follow-up, scheduled after completion. Destroying the scanner clears its timer and pending work.

Card processing converts adapter results to an array and deduplicates by DOM element identity with a `Set`. For each connected element it awaits eligibility, obtains and normalizes its URL, and checks its previous record. An unchanged URL with a connected launcher still inside the card retains that launcher. A changed URL, removed launcher, or ineligible card causes the old record and button to be removed. Eligible cards receive a button at the adapter's mount point.

State lives in a `Map<Element, { url, launcher }>` and a `Set` of injected launchers. It is not a global URL cache: two different cards linking to the same article may each receive a launcher. Detached cards and launchers are pruned on later scans.

Page processing requires `isDetailPage()`, no existing page launcher marker, a true `shouldProcessPage()`, and a connected page mount. Its action URL comes from `window.location.href`. An existing connected page launcher is skipped rather than having eligibility rechecked on every scan; navigation resets it.

Every scan captures a generation number. UI resets increment this number, and checks after awaited adapter operations prevent a stale scan from inserting buttons after navigation or destruction. This invalidates later engine work; it does not abort promises or undo side effects within adapter hooks.

## DOM and navigation observation

`DomObserver` watches `document.documentElement` (or `document`) for subtree child additions/removals and attributes named `href` or `aria-label`. It does not observe character data, arbitrary attributes, or shadow roots. Presslink's own DOM insertions can schedule a later scan, but its dataset markers are not in the attribute filter.

`NavigationObserver` wraps `history.pushState` and `history.replaceState` once, guarded by `window.__PAGE_BREAKDOWN_HISTORY_PATCHED__`. Each wrapper calls the original method, then dispatches `userscript:navigation` with `{ url: window.location.href }`. A `popstate` event also dispatches that custom event.

On navigation, the engine closes its popup, resets injected launchers and card markers, increments the generation, and schedules a scan. There is no URL-change equality check: even a `replaceState` call that keeps the URL causes a reset. There is no dedicated `hashchange` listener.

## Actions and UI

Each launcher captures an action context:

| Field | Meaning |
| --- | --- |
| `url` | URL normalized by the adapter, or resolved by the engine fallback |
| `element` | The original card for a card launcher; the mount element for a page launcher |
| `pageType` | `'card'` or `'page'` |
| `adapter` | The selected adapter instance |

The engine filters actions with `enabled !== false` both during bootstrap registry lookup and when opening a menu. All remaining actions are offered for all contexts; there is no per-site action filter.

`execute(context)` takes precedence over `buildUrl(context)`. The former is awaited; the latter must synchronously return a destination for `window.open`. Failures are logged and return false. A successful old asynchronous action cannot close a different menu opened while it was pending.

The popup is mounted under the body (or document element), positioned with fixed coordinates near the anchor, and repositioned on resize and captured scroll events. It uses a 12-pixel viewport gutter. Focus movement and dismissal are described in the [user guide](usage.md). Component styling uses inline CSS; it has no shadow DOM isolation from publisher styles.

## Cleanup

`destroy()` is idempotent. It stops observers and the scanner, removes the pagehide listener, closes the popup, removes tracked launchers and processed markers, and invalidates in-flight scans. An optional adapter `cleanup()` runs asynchronously; its failure is logged and destruction does not wait for it.

`pagehide` destroys the engine only when `event.persisted` is false, preserving it when the page enters the back/forward cache. A destroyed instance cannot be restarted with `start()`; create a new instance or reload.

Cleanup does not restore the wrapped History API methods, clear the history patch flag, or revert `position: relative` styles applied to publisher mount elements. Manual `destroy()` also leaves the window's engine reference in place; bootstrap replacement and startup failure handle that reference separately.

## Debugging reference

In a browser console that can access the script's page window:

```js
const engine = window.__PAGE_BREAKDOWN_ENGINE__;
engine?.adapter.name;
engine?.processedCards.size;
engine?.scheduleScan(); // Request a delayed rescan.
// engine?.destroy();  // Stop this instance until replacement or reload.
```

| Marker or key | Purpose |
| --- | --- |
| `data-page-breakdown-processed` | Marker on a processed card |
| `data-page-breakdown-launcher` | Marker on every launcher |
| `data-page-breakdown-page-launcher` | Additional marker on the detail-page launcher |
| `data-page-breakdown-placement` | Launcher placement value |
| `data-page-breakdown-popup` | Popup marker |
| `data-page-breakdown-action` | Action key on a menu item |
| `[PageBreakdown]` | Logger prefix; debug output is controlled by `CONFIG.debug` |

These names retain the internal PageBreakdown terminology even though the visible product is Presslink.
