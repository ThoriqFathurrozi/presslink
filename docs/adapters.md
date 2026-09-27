# Adapter reference

[Back to README](../README.md) · [Architecture](architecture.md) · [Development](development.md)

## Registration and matching

[`src/adapters/registry.js`](../src/adapters/registry.js) exports the ordered `ADAPTERS` array and `resolveAdapter({ logger })`. It awaits each adapter's `match()` and returns the first match, skipping and logging exceptions. The order is NYT, Medium, Washington Post, Bloomberg, Reuters.

Registered adapters match their base hostname, any subdomain, or a publisher metadata selector through `matchesSite()`. The userscript manager must first allow the script to run. Metadata fallback detection does not expand the userscript's `@match` scope.

The root template currently contains these match rules:

```text
https://medium.com/*
https://*.medium.com/*
https://*.nytimes.com/*
https://*.washingtonpost.com/*
https://*.bloomberg.com/*
https://*.reuters.com/*
```

## Publisher behavior

These rules describe the checked-in implementation, not a guarantee about current publisher markup. The news adapters use URL patterns rather than a general paywall detector. All registered adapters normalize URLs by removing fragments and retaining query parameters.

### Medium

Source: [`medium.js`](../src/adapters/medium.js).

- Identifies `medium.com` and subdomains, or `head meta[content="Medium"]` / `meta[property="og:site_name"][content="Medium"]`.
- Finds cards with `article` and links with `a[data-discover="true"], a[href]`.
- A card requires an element matching `[aria-label="Member-only story"]`, a probable article link, and a story different from the current page.
- Probable article links use HTTP(S), avoid excluded paths, and have a 12-character hexadecimal story ID, a `/p/` prefix, or at least two nonempty path segments.
- Link ranking prefers a link containing `h2` or `h3`, then one with a story ID, then one with more than 20 trimmed text characters, then the first usable link.
- Detail detection accepts a path containing a qualifying 12-character hexadecimal story ID or a path matching `/^\/p\/[0-9a-f]+/i`, provided it is not excluded.
- Page eligibility requires detail detection, an `h1`, and either a member-only indicator anywhere on the page or a qualifying 12-character story ID. Consequently, a page button is not restricted to pages with a visible member-only marker.
- Detail-page cards exclude the current story and cards containing the page's first `h1`; remaining cards still need the member-only indicator.
- Story comparison uses the first 12-character hexadecimal ID when both URLs have one. Otherwise it compares origin and path, ignoring a trailing slash, query, and fragment.
- Page mounting prefers the first `h1` parent, then the first match for `main article, article, main`. Cards and page mounts receive `position: relative`. Launchers use `zIndex: 488`.

Excluded path prefixes: `/about`, `/explore`, `/followers`, `/following`, `/lists`, `/m/signin`, `/m/signout`, `/me/`, `/membership`, `/new-story`, `/plans`, `/search`, `/tag/`.

### Shared news rules

NYT, Washington Post, Bloomberg, and Reuters find links with their site-specific selector and map each to its closest matching card container. Discovery preserves order and duplicates; the engine deduplicates card elements. Within each card, the first HTTP(S) link whose path matches the article rule wins.

Cards qualify if that URL differs from the current article. Comparison uses origin and pathname with one trailing slash removed; query strings and fragments do not affect this identity check. Different stories published on the same date remain distinct.

Detail-page eligibility requires a recognized article path and an `h1`. Detail detection excludes path prefixes `/about`, `/account`, `/subscription`, and `/lists`. These are prefix checks, not exact segment matches, and the exclusion is applied to detail detection, not separately to card link selection.

Each news adapter sets its card and page mount to `position: relative`. Comma-separated selectors use normal DOM query order; they are not ordered fallback lists.

### The New York Times

Source: [`nyt.js`](../src/adapters/nyt.js).

| Setting | Value |
| --- | --- |
| Domain / metadata | `nytimes.com` / `head meta[content="@nytimes"]` |
| Article path | Begins with `/YYYY/MM/DD/` or the prefix `/athletic` |
| Links | `a[data-tpl="l"],a[href^="/"]` |
| Closest card | `div[data-tpl="sli"], div[data-tpl="lb"], section[class="story-wrapper"], article` |
| Page mount | `div[id="app"],main` |

Card discovery excludes cards inside `div[class="isPersonalizedAddOn"]` when its JSON `data-pers` value has `surface: "home-packages-always-free"`. Invalid JSON is logged and does not itself exclude the card.

### The Washington Post

Source: [`wapos.js`](../src/adapters/wapos.js).

| Setting | Value |
| --- | --- |
| Domain / metadata | `washingtonpost.com` / `head meta[content="@WashingtonPost"]` |
| Article path | Contains a slash-delimited `YYYY/MM/DD` date, or begins with `/athletic` |
| Links | `a[data-pb-local-content-field="web_headline"]` |
| Closest card | `div[class*="card"]` |
| Page mount | `main` |

The `/athletic` prefix is present in the implementation; it is not evidence of a verified Washington Post route.

### Bloomberg

Source: [`bloomberg.js`](../src/adapters/bloomberg.js).

| Setting | Value |
| --- | --- |
| Domain / metadata | `bloomberg.com` / `head meta[property="og:site_name"][content="Bloomberg.com"]` |
| Article path | Contains a slash-delimited `YYYY-MM-DD` date, or begins with `/features` or `/news` |
| Links | `a[href]` |
| Closest card | `div` |
| Page mount | `body, #__next` |

The broad link/container rules can match more than a narrowly defined story card. The page mount selector can select `body` even when `#__next` exists because DOM order determines the first match.

### Reuters

Source: [`reuters.js`](../src/adapters/reuters.js).

| Setting | Value |
| --- | --- |
| Domain / metadata | `reuters.com` / `head meta[property="og:site_name"][content="Reuters"]` |
| Article path | Ends in `YYYY-MM-DD`, optionally followed by `/`, or begins with `/news` |
| Links | `a[data-testid="TitleLink"]` |
| Closest card | `li, div[data-testid="common/single-section-blockStoryCard"],div[data-testid="VisualStoryContainer"]` |
| Page mount | `main,#fusion-app` |
| Launcher stacking | `zIndex: 100` |

### Inactive adapters

[`economist.js`](../src/adapters/economist.js) is an unregistered draft. Its selectors currently mirror Reuters-style markup and have not established live Economist support. Tests include its shared helper behavior; passing those tests does not activate or validate the site.

[`example.js`](../src/adapters/example.js) is an unregistered template matching `example.com`. It demonstrates `.article-card`, `.target-indicator`, a `/article/` detail route, and custom launcher styles. It inherits the base card mount unchanged. Financial Times has no adapter in this checkout.

## Adapter contract

Extend [`BaseAdapter`](../src/adapters/BaseAdapter.js) and export an instance. Base methods return safe inactive defaults. The engine awaits methods marked “awaited” below, so these may return either a value or a promise. Methods marked “sync” must return synchronously.

| Member | Execution | Return / purpose |
| --- | --- | --- |
| `name` | Property | Stable site name for logs and context |
| `match()` | Awaited by registry | Whether this adapter handles the current page |
| `isDetailPage()` | Sync | Whether the current route is an article detail page |
| `getCards()` | Awaited | Iterable or array-like collection of card elements; nullish becomes an empty array |
| `getCardUrl(card)` | Sync | Article URL string, or `null` |
| `shouldProcessCard(card)` | Awaited | Whether this card is eligible now |
| `shouldProcessPage()` | Awaited | Whether this detail page is eligible now |
| `getCardMountPoint(card)` | Awaited | Connected element to receive the button; defaults to `card` |
| `getPageMountPoint()` | Awaited | Connected element to receive the page button |
| `getLauncherOptions(context)` | Sync | Optional label, title, class, placement, and style options; defaults to `{}` |
| `normalizeUrl(url)` | Sync, optional | Normalized URL; a falsy result rejects it |
| `onBeforeProcess()` | Awaited, optional | Hook before card and page processing |
| `onAfterProcess()` | Awaited, optional | Hook after processing if the scan is still current |
| `cleanup()` | Async allowed, optional | Release adapter-owned resources during engine destruction |

`normalizeUrl` and the lifecycle hooks are supported by the engine but are not declared on `BaseAdapter`. Hooks receive no arguments. Launcher options receive the same context as actions, documented in [architecture](architecture.md).

Keep a card's mount inside that card: reconciliation checks `card.contains(launcher)` and will otherwise repeatedly replace the button. Prefer narrowly scoped card selectors so a card is a single article unit. Avoid returning publisher buttons, navigation links, or parent containers spanning multiple unrelated stories.

The default engine URL fallback resolves relative URLs but does not restrict schemes. The shared `normalizeArticleUrl()` removes fragments, returns invalid input unchanged, and also does not restrict schemes. Validate HTTP(S) URLs in a new adapter before returning them, as the active adapters do during article link selection.

## Adding a site

1. Inspect real index and article pages and identify stable selectors, article URL patterns, recommendation cards, and mount points.
2. Create `src/adapters/<site>.js`, extending `BaseAdapter` and exporting one instance. Use `example.js` for the structure and a registered adapter for production behavior.
3. Import and add the instance to `ADAPTERS` in `registry.js`. Check ordering if metadata-based matching overlaps another adapter.
4. Add narrowly scoped HTTPS `@match` entries to the root `pressora.user.js` metadata template. Restart any build watcher.
5. Add fixtures and tests for matching, URL selection, article identity, eligibility, and placement. Verify that the metadata registry test resolves the new domain.
6. Build and install the bundle. Check a real index, article, recommendations, infinite scroll, and in-page navigation, plus keyboard controls. See the [manual checklist](development.md#manual-browser-checks).
7. Update the supported-site list and this reference with verified rules and remaining limitations.

Use `safeQuery` / `safeQueryAll` for selectors that may be missing. They return `null` / `[]` on invalid selectors rather than throwing, so a typo can otherwise look like an empty page. Avoid adding persistent listeners or timers without a corresponding adapter cleanup hook.
