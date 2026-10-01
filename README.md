# Pressora

Pressora is a browser userscript that adds an article action menu to supported publishing sites. Use it to copy an article URL, open the original article in a new tab, or send its URL to an external reader. It handles article cards, article detail pages, dynamically inserted content, and History API navigation.

The implementation uses plain JavaScript, browser DOM APIs, and site adapters. esbuild packages the source into one installable userscript; there is no application server or runtime package dependency.

## Quick start

You need Node.js and npm to build, and a browser with a userscript manager to install the result. The esbuild dependency declares Node.js 18 or newer; the project does not declare its own minimum Node version. The documented checks were run with Node.js 26.8.1 and npm 11.19.0.

From the project directory:

```sh
npm ci
npm run build
```

In your userscript manager, create a new script, replace its contents with the complete contents of [`pressora.user.js`](pressora.user.js), save, and enable it. Reload a supported site and look for a **Pressora** button on an eligible card or article page.

**Install the file in.** The root [`pressora.user.js`](pressora.user.js) is only the metadata template and does not contain the application.

## Supported sites

| Site                | Adapter     | Current behavior                                                                         |
| ------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| Medium              | `medium`    | Member-only cards; eligible article pages and recommendation cards                       |
| The New York Times  | `nyt`       | Recognized article cards and detail pages; excludes marked always-free homepage packages |
| The Washington Post | `wapos`     | Recognized article cards and detail pages                                                |
| Bloomberg           | `bloomberg` | Recognized article cards and detail pages                                                |
| Reuters             | `reuters`   | Recognized article cards and detail pages                                                |

Support here means the site has both a registered adapter and install metadata. Selectors and URL rules are heuristics, and automated tests use fixtures rather than live publisher pages. See the [site reference](docs/adapters.md) for exact rules and limitations.

The Economist adapter is an unregistered draft. The example adapter is a development template. Financial Times has no adapter. These sites are not enabled by the install metadata. Medium custom publication domains are also outside the default metadata.

## Actions

| Menu item | Behavior                                                                    |
| --------- | --------------------------------------------------------------------------- |
| Copy URL  | Copies the selected article URL to the clipboard, with a DOM-based fallback |
| Open URL  | Opens the selected article URL in a new tab                                 |
| Open FREE | Opens `https://freedium-mirror.cfd/` followed by the selected article URL   |

“Open FREE” uses the same destination for every supported site. It is an external link action; Pressora does not fetch article content or guarantee the external service can read a given article. URL fragments are removed by the active adapters, while query parameters are preserved.

## Documentation

- [User guide](docs/usage.md): installation, interaction, keyboard controls, updates, data handling, and troubleshooting.
- [Architecture](docs/architecture.md): startup, scanning, navigation, UI lifecycle, and source layout.
- [Adapter reference](docs/adapters.md): site selectors, detection rules, extension contract, and adding a publisher.
- [Development guide](docs/development.md): build workflow, configuration, actions, styling, tests, and release checks.

## Commands

```sh
npm run build                               # Build the installable userscript
npm run dev                                 # Rebuild source changes continuously
npm test                                    # Run all regression tests
npm test -- tests/adapters                   # Run one test directory
npm test -- tests/core/scanner.test.js       # Run one test file
npm test -- tests/ui --test-name-pattern=Escape
```

The watcher does not install changes into the browser. Update your installed userscript from the generated file and reload the page. Restart the watcher after editing the root metadata template.

## Project metadata

The npm package version is `0.1.0`; the userscript metadata version is `1.2`. These are separate values and are not synchronized by the build. The metadata declares MIT, but this checkout does not include a standalone `LICENSE` file.
