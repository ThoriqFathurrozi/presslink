# User guide

[Back to README](../README.md) · [Site reference](adapters.md) · [Development](development.md)

## Installation

1. Install and enable a userscript manager browser extension, such as **Violentmonkey** or **Tampermonkey**, with permission to run on the supported site.
2. Open the Presslink listing on [OpenUserJS](https://openuserjs.org/scripts/frrzyriq/presslink), or [search for Presslink on Greasy Fork](https://greasyfork.org/en/scripts?q=Presslink).
3. Click **Install** (OpenUserJS) or **Install this script** (Greasy Fork) on the script's page, then confirm the installation in your userscript manager.
4. Reload a supported HTTPS page. A button appears only when the adapter finds an eligible article and a place to insert it.

**Build and install locally (optional)**

1. Have a userscript manager installed and enabled in your browser, with permission to run on the supported site.
2. In a terminal at the project root, run `npm ci` and then `npm run build`.
3. Open `presslink.user.js` in a text editor. Copy the entire file, including its userscript metadata block.
4. Create a new script in the userscript manager, replace its contents with the copied file, and save it. Enable the script.
5. Reload a supported HTTPS page. A button appears only when the adapter finds an eligible article and a place to insert it.

If the manager supports importing a local userscript file, importing the generated file is another option. Browser and manager installation interfaces vary; this project does not contain a tested compatibility matrix.

Node.js is needed for building and testing, not for running the installed userscript. Keep one enabled copy of Presslink to avoid conflicting versions.

## Using the menu

Click **Presslink** to open the action menu. Card buttons act on the article linked from that card. A page button acts on the current page URL. The default card button is green; the page button is dark. Placement is controlled by the publisher adapter and can differ between layouts.

Only one menu is open at a time. Clicking the same launcher again closes it; clicking another launcher switches menus. Successful actions close the menu. A failed action is logged to the browser console and generally leaves the menu open; there is no success toast or error dialog.

| Action | Details |
| --- | --- |
| Copy URL | Tries `navigator.clipboard.writeText`, then a temporary textarea and `document.execCommand('copy')` if needed. Clipboard behavior depends on the browser and page permissions. |
| Open URL | Calls `window.open` with `_blank` and `noopener,noreferrer`. |
| Open FREE | Uses the same new-tab mechanism with `https://freedium-mirror.cfd/` prepended to the article URL. The external service's availability and supported content are outside this project. |

The external destination is constructed by direct concatenation, without encoding the article URL as a query parameter. All registered adapters remove the fragment (`#...`) and preserve the query string (`?...`). Presslink does not retrieve a canonical URL from page metadata.

## Keyboard and focus

Focus the launcher using the browser's normal Tab order and activate its button with Enter or Space. Opening a menu focuses its first enabled action.

| Key or interaction | Result |
| --- | --- |
| Arrow Down / Arrow Up | Move among enabled menu items, wrapping at the ends |
| Home / End | Focus the first / last enabled item |
| Enter / Space | Activate the focused button |
| Escape | Close the menu and restore focus to its launcher if it still exists |
| Tab / Shift+Tab | Close the menu and resume normal page tab navigation from the launcher |
| Click outside | Close without pulling focus away from the clicked control |

An action button is disabled while its execution is pending. The popup uses `role="menu"`, items use `role="menuitem"`, and the launcher exposes expanded state and its associated popup through ARIA attributes. This does not constitute a full browser or assistive-technology accessibility audit.

## Dynamic pages

Presslink scans once at startup and schedules further scans when page children, link destinations, or `aria-label` attributes change. The default scan delay is 150 milliseconds. It also resets its UI after `pushState`, `replaceState`, and browser back/forward navigation.

This lets buttons follow infinite-scroll feeds and many single-page navigation flows. Arbitrary visual changes are not all observed: a change only to a CSS class or text node does not itself trigger a scan. A direct hash change has no dedicated navigation listener.

## Configuration and updating

There is no settings panel, saved preference store, or userscript menu command. Configuration is in [`src/config/constants.js`](../src/config/constants.js); enabled actions are in [`src/actions/registry.js`](../src/actions/registry.js). After a source change, rebuild, update the installed script, and reload the page. See [development](development.md) for examples.

`npm run dev` watches imported source files and rebuilds the bundle. It does not synchronize the bundle with your userscript manager. Changes to the metadata template require restarting this watcher.

The bundled metadata contains OpenUserJS `@updateURL` and `@downloadURL` entries. Depending on manager settings, automatic updates can replace a locally modified installation with the published script. For a local fork, review those fields and the manager's update settings before installation. This documentation describes the local source; it does not verify the contents or availability of the published endpoints.

To disable or uninstall, use the userscript manager and reload open publisher pages. For temporary debugging, the running engine can be stopped from the console as described in [architecture](architecture.md).

## Permissions and data handling

The metadata specifies `@grant none`, `@run-at document-end`, and `@noframes`. The script uses ordinary browser APIs, operates on matching top-level HTTPS pages, and declares no privileged userscript APIs.

The source contains no analytics, persistent storage, or background article-fetching code. It reads page elements and URLs, inserts buttons and a menu, and observes DOM/navigation changes. Copying explicitly writes the selected URL to the clipboard. Opening a link navigates a new tab; selecting **Open FREE** sends the selected URL, including preserved query parameters, to the external reader in the destination URL.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Nothing happens anywhere | Confirm the enabled script contains the full generated bundle, not just the root metadata file. Check the manager's site access and reload. |
| No button on one page or card | Check the [publisher rules](adapters.md). Not all pages, links, free Medium cards, or publisher layouts qualify. A supported domain alone does not guarantee a launcher. |
| Nothing on a custom Medium domain | The default metadata only covers `medium.com` and its subdomains. An adapter's metadata fallback does not grant permission to run on another hostname. |
| New source changes do not appear | Rebuild, replace the installed script, and reload. Restart the watcher if metadata changed. |
| Copy URL fails | Check clipboard permissions and the console. The fallback may also be blocked or unsupported. Use Open URL and copy from the address bar if needed. |
| A new tab does not open | Check popup blocking. The engine treats a `window.open` call without a thrown error as success, even if it returns `null`, so the menu can still close. |
| Open FREE cannot read the article | The action only constructs an external URL. Its presence on a publisher does not establish reader compatibility. |
| Button overlaps content or is hidden | Publisher CSS, clipping, stacking contexts, or selector changes may affect placement. Include the page and layout details in a bug report. |
| Wrong or stale article URL | Check whether the publisher reused a card or changed its link markup. Capture the relevant card HTML and page URL for adapter investigation. |
| Repeated or unexpected buttons | Ensure only one script version is enabled. Distinct card elements may intentionally have separate buttons even when they link to the same article. |

To investigate, set `CONFIG.debug` to `true`, rebuild, and reinstall. Filter the browser console for `[PageBreakdown]`; this is the internal logging name used by Presslink. Warnings and errors are logged even when debug is disabled.

A useful bug report includes the publisher URL, browser and userscript manager versions, installed userscript version, reproduction steps, expected result, console messages, and a small relevant HTML sample. Remove personal information from copied URLs and markup.
