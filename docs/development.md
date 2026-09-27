# Development guide

[Back to README](../README.md) · [Architecture](architecture.md) · [Adapter reference](adapters.md)

## Local workflow

Run commands from the project root:

```sh
npm ci
npm test
npm run build
```

`package-lock.json` pins the dependency tree for `npm ci`. esbuild is the only direct development dependency; the package has no runtime dependencies. The project does not specify a Node.js engine range. esbuild declares Node.js 18 or newer, and the documentation checks used Node.js 26.8.1 with npm 11.19.0. There is no checked-in CI configuration, lint script, formatter script, or browser automation suite.

For continuous builds:

```sh
npm run dev
```

Stop with Ctrl+C. After a rebuild, replace the installed userscript with the generated file and reload the page. Watch mode does not install or hot-reload the userscript in your browser.

## Build behavior

[`scripts/build.js`](../scripts/build.js) reads only the `// ==UserScript==` through `// ==/UserScript==` block from the root metadata template. It prepends that block to the bundle and fails if no block exists.

| Option | Value |
| --- | --- |
| Entry point | `src/main.js` |
| Output | `dist/page-breakdown.user.js` |
| Platform / format | Browser / IIFE |
| Target | ES2020 |
| Minification | Disabled |
| Character set | UTF-8 |
| Legal comments | Removed from bundled modules; userscript metadata is supplied as a banner |
| Source maps | Not configured for the browser bundle |

The build creates `dist/` if needed and removes the legacy `dist/pressora.user.js` output if present. Do not treat that old filename as the install target. Edit source files and rebuild rather than editing generated code.

Metadata is read once before the esbuild watch context starts. Restart `npm run dev` after modifying the template. The ES2020 target is a bundle syntax target, not a guarantee that every DOM API works in every browser.

## Configuration

Edit [`src/config/constants.js`](../src/config/constants.js), rebuild, and reinstall:

| Setting | Default | Effect |
| --- | --- | --- |
| `CONFIG.debug` | `false` | Enables debug console messages; warnings/errors are always emitted |
| `CONFIG.scanDelay` | `150` | Delay in milliseconds for scheduled scans; startup scan is immediate |
| `CONFIG.launcherLabel` | `'Pressora'` | Default launcher text; adapters can override it |
| `CONFIG.popup.closeOnOutside` | `true` | Set to `false` to disable outside-click dismissal |

`CONFIG` and its nested popup configuration are frozen. Change their source declarations rather than trying to mutate the exported objects at runtime. There are no environment variables or persistent settings to configure.

The engine constructor also accepts `adapter`, `actions`, `scanDelay`, `launcherLabel`, `popup`, and `logger`, plus injectable `createLauncher`, `createPopup`, and `createActionItem` factories. The existing tests use factory injection to exercise engine behavior with a small DOM fixture.

## Actions

Actions live under `src/actions/actions/` and are imported into the ordered array in [`src/actions/registry.js`](../src/actions/registry.js). Set an action's `enabled` property to `false`, or remove it from that array, to omit it. Any value other than literal `false` passes the enabled filter.

| Field | Purpose |
| --- | --- |
| `key` | Unique identifier used in DOM markers and logs |
| `name` | Visible menu text; falls back to `key` |
| `enabled` | Optional enable flag |
| `execute(context)` | Optional synchronous or asynchronous operation |
| `buildUrl(context)` | Optional synchronous URL builder for a new tab |

The context contains `url`, `element`, `pageType`, and `adapter`; see [architecture](architecture.md). If both functions exist, `execute` wins. Return a falsy destination from `buildUrl` to report no action. For `execute`, completion without throwing is considered success regardless of its return value; throw to signal a failure. All enabled actions appear on all sites, so validate any site-specific assumptions within your implementation.

For example, add `src/actions/actions/copyTitle.js`:

```js
const CopyTitleAction = {
    key: 'COPY_TITLE',
    name: 'Copy title',
    enabled: true,

    async execute({ element }) {
        const title = element.querySelector('h1, h2, h3')?.textContent.trim();
        if (!title) throw new Error('No article heading found in this context');
        if (!navigator.clipboard?.writeText) {
            throw new Error('Clipboard API is unavailable');
        }
        await navigator.clipboard.writeText(title);
    }
};

export default CopyTitleAction;
```

Then import `CopyTitleAction` in `src/actions/registry.js` and append it to `ACTIONS`. This example copies a heading inside the context element; publisher-specific heading placement can require different extraction. It deliberately surfaces missing content/API access through the engine's existing error handling. The built-in Copy URL action also implements a legacy clipboard fallback.

For a URL action, return a valid URL synchronously from `buildUrl`. The engine opens it with `_blank` and `noopener,noreferrer` and nulls the opener when a window reference is available. The engine does not await URL builders or validate their returned scheme. It also cannot reliably confirm a tab opened: a null return from `window.open` is still treated as success.

## Launcher styling

Override `getLauncherOptions(context)` on an adapter. The supported keys are `label`, `title`, `className`, `placement`, `style`, `styleName`, `styles`, `hoverStyle`, `hoverStyleName`, and `hoverStyles`.

```js
getLauncherOptions({ pageType }) {
    return {
        label: 'Pressora',
        className: `pressora-custom-launcher--${pageType}`,
        style: {
            name: pageType,
            right: '12px',
            borderRadius: '8px',
            zIndex: 500
        },
        hoverStyle: { background: '#1d4ed8' }
    };
}
```

Built-in style names are `default`, `card`, and `page`. Registered adapters select `card` or `page`; the default preset alone uses the base dark style. `placement` defaults to the context page type and affects the default margin and dataset value. It does not automatically change absolute positioning into an in-flow layout.

`style` and `hoverStyle` may be preset-name strings, plain CSS-property objects, or configuration objects. Normal style resolution merges these layers from lowest to highest precedence after the component's base style:

1. Built-in `default`, outer `styles.default`, and `config.styles.default`.
2. `config.default` and `config.defaults`.
3. Built-in selected preset, outer `styles[name]`, `config.styles[name]`, and `config[name]`.
4. `config.style`, direct scalar CSS properties on the config object, and `config.overrides`.

The selected name comes from a string config, then `config.name` or `config.styleName`, then the outer `styleName` (or `default`). Hover resolution uses the corresponding hover keys and falls back to the active normal style name. Hover base effects include a small upward translation and stronger shadow.

CSS properties accept camelCase, kebab-case, or custom property names. Values become strings: use units such as `'12px'` for lengths. Null, undefined, and empty-string values remove a property. Mouse leave restores the base style and removes hover-only properties. The popup and action item styles are defined separately in their UI modules.

## Automated tests

```sh
npm test
npm test -- tests/adapters
npm test -- tests/core/scanner.test.js
npm test -- tests/adapters tests/ui
npm test -- tests/ui --test-name-pattern=Escape
```

[`scripts/test.js`](../scripts/test.js) recursively discovers sorted `*.test.js` files below `tests/`. Each file or directory selection must contain a discovered test. With no selections, it runs all tests. Node test flags are forwarded; use `--flag=value` for options with values because separate value arguments are interpreted as file selections.

The runner bundles selected tests into CommonJS files in a temporary `pressora-tests-*` directory using esbuild, embeds source maps, then invokes the current Node executable with `--enable-source-maps --test`. It forwards the test exit status and removes temporary files in a `finally` block.

| Area | Coverage |
| --- | --- |
| `tests/adapters/shared.test.js` | Domain/metadata matching, launcher options, normalization, mount styles |
| `tests/adapters/news.test.js` | News path exclusions, link order, page eligibility, card discovery, article identity |
| Publisher-specific adapter tests | Medium link ranking and page mount, NYT always-free exclusion, example defaults |
| `tests/adapters/registry.test.js` | Metadata domains resolve to an implemented adapter |
| `tests/core/engine.test.js` | Deduplication, reused/detached cards, stale scan cancellation, asynchronous action/menu races |
| `tests/core/scanner.test.js` | Scan deadlines and serialized follow-ups |
| `tests/core/dom-observer.test.js` | Mutation observer options |
| `tests/ui/popup.test.js` | Keyboard navigation, disabled items, Escape, Tab, outside-click focus |

At documentation verification, all 73 tests passed. This is a snapshot, not a required fixed count for future changes.

The DOM fixture is hand-written rather than a browser implementation. These tests do not establish live publisher selector accuracy, visual layout, clipboard behavior, actual new-tab behavior, a full accessibility audit, or userscript manager compatibility.

### Writing tests

Put a `*.test.js` file under the matching source area. Keep shared news expectations in `news.test.js`, cross-site expectations in `shared.test.js`, and publisher fixtures in `tests/helpers/adapters.js`. Publisher-only behavior belongs in a dedicated test file.

Available helpers are `ElementFixture`, `setupDom`, `cleanupDom`, and `registerCleanup` in `tests/helpers/dom.js`; `setupEngine` in `tests/helpers/engine.js`; and `deferred` in `tests/helpers/async.js`. Register timers, listeners, and engines for cleanup so failed assertions do not leak resources.

```js
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../helpers/dom.js';
import { setupEngine } from '../helpers/engine.js';

beforeEach(setupDom);
afterEach(cleanupDom);

test('an ineligible card has no launcher', async () => {
    const { engine, card } = setupEngine();
    card.eligible = false;
    await engine.scan();
    assert.equal(engine.injectedLaunchers.size, 0);
});
```

This example belongs under `tests/core/`. Keep tests that share these browser-global fixtures serial within each file; separate files run in isolated processes by default. The fixture implements only the DOM behavior required by existing tests, so extend it deliberately when new behavior needs coverage.

## Manual browser checks

After changes affecting publishers or interaction, install the rebuilt bundle and check:

1. An index/feed with eligible and ineligible cards; verify selected URLs match the intended stories.
2. An article detail page and its recommendations; verify the current story does not become its own recommendation action.
3. Infinite scroll, card replacement, and reused link elements; check there are no duplicate buttons on one card or stale URLs.
4. In-page navigation and back/forward navigation; verify menus close and launchers refresh.
5. Copy URL, Open URL, and the constructed external reader destination. Check failure behavior without assuming external article availability.
6. Keyboard menu navigation, Escape, Tab/Shift+Tab, outside clicks, scrolling, resizing, and narrow viewports.
7. Publisher overlays and sticky headers; ensure button stacking and mount styles do not obstruct important controls.
8. Debug console output for repeated scan failures or adapter exceptions.

## Preparing a release

1. Update docs for changed behavior, sites, actions, and limitations.
2. Update the root userscript `@version`. Review the package version separately: the build does not synchronize `1.2` in metadata with `0.1.0` in `package.json`.
3. Review `@match`, `@namespace`, homepage, update, and download metadata, especially for forks.
4. Run `npm test` and `npm run build`, then complete the relevant manual browser checks.
5. Confirm the generated file begins with the expected metadata and contains the application bundle. Distribute `dist/page-breakdown.user.js`.

This repository has no publish command; building does not upload to OpenUserJS or any other service. The metadata declares MIT, but a standalone license file is absent from this checkout.
