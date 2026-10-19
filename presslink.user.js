// ==UserScript==
// @name         Presslink
// @namespace    https://github.com/ThoriqFathurrozi/
// @version      1.2
// @description  Improves the reading experience on supported news and publishing sites.
// @author       frrzyriq
// @match        https://medium.com/*
// @match        https://*.medium.com/*
// @match        https://*.nytimes.com/*
// @match        https://*.washingtonpost.com/*
// @match        https://*.bloomberg.com/*
// @match        https://*.reuters.com/*
// @grant        none
// @run-at       document-end
// @noframes
// @homepageURL  https://github.com/ThoriqFathurrozi/presslink
// @updateURL    https://openuserjs.org/meta/frrzyriq/presslink.meta.js
// @downloadURL  https://openuserjs.org/src/scripts/frrzyriq/presslink.user.js
// @license      MIT
// ==/UserScript==

(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/actions/actions/copyUrl.js
  function fallbackCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    Object.assign(textarea.style, {
      left: "-9999px",
      position: "fixed",
      top: "0"
    });
    const mount = document.body ?? document.documentElement;
    if (!mount) {
      throw new Error("Clipboard fallback has no DOM mount point");
    }
    mount.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) {
      throw new Error("Clipboard copy command failed");
    }
  }
  var CopyUrlAction = {
    key: "COPY_URL",
    name: "Copy URL",
    enabled: true,
    async execute(context) {
      if (!context.url) {
        return;
      }
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(context.url);
          return;
        } catch {
          fallbackCopyText(context.url);
          return;
        }
      }
      fallbackCopyText(context.url);
    }
  };
  var copyUrl_default = CopyUrlAction;

  // src/actions/actions/openUrl.js
  var OpenUrlAction = {
    key: "OPEN_URL",
    name: "Open URL",
    enabled: true,
    buildUrl(context) {
      return context.url;
    }
  };
  var openUrl_default = OpenUrlAction;

  // src/actions/actions/openFree.js
  var OpenFreeAction = {
    key: "OPEN_FREE",
    name: "Open FREE",
    enabled: true,
    buildUrl(context) {
      const baseUrl = "https://freedium-mirror.cfd/";
      return baseUrl + context.url;
    }
  };
  var openFree_default = OpenFreeAction;

  // src/actions/registry.js
  var ACTIONS = [
    copyUrl_default,
    openUrl_default,
    openFree_default
  ];
  function getActiveActions() {
    return ACTIONS.filter(
      (action) => action.enabled !== false
    );
  }

  // src/config/constants.js
  var CONFIG = Object.freeze({
    debug: false,
    scanDelay: 150,
    launcherLabel: "Presslink",
    popup: Object.freeze({
      closeOnOutside: true
    })
  });
  var DATASET_KEYS = Object.freeze({
    processed: "pageBreakdownProcessed",
    launcher: "pageBreakdownLauncher",
    pageLauncher: "pageBreakdownPageLauncher"
  });
  var MARKER_SELECTORS = Object.freeze({
    launcher: "[data-page-breakdown-launcher]",
    pageLauncher: "[data-page-breakdown-page-launcher]"
  });
  var NAVIGATION_EVENT = "userscript:navigation";
  var HISTORY_PATCH_FLAG = "__PAGE_BREAKDOWN_HISTORY_PATCHED__";
  var ENGINE_INSTANCE_KEY = "__PAGE_BREAKDOWN_ENGINE__";

  // src/core/utils.js
  function isElement(value) {
    return typeof Element !== "undefined" && value instanceof Element;
  }
  function isCurrentArticleUrl(value) {
    if (!value) {
      return false;
    }
    const comparable = (input) => {
      const url = new URL(input, window.location.href);
      return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
    };
    try {
      return comparable(value) === comparable(window.location.href);
    } catch {
      return false;
    }
  }
  function safeQuery(selector, root = document) {
    try {
      return root?.querySelector?.(selector) ?? null;
    } catch {
      return null;
    }
  }
  function safeQueryAll(selector, root = document) {
    try {
      return Array.from(
        root?.querySelectorAll?.(selector) ?? []
      );
    } catch {
      return [];
    }
  }
  function simpleHash(value) {
    const input = String(value ?? "");
    let hash = 5381;
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash << 5) + hash ^ input.charCodeAt(index);
    }
    return (hash >>> 0).toString(36);
  }
  function findArticleLink(links, matchesPath) {
    return links.find((link) => {
      try {
        const url = new URL(link.href, window.location.href);
        return ["http:", "https:"].includes(url.protocol) && matchesPath(url.pathname);
      } catch {
        return false;
      }
    }) ?? null;
  }
  function normalizeArticleUrl(url) {
    try {
      const normalized = new URL(url, window.location.href);
      normalized.hash = "";
      return normalized.href;
    } catch {
      return url;
    }
  }
  function setRelativePosition(element) {
    Object.assign(element.style, { position: "relative" });
    return element;
  }
  function createLogger(debug = false) {
    const prefix = "[PageBreakdown]";
    return {
      debug(...args) {
        if (debug) {
          console.debug(prefix, ...args);
        }
      },
      warn(...args) {
        console.warn(prefix, ...args);
      },
      error(...args) {
        console.error(prefix, ...args);
      }
    };
  }

  // src/adapters/BaseAdapter.js
  var BaseAdapter = class {
    constructor() {
      __publicField(this, "name", "base");
    }
    async match() {
      return false;
    }
    isDetailPage() {
      return false;
    }
    async getCards() {
      return [];
    }
    getCardUrl(card) {
      void card;
      return null;
    }
    async shouldProcessCard(card) {
      void card;
      return false;
    }
    async shouldProcessPage() {
      return false;
    }
    async getPageMountPoint() {
      return null;
    }
    getCardMountPoint(card) {
      return card;
    }
    getLauncherOptions(context) {
      void context;
      return {};
    }
  };

  // src/adapters/utils.js
  var EXCLUDED_NEWS_PATHS = ["/about", "/account", "/subscription", "/lists"];
  function matchesSite(domain, siteIdentifier) {
    const hostname = window.location.hostname;
    return hostname === domain || hostname.endsWith(`.${domain}`) || Boolean(safeQuery(siteIdentifier));
  }
  function matchesArticlePath(pathname, pattern, prefixes) {
    return pattern.test(pathname) || prefixes.some((prefix) => pathname.startsWith(prefix));
  }
  function isExcludedNewsPath(pathname) {
    return EXCLUDED_NEWS_PATHS.some((prefix) => pathname.startsWith(prefix));
  }
  function getCardsFromLinks(articleLinkSelector, cardSelector) {
    return safeQueryAll(articleLinkSelector).map((link) => link.closest(cardSelector)).filter(Boolean);
  }
  function getArticleCardUrl(card, articleLinkSelector, matchesPath) {
    const links = safeQueryAll(articleLinkSelector, card);
    return findArticleLink(links, matchesPath)?.href ?? null;
  }
  function isOtherArticleUrl(url) {
    return Boolean(url && !isCurrentArticleUrl(url));
  }
  function hasArticleHeading(isDetailPage, headingSelector) {
    return Boolean(isDetailPage && safeQuery(headingSelector));
  }
  function getRelativePageMount(pageSelector, headingSelector) {
    const headingParent = headingSelector ? safeQuery(headingSelector)?.parentElement : null;
    const mount = headingParent ?? safeQuery(pageSelector);
    if (mount) {
      setRelativePosition(mount);
    }
    return mount;
  }
  function createSiteLauncherOptions(siteName, pageType, style = pageType) {
    return {
      className: `presslink-${siteName}-launcher presslink-${siteName}-launcher--${pageType}`,
      style
    };
  }

  // src/adapters/medium.js
  function hasStoryId(pathname) {
    return /[0-9a-f]{12}(?:$|[/?#])/i.test(pathname);
  }
  function getStoryId(value) {
    try {
      const url = new URL(value, window.location.href);
      return url.pathname.match(/[0-9a-f]{12}/i)?.[0].toLowerCase() ?? null;
    } catch {
      return null;
    }
  }
  function getComparableUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
      return `${url.origin}${pathname}`;
    } catch {
      return null;
    }
  }
  function isCurrentStoryUrl(value) {
    const targetStoryId = getStoryId(value);
    const currentStoryId = getStoryId(window.location.href);
    if (targetStoryId && currentStoryId) {
      return targetStoryId === currentStoryId;
    }
    return getComparableUrl(value) === getComparableUrl(window.location.href);
  }
  function isExcludedPath(pathname) {
    return [
      "/about",
      "/explore",
      "/followers",
      "/following",
      "/lists",
      "/m/signin",
      "/m/signout",
      "/me/",
      "/membership",
      "/new-story",
      "/plans",
      "/search",
      "/tag/"
    ].some((path) => pathname.startsWith(path));
  }
  function isProbablyArticleUrl(href) {
    try {
      const url = new URL(href, window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) {
        return false;
      }
      if (isExcludedPath(url.pathname)) {
        return false;
      }
      return hasStoryId(url.pathname) || url.pathname.startsWith("/p/") || url.pathname.split("/").filter(Boolean).length >= 2;
    } catch {
      return false;
    }
  }
  function findBestArticleLink(links) {
    const usableLinks = links.filter(
      (link) => isProbablyArticleUrl(link.href)
    );
    return usableLinks.find(
      (link) => Boolean(safeQuery("h2, h3", link))
    ) ?? usableLinks.find(
      (link) => hasStoryId(new URL(link.href, window.location.href).pathname)
    ) ?? usableLinks.find(
      (link) => link.textContent.trim().length > 20
    ) ?? usableLinks[0] ?? null;
  }
  var MediumAdapter = class extends BaseAdapter {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "medium");
      __publicField(this, "selectors", {
        siteIdentifier: 'head meta[content="Medium"], meta[property="og:site_name"][content="Medium"]',
        card: "article",
        articleLink: 'a[data-discover="true"], a[href]',
        memberOnly: 'button[aria-label="Member-only story"], [aria-label="Member-only story"]',
        heading: "h1",
        pageMount: "main article, article, main"
      });
    }
    async match() {
      return matchesSite("medium.com", this.selectors.siteIdentifier);
    }
    isDetailPage() {
      const pathname = window.location.pathname;
      return !isExcludedPath(pathname) && (hasStoryId(pathname) || /^\/p\/[0-9a-f]+/i.test(pathname));
    }
    async getCards() {
      const cards = safeQueryAll(this.selectors.card);
      if (!this.isDetailPage()) {
        return cards;
      }
      return cards.filter(
        (card) => this.isDetailRecommendationCard(card)
      );
    }
    getCardUrl(card) {
      const links = safeQueryAll(
        this.selectors.articleLink,
        card
      );
      const preferred = findBestArticleLink(links);
      return preferred?.href ?? null;
    }
    async shouldProcessCard(card) {
      const url = this.getCardUrl(card);
      return Boolean(
        safeQuery(this.selectors.memberOnly, card) && url && !isCurrentStoryUrl(url)
      );
    }
    async shouldProcessPage() {
      return Boolean(
        this.isDetailPage() && safeQuery(this.selectors.heading) && (safeQuery(this.selectors.memberOnly) || hasStoryId(window.location.pathname))
      );
    }
    async getPageMountPoint() {
      return getRelativePageMount(this.selectors.pageMount, this.selectors.heading);
    }
    getCardMountPoint(card) {
      return setRelativePosition(card);
    }
    getLauncherOptions({ pageType }) {
      return createSiteLauncherOptions("medium", pageType, {
        name: pageType,
        zIndex: 488
      });
    }
    isDetailRecommendationCard(card) {
      const heading = safeQuery(this.selectors.heading);
      const url = this.getCardUrl(card);
      if (!url || isCurrentStoryUrl(url)) {
        return false;
      }
      return !(heading && card.contains(heading));
    }
    normalizeUrl(url) {
      return normalizeArticleUrl(url);
    }
  };
  var medium_default = new MediumAdapter();

  // src/adapters/nyt.js
  function hasNYTNews(pathname) {
    const newsPattern = /^\/\d{4}\/\d{2}\/\d{2}\//;
    const paths = [
      "/athletic"
    ];
    return matchesArticlePath(pathname, newsPattern, paths);
  }
  var NYTAdapter = class extends BaseAdapter {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "nyt");
      __publicField(this, "selectors", {
        siteIdentifier: 'head meta[content="@nytimes"]',
        articleLink: 'a[data-tpl="l"],a[href^="/"]',
        cardMount: 'div[data-tpl="sli"], div[data-tpl="lb"], section[class="story-wrapper"], article',
        pageMount: 'div[id="app"],main',
        heading: "h1"
      });
    }
    async match() {
      return matchesSite("nytimes.com", this.selectors.siteIdentifier);
    }
    isDetailPage() {
      const pathname = window.location.pathname;
      return !isExcludedNewsPath(pathname) && hasNYTNews(pathname);
    }
    async getCards() {
      const cards = getCardsFromLinks(
        this.selectors.articleLink,
        this.selectors.cardMount
      );
      const subsCards = cards.filter((card) => {
        let sectionData = card.closest('div[class="isPersonalizedAddOn"]')?.dataset?.pers;
        if (sectionData) {
          try {
            sectionData = JSON.parse(sectionData);
          } catch (error) {
            console.error("Failed to parse sectionData:", error);
          }
        }
        if (sectionData && sectionData.surface === "home-packages-always-free") {
          return false;
        }
        return true;
      });
      return subsCards;
    }
    getCardUrl(card) {
      return getArticleCardUrl(card, this.selectors.articleLink, hasNYTNews);
    }
    async shouldProcessCard(card) {
      return isOtherArticleUrl(this.getCardUrl(card));
    }
    async shouldProcessPage() {
      return hasArticleHeading(this.isDetailPage(), this.selectors.heading);
    }
    async getPageMountPoint() {
      return getRelativePageMount(this.selectors.pageMount);
    }
    getCardMountPoint(card) {
      return setRelativePosition(card);
    }
    getLauncherOptions({ pageType }) {
      return createSiteLauncherOptions("nyt", pageType);
    }
    normalizeUrl(url) {
      return normalizeArticleUrl(url);
    }
  };
  var nyt_default = new NYTAdapter();

  // src/adapters/wapos.js
  function hasWaPosNews(pathname) {
    const newsPattern = /(?<=\/)\d{4}\/\d{2}\/\d{2}(?=\/)/;
    const paths = [
      "/athletic"
    ];
    return matchesArticlePath(pathname, newsPattern, paths);
  }
  var WaPosAdapter = class extends BaseAdapter {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "wapos");
      __publicField(this, "selectors", {
        siteIdentifier: 'head meta[content="@WashingtonPost"]',
        articleLink: 'a[data-pb-local-content-field="web_headline"]',
        cardMount: 'div[class*="card"]',
        pageMount: "main",
        heading: "h1"
      });
    }
    async match() {
      return matchesSite("washingtonpost.com", this.selectors.siteIdentifier);
    }
    isDetailPage() {
      const pathname = window.location.pathname;
      return !isExcludedNewsPath(pathname) && hasWaPosNews(pathname);
    }
    async getCards() {
      const cards = getCardsFromLinks(
        this.selectors.articleLink,
        this.selectors.cardMount
      );
      return cards;
    }
    getCardUrl(card) {
      return getArticleCardUrl(card, this.selectors.articleLink, hasWaPosNews);
    }
    async shouldProcessCard(card) {
      return isOtherArticleUrl(this.getCardUrl(card));
    }
    async shouldProcessPage() {
      return hasArticleHeading(this.isDetailPage(), this.selectors.heading);
    }
    async getPageMountPoint() {
      return getRelativePageMount(this.selectors.pageMount);
    }
    getCardMountPoint(card) {
      return setRelativePosition(card);
    }
    getLauncherOptions({ pageType }) {
      return createSiteLauncherOptions("wapos", pageType);
    }
    normalizeUrl(url) {
      return normalizeArticleUrl(url);
    }
  };
  var wapos_default = new WaPosAdapter();

  // src/adapters/bloomberg.js
  function hasBloombergNews(pathname) {
    const newsPattern = /(?<=\/)\d{4}-\d{2}-\d{2}(?=\/)/;
    const paths = [
      "/features",
      "/news"
    ];
    return matchesArticlePath(pathname, newsPattern, paths);
  }
  var BloombergAdapter = class extends BaseAdapter {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "bloomberg");
      __publicField(this, "selectors", {
        siteIdentifier: 'head meta[property="og:site_name"][content="Bloomberg.com"]',
        articleLink: "a[href]",
        cardMount: "div",
        pageMount: "body, #__next",
        heading: "h1"
      });
    }
    async match() {
      return matchesSite("bloomberg.com", this.selectors.siteIdentifier);
    }
    isDetailPage() {
      const pathname = window.location.pathname;
      return !isExcludedNewsPath(pathname) && hasBloombergNews(pathname);
    }
    async getCards() {
      const cards = getCardsFromLinks(
        this.selectors.articleLink,
        this.selectors.cardMount
      );
      return cards;
    }
    getCardUrl(card) {
      return getArticleCardUrl(card, this.selectors.articleLink, hasBloombergNews);
    }
    async shouldProcessCard(card) {
      return isOtherArticleUrl(this.getCardUrl(card));
    }
    async shouldProcessPage() {
      return hasArticleHeading(this.isDetailPage(), this.selectors.heading);
    }
    async getPageMountPoint() {
      return getRelativePageMount(this.selectors.pageMount);
    }
    getCardMountPoint(card) {
      return setRelativePosition(card);
    }
    getLauncherOptions({ pageType }) {
      return createSiteLauncherOptions("bloomberg", pageType);
    }
    normalizeUrl(url) {
      return normalizeArticleUrl(url);
    }
  };
  var bloomberg_default = new BloombergAdapter();

  // src/adapters/reuters.js
  function hasReutersNews(pathname) {
    const newsPattern = /\d{4}-\d{2}-\d{2}(?=\/?$)/;
    const paths = [
      "/news"
    ];
    return matchesArticlePath(pathname, newsPattern, paths);
  }
  var ReutersAdapter = class extends BaseAdapter {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "reuters");
      __publicField(this, "selectors", {
        siteIdentifier: 'head meta[property="og:site_name"][content="Reuters"]',
        articleLink: 'a[data-testid="TitleLink"]',
        cardMount: 'li, div[data-testid="common/single-section-blockStoryCard"],div[data-testid="VisualStoryContainer"]',
        pageMount: "main,#fusion-app",
        heading: "h1"
      });
    }
    async match() {
      return matchesSite("reuters.com", this.selectors.siteIdentifier);
    }
    isDetailPage() {
      const pathname = window.location.pathname;
      return !isExcludedNewsPath(pathname) && hasReutersNews(pathname);
    }
    async getCards() {
      const cards = getCardsFromLinks(
        this.selectors.articleLink,
        this.selectors.cardMount
      );
      return cards;
    }
    getCardUrl(card) {
      return getArticleCardUrl(card, this.selectors.articleLink, hasReutersNews);
    }
    async shouldProcessCard(card) {
      return isOtherArticleUrl(this.getCardUrl(card));
    }
    async shouldProcessPage() {
      return hasArticleHeading(this.isDetailPage(), this.selectors.heading);
    }
    async getPageMountPoint() {
      return getRelativePageMount(this.selectors.pageMount);
    }
    getCardMountPoint(card) {
      return setRelativePosition(card);
    }
    getLauncherOptions({ pageType }) {
      return createSiteLauncherOptions("reuters", pageType, {
        name: pageType,
        zIndex: 100
      });
    }
    normalizeUrl(url) {
      return normalizeArticleUrl(url);
    }
  };
  var reuters_default = new ReutersAdapter();

  // src/adapters/registry.js
  var ADAPTERS = [
    nyt_default,
    medium_default,
    wapos_default,
    bloomberg_default,
    reuters_default
  ];
  async function resolveAdapter({
    logger = createLogger(CONFIG.debug)
  } = {}) {
    for (const adapter of ADAPTERS) {
      try {
        if (await adapter.match()) {
          logger.debug("Adapter detected:", adapter.name);
          return adapter;
        }
      } catch (error) {
        logger.warn(
          `adapter "${adapter.name}" failed`,
          error
        );
      }
    }
    return null;
  }

  // src/core/DomObserver.js
  var DomObserver = class {
    constructor({ onMutation, logger }) {
      this.onMutation = onMutation;
      this.logger = logger;
      this.observer = null;
    }
    start() {
      if (this.observer) {
        return;
      }
      const target = document.documentElement ?? document;
      this.observer = new MutationObserver(() => {
        this.onMutation();
      });
      this.observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["href", "aria-label"]
      });
      this.logger?.debug("DOM observer started");
    }
    destroy() {
      this.observer?.disconnect();
      this.observer = null;
    }
  };
  var DomObserver_default = DomObserver;

  // src/core/NavigationObserver.js
  function dispatchNavigation() {
    window.dispatchEvent(
      new CustomEvent(NAVIGATION_EVENT, {
        detail: {
          url: window.location.href
        }
      })
    );
  }
  function patchHistory(logger) {
    if (window[HISTORY_PATCH_FLAG]) {
      return;
    }
    for (const methodName of ["pushState", "replaceState"]) {
      const originalMethod = history[methodName];
      history[methodName] = function(...args) {
        const result = originalMethod.apply(this, args);
        dispatchNavigation();
        return result;
      };
    }
    window[HISTORY_PATCH_FLAG] = true;
    logger?.debug("History API patched");
  }
  var NavigationObserver = class {
    constructor({ onNavigate, logger }) {
      this.onNavigate = onNavigate;
      this.logger = logger;
      this.started = false;
      this.handleNavigation = this.handleNavigation.bind(this);
      this.handlePopState = this.handlePopState.bind(this);
    }
    start() {
      if (this.started) {
        return;
      }
      patchHistory(this.logger);
      window.addEventListener(
        NAVIGATION_EVENT,
        this.handleNavigation
      );
      window.addEventListener("popstate", this.handlePopState);
      this.started = true;
    }
    handlePopState() {
      dispatchNavigation();
    }
    handleNavigation(event) {
      this.logger?.debug(
        "Navigation detected",
        event.detail?.url ?? window.location.href
      );
      this.onNavigate(event);
    }
    destroy() {
      if (!this.started) {
        return;
      }
      window.removeEventListener(
        NAVIGATION_EVENT,
        this.handleNavigation
      );
      window.removeEventListener("popstate", this.handlePopState);
      this.started = false;
    }
  };
  var NavigationObserver_default = NavigationObserver;

  // src/core/Scanner.js
  var Scanner = class {
    constructor({ onScan, delay = 150, logger }) {
      this.onScan = onScan;
      this.delay = delay;
      this.logger = logger;
      this.timer = null;
      this.running = false;
      this.pending = false;
      this.destroyed = false;
    }
    schedule() {
      if (this.destroyed) {
        return;
      }
      if (this.running) {
        this.pending = true;
        return;
      }
      if (this.timer !== null) {
        return;
      }
      this.timer = setTimeout(() => {
        this.timer = null;
        void this.runNow();
      }, this.delay);
    }
    async runNow() {
      if (this.destroyed) {
        return;
      }
      if (this.running) {
        this.pending = true;
        return;
      }
      clearTimeout(this.timer);
      this.timer = null;
      this.running = true;
      this.pending = false;
      try {
        await this.onScan();
      } catch (error) {
        this.logger?.warn("Scan failed", error);
      } finally {
        this.running = false;
        if (this.pending && !this.destroyed) {
          this.pending = false;
          this.schedule();
        }
      }
    }
    destroy() {
      this.destroyed = true;
      this.pending = false;
      clearTimeout(this.timer);
      this.timer = null;
    }
  };
  var Scanner_default = Scanner;

  // src/ui/createLauncher.js
  var DEFAULT_STYLE = {
    alignItems: "center",
    background: "#111827",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: "999px",
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.18)",
    color: "#ffffff",
    cursor: "pointer",
    display: "inline-flex",
    font: '600 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    gap: "6px",
    justifyContent: "center",
    letterSpacing: "0.01em",
    padding: "7px 11px",
    position: "absolute",
    right: "5px",
    textDecoration: "none",
    top: "5px",
    transform: "translateY(0)",
    transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
    zIndex: "2147483646"
  };
  var DEFAULT_HOVER_STYLE = {
    boxShadow: "0 8px 22px rgba(17, 24, 39, 0.22)",
    transform: "translateY(-1px)"
  };
  var NAMED_STYLES = Object.freeze({
    card: Object.freeze({
      background: "#1a8917",
      borderColor: "rgba(255, 255, 255, 0.24)"
    }),
    default: Object.freeze({}),
    page: Object.freeze({
      background: "#111827",
      borderColor: "rgba(255, 255, 255, 0.18)"
    })
  });
  var NAMED_HOVER_STYLES = Object.freeze({
    card: Object.freeze({
      background: "#156d12"
    }),
    default: Object.freeze({}),
    page: Object.freeze({
      background: "#030712"
    })
  });
  var STYLE_CONFIG_KEYS = /* @__PURE__ */ new Set([
    "default",
    "defaults",
    "name",
    "overrides",
    "style",
    "styleName",
    "styles"
  ]);
  function isStyleObject(value) {
    return Boolean(
      value && typeof value === "object" && !Array.isArray(value)
    );
  }
  function getObjectStyle(value) {
    return isStyleObject(value) ? value : {};
  }
  function getStyleName(config, fallbackName) {
    if (typeof config === "string") {
      return config;
    }
    if (!isStyleObject(config)) {
      return fallbackName;
    }
    return config.name ?? config.styleName ?? fallbackName;
  }
  function getStyleOverrides(config) {
    const overrides = {};
    if (!isStyleObject(config)) {
      return overrides;
    }
    for (const [property, value] of Object.entries(config)) {
      if (STYLE_CONFIG_KEYS.has(property) || isStyleObject(value)) {
        continue;
      }
      overrides[property] = value;
    }
    return overrides;
  }
  function resolveStyleConfig({
    builtInStyles,
    config,
    name,
    styles
  }) {
    const styleName = getStyleName(config, name);
    const configObject = getObjectStyle(config);
    const configStyles = getObjectStyle(configObject.styles);
    const fallbackStyles = getObjectStyle(styles);
    return {
      ...getObjectStyle(builtInStyles.default),
      ...getObjectStyle(fallbackStyles.default),
      ...getObjectStyle(configStyles.default),
      ...getObjectStyle(configObject.default),
      ...getObjectStyle(configObject.defaults),
      ...getObjectStyle(builtInStyles[styleName]),
      ...getObjectStyle(fallbackStyles[styleName]),
      ...getObjectStyle(configStyles[styleName]),
      ...getObjectStyle(configObject[styleName]),
      ...getObjectStyle(configObject.style),
      ...getStyleOverrides(configObject),
      ...getObjectStyle(configObject.overrides)
    };
  }
  function toCssProperty(property) {
    if (property.startsWith("--") || property.includes("-")) {
      return property;
    }
    return property.replace(
      /[A-Z]/g,
      (character) => `-${character.toLowerCase()}`
    );
  }
  function applyStyles(element, styles) {
    for (const [property, value] of Object.entries(styles)) {
      const cssProperty = toCssProperty(property);
      if (value === null || value === void 0 || value === "") {
        element.style.removeProperty(cssProperty);
        continue;
      }
      element.style.setProperty(cssProperty, String(value));
    }
  }
  function clearMissingBaseStyles(element, hoverStyle, baseStyle) {
    for (const property of Object.keys(hoverStyle)) {
      if (property in baseStyle) {
        continue;
      }
      element.style.removeProperty(toCssProperty(property));
    }
  }
  function createLauncher({
    className = "",
    hoverStyle = {},
    hoverStyleName,
    hoverStyles = {},
    label,
    onClick,
    placement = "card",
    style = {},
    styleName,
    styles = {},
    title = label
  }) {
    const launcher = document.createElement("button");
    const activeStyleName = getStyleName(
      style,
      styleName ?? "default"
    );
    const baseStyle = {
      ...DEFAULT_STYLE,
      margin: placement === "page" ? "12px 0" : "8px 0 0",
      ...resolveStyleConfig({
        builtInStyles: NAMED_STYLES,
        config: style,
        name: activeStyleName,
        styles
      })
    };
    const activeHoverStyle = {
      ...DEFAULT_HOVER_STYLE,
      ...resolveStyleConfig({
        builtInStyles: NAMED_HOVER_STYLES,
        config: hoverStyle,
        name: hoverStyleName ?? activeStyleName,
        styles: hoverStyles
      })
    };
    launcher.type = "button";
    launcher.textContent = label;
    launcher.title = title;
    launcher.setAttribute("aria-haspopup", "menu");
    launcher.setAttribute("aria-expanded", "false");
    launcher.dataset[DATASET_KEYS.launcher] = "true";
    launcher.dataset.pageBreakdownPlacement = placement;
    if (className) {
      launcher.classList.add(
        ...className.split(/\s+/).filter(Boolean)
      );
    }
    applyStyles(launcher, baseStyle);
    launcher.addEventListener("mouseenter", () => {
      applyStyles(launcher, activeHoverStyle);
    });
    launcher.addEventListener("mouseleave", () => {
      clearMissingBaseStyles(
        launcher,
        activeHoverStyle,
        baseStyle
      );
      applyStyles(launcher, baseStyle);
    });
    launcher.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick?.({ event, launcher });
    });
    return launcher;
  }
  var createLauncher_default = createLauncher;

  // src/ui/createPopup.js
  function getPopupLeft(anchorRect, width) {
    const gutter = 12;
    const preferred = anchorRect.left;
    const maximum = window.innerWidth - width - gutter;
    return Math.max(gutter, Math.min(preferred, maximum));
  }
  function createPopup({
    id,
    items = [],
    anchor = null,
    closeOnOutside = true,
    onClose
  }) {
    const popup = document.createElement("div");
    const content = document.createElement("div");
    let mounted = false;
    let outsideClickTimer = null;
    popup.id = id;
    popup.dataset.pageBreakdownPopup = "true";
    popup.setAttribute("role", "menu");
    popup.setAttribute("aria-label", "Presslink actions");
    Object.assign(popup.style, {
      background: "#ffffff",
      border: "1px solid rgba(17, 24, 39, 0.12)",
      borderRadius: "12px",
      boxShadow: "0 20px 45px rgba(17, 24, 39, 0.22)",
      color: "#111827",
      minWidth: "180px",
      padding: "6px",
      position: "fixed",
      zIndex: "2147483647"
    });
    Object.assign(content.style, {
      display: "grid",
      gap: "4px"
    });
    popup.appendChild(content);
    const position = () => {
      const popupWidth = popup.offsetWidth || 200;
      if (!anchor?.getBoundingClientRect) {
        Object.assign(popup.style, {
          left: "12px",
          top: "12px"
        });
        return;
      }
      const anchorRect = anchor.getBoundingClientRect();
      const top = Math.min(
        anchorRect.bottom + 8,
        window.innerHeight - popup.offsetHeight - 12
      );
      Object.assign(popup.style, {
        left: `${getPopupLeft(anchorRect, popupWidth)}px`,
        top: `${Math.max(12, top)}px`
      });
    };
    const handleOutsideClick = (event) => {
      const target = event.target;
      if (popup.contains(target) || anchor?.contains?.(target)) {
        return;
      }
      api.unmount({ restoreFocus: false });
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        api.unmount();
        return;
      }
      if (event.key === "Tab") {
        api.unmount();
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }
      const enabledItems = Array.from(content.children).filter((item) => !item.disabled);
      if (!enabledItems.length) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const current = enabledItems.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? enabledItems.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + enabledItems.length) % enabledItems.length;
      enabledItems[next].focus();
    };
    popup.addEventListener("keydown", handleKeyDown);
    const api = {
      element: popup,
      mount(target = document.body ?? document.documentElement) {
        if (mounted) {
          return api;
        }
        this.updateChildren(items);
        target.appendChild(popup);
        position();
        mounted = true;
        anchor?.setAttribute("aria-expanded", "true");
        anchor?.setAttribute("aria-controls", id);
        Array.from(content.children).find((item) => !item.disabled)?.focus();
        if (closeOnOutside) {
          outsideClickTimer = setTimeout(() => {
            outsideClickTimer = null;
            if (mounted) {
              document.addEventListener(
                "click",
                handleOutsideClick,
                true
              );
            }
          }, 0);
        }
        window.addEventListener("resize", position);
        window.addEventListener("scroll", position, true);
        return api;
      },
      unmount({ restoreFocus = true } = {}) {
        if (!mounted) {
          return;
        }
        clearTimeout(outsideClickTimer);
        outsideClickTimer = null;
        document.removeEventListener(
          "click",
          handleOutsideClick,
          true
        );
        window.removeEventListener("resize", position);
        window.removeEventListener("scroll", position, true);
        const hadFocus = popup.contains(document.activeElement);
        popup.remove();
        mounted = false;
        anchor?.setAttribute("aria-expanded", "false");
        anchor?.removeAttribute("aria-controls");
        if (restoreFocus && hadFocus && anchor?.isConnected) {
          anchor.focus();
        }
        onClose?.();
      },
      updateChildren(children = []) {
        content.replaceChildren(...children);
        position();
      }
    };
    return api;
  }
  var createPopup_default = createPopup;

  // src/ui/createActionItem.js
  function createActionItem({ action, context, onExecute }) {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = action.name ?? action.key;
    item.dataset.pageBreakdownAction = action.key;
    item.setAttribute("role", "menuitem");
    Object.assign(item.style, {
      background: "transparent",
      border: "0",
      borderRadius: "8px",
      color: "#111827",
      cursor: "pointer",
      display: "block",
      font: '500 13px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: "9px 10px",
      textAlign: "left",
      width: "100%"
    });
    item.addEventListener("mouseenter", () => {
      item.style.background = "#f3f4f6";
    });
    item.addEventListener("mouseleave", () => {
      item.style.background = "transparent";
    });
    item.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      item.disabled = true;
      try {
        await onExecute(action, context);
      } finally {
        item.disabled = false;
      }
    });
    return item;
  }
  var createActionItem_default = createActionItem;

  // src/core/PageBreakdownEngine.js
  var PageBreakdownEngine = class {
    constructor({
      adapter,
      actions = [],
      scanDelay = CONFIG.scanDelay,
      launcherLabel = CONFIG.launcherLabel,
      popup = CONFIG.popup,
      logger = createLogger(CONFIG.debug),
      createLauncher: createLauncher2 = createLauncher_default,
      createPopup: createPopup2 = createPopup_default,
      createActionItem: createActionItem2 = createActionItem_default
    }) {
      this.adapter = adapter;
      this.actions = actions;
      this.launcherLabel = launcherLabel;
      this.popupConfig = popup;
      this.logger = logger;
      this.createLauncherComponent = createLauncher2;
      this.createPopupComponent = createPopup2;
      this.createActionItemComponent = createActionItem2;
      this.activePopup = null;
      this.activePopupAnchor = null;
      this.injectedLaunchers = /* @__PURE__ */ new Set();
      this.processedCards = /* @__PURE__ */ new Map();
      this.started = false;
      this.destroyed = false;
      this.generation = 0;
      this.scanner = new Scanner_default({
        delay: scanDelay,
        logger,
        onScan: () => this.scan()
      });
      this.domObserver = new DomObserver_default({
        logger,
        onMutation: () => this.scheduleScan()
      });
      this.navigationObserver = new NavigationObserver_default({
        logger,
        onNavigate: () => {
          this.closeActivePopup();
          this.resetInjectedUi();
          this.scheduleScan();
        }
      });
      this.handlePageHide = this.handlePageHide.bind(this);
    }
    async start() {
      if (this.started || this.destroyed) {
        return;
      }
      this.started = true;
      window.addEventListener("pagehide", this.handlePageHide);
      this.domObserver.start();
      this.navigationObserver.start();
      await this.scanner.runNow();
    }
    async scan() {
      const generation = this.generation;
      if (!this.isScanCurrent(generation)) {
        return;
      }
      this.pruneInjectedUi();
      this.logger.debug("Scan started");
      await this.runAdapterHook("onBeforeProcess");
      if (!this.isScanCurrent(generation)) {
        return;
      }
      try {
        await this.processCards(generation);
      } catch (error) {
        this.logger.warn("Card scan failed", error);
      }
      if (!this.isScanCurrent(generation)) {
        return;
      }
      try {
        await this.processPage(generation);
      } catch (error) {
        this.logger.warn("Page processing failed", error);
      }
      if (this.isScanCurrent(generation)) {
        await this.runAdapterHook("onAfterProcess");
      }
    }
    isScanCurrent(generation) {
      return !this.destroyed && generation === this.generation;
    }
    async processCards(generation = this.generation) {
      if (!this.isScanCurrent(generation)) {
        return;
      }
      let cards;
      try {
        cards = Array.from(await this.adapter.getCards() ?? []);
      } catch (error) {
        this.logger.warn("Unable to get cards", error);
        return;
      }
      this.logger.debug("Cards found:", cards.length);
      for (const card of new Set(cards)) {
        try {
          if (!this.isScanCurrent(generation)) {
            return;
          }
          if (!isElement(card) || !card.isConnected) {
            continue;
          }
          const eligible = await this.adapter.shouldProcessCard(card);
          if (!this.isScanCurrent(generation)) {
            return;
          }
          const url = eligible && this.normalizeUrl(
            this.adapter.getCardUrl(card)
          );
          const previous = this.processedCards.get(card);
          if (url && card.isConnected && previous?.url === url && previous.launcher.isConnected && card.contains(previous.launcher)) {
            continue;
          }
          this.forgetCard(card);
          if (!url || !card.isConnected) {
            continue;
          }
          const mount = await this.adapter.getCardMountPoint(card);
          if (!this.isScanCurrent(generation)) {
            return;
          }
          if (!isElement(mount) || !mount.isConnected || !card.isConnected) {
            continue;
          }
          const launcher = this.createLauncher({
            url,
            element: card,
            pageType: "card"
          });
          mount.appendChild(launcher);
          card.dataset[DATASET_KEYS.processed] = "true";
          this.processedCards.set(card, { url, launcher });
          this.injectedLaunchers.add(launcher);
          this.logger.debug("Launcher injected", {
            pageType: "card",
            url
          });
        } catch (error) {
          this.logger.warn("Card processing failed", error);
        }
      }
    }
    async processPage(generation = this.generation) {
      if (!this.isScanCurrent(generation) || !this.adapter.isDetailPage()) {
        return;
      }
      this.logger.debug("Detail page detected");
      if (document.querySelector(MARKER_SELECTORS.pageLauncher)) {
        return;
      }
      const eligible = await this.adapter.shouldProcessPage();
      if (!this.isScanCurrent(generation) || !eligible) {
        return;
      }
      const mount = await this.adapter.getPageMountPoint();
      if (!this.isScanCurrent(generation) || !isElement(mount) || !mount.isConnected) {
        return;
      }
      const url = this.normalizeUrl(window.location.href);
      if (!url) {
        return;
      }
      const launcher = this.createLauncher({
        url,
        element: mount,
        pageType: "page"
      });
      launcher.dataset[DATASET_KEYS.pageLauncher] = "true";
      mount.appendChild(launcher);
      this.injectedLaunchers.add(launcher);
      this.logger.debug("Launcher injected", {
        pageType: "page",
        url
      });
    }
    scheduleScan() {
      this.scanner.schedule();
    }
    createLauncher(context) {
      let launcher;
      const actionContext = {
        ...context,
        adapter: this.adapter
      };
      const launcherOptions = this.getLauncherOptions(actionContext);
      const launcherLabel = launcherOptions.label ?? this.launcherLabel;
      launcher = this.createLauncherComponent({
        className: launcherOptions.className,
        hoverStyle: launcherOptions.hoverStyle,
        hoverStyleName: launcherOptions.hoverStyleName,
        hoverStyles: launcherOptions.hoverStyles,
        label: launcherLabel,
        placement: launcherOptions.placement ?? actionContext.pageType,
        style: launcherOptions.style,
        styleName: launcherOptions.styleName,
        styles: launcherOptions.styles,
        title: launcherOptions.title ?? `Open ${launcherLabel} actions`,
        onClick: () => {
          this.openActions({
            launcher,
            context: actionContext
          });
        }
      });
      return launcher;
    }
    getLauncherOptions(context) {
      if (typeof this.adapter.getLauncherOptions !== "function") {
        return {};
      }
      try {
        return this.adapter.getLauncherOptions(context) ?? {};
      } catch (error) {
        this.logger.warn("Launcher options failed", error);
        return {};
      }
    }
    openActions({ launcher, context }) {
      if (this.activePopupAnchor === launcher) {
        this.closeActivePopup();
        return;
      }
      this.closeActivePopup();
      const activeActions = this.actions.filter(
        (action) => action.enabled !== false
      );
      if (activeActions.length === 0) {
        return;
      }
      const items = activeActions.map(
        (action) => this.createActionItemComponent({
          action,
          context,
          onExecute: async (selectedAction, actionContext) => {
            const succeeded = await this.executeAction(
              selectedAction,
              actionContext
            );
            if (succeeded && this.activePopup === popup) {
              this.closeActivePopup();
            }
          }
        })
      );
      let popup;
      popup = this.createPopupComponent({
        anchor: launcher,
        closeOnOutside: this.popupConfig.closeOnOutside !== false,
        id: `page-breakdown-popup-${simpleHash(
          `${context.pageType}:${context.url}`
        )}`,
        items,
        onClose: () => {
          if (this.activePopup === popup) {
            this.activePopup = null;
            this.activePopupAnchor = null;
          }
        }
      });
      this.activePopup = popup;
      this.activePopupAnchor = launcher;
      popup.mount();
    }
    async executeAction(action, context) {
      try {
        if (typeof action.execute === "function") {
          await action.execute(context);
          return true;
        }
        if (typeof action.buildUrl === "function") {
          const destinationUrl = action.buildUrl(context);
          if (!destinationUrl) {
            return false;
          }
          const openedWindow = window.open(
            destinationUrl,
            "_blank",
            "noopener,noreferrer"
          );
          if (openedWindow) {
            openedWindow.opener = null;
          }
          return true;
        }
        this.logger.warn(
          `Action "${action.key}" has no executor`
        );
      } catch (error) {
        this.logger.warn(
          `Action "${action.key}" failed`,
          error
        );
      }
      return false;
    }
    normalizeUrl(url) {
      if (!url) {
        return null;
      }
      try {
        if (typeof this.adapter.normalizeUrl === "function") {
          return this.adapter.normalizeUrl(url) || null;
        }
        return new URL(url, window.location.href).href;
      } catch (error) {
        this.logger.warn("URL normalization failed", error);
        return null;
      }
    }
    closeActivePopup() {
      this.activePopup?.unmount();
      this.activePopup = null;
      this.activePopupAnchor = null;
    }
    async runAdapterHook(hookName) {
      if (typeof this.adapter[hookName] !== "function") {
        return;
      }
      try {
        await this.adapter[hookName]();
      } catch (error) {
        this.logger.warn(
          `Adapter hook "${hookName}" failed`,
          error
        );
      }
    }
    handlePageHide(event) {
      if (!event.persisted) {
        this.destroy();
      }
    }
    destroy() {
      if (this.destroyed) {
        return;
      }
      this.started = false;
      this.destroyed = true;
      window.removeEventListener("pagehide", this.handlePageHide);
      this.domObserver.destroy();
      this.navigationObserver.destroy();
      this.scanner.destroy();
      this.closeActivePopup();
      this.resetInjectedUi();
      if (typeof this.adapter.cleanup === "function") {
        Promise.resolve().then(() => this.adapter.cleanup()).catch((error) => {
          this.logger.warn("Adapter cleanup failed", error);
        });
      }
    }
    resetInjectedUi() {
      this.generation += 1;
      for (const launcher of this.injectedLaunchers) {
        launcher.remove();
      }
      for (const card of this.processedCards.keys()) {
        delete card.dataset[DATASET_KEYS.processed];
      }
      this.injectedLaunchers.clear();
      this.processedCards.clear();
    }
    forgetCard(card) {
      const previous = this.processedCards.get(card);
      if (previous) {
        if (this.activePopupAnchor === previous.launcher) {
          this.closeActivePopup();
        }
        previous.launcher.remove();
        this.injectedLaunchers.delete(previous.launcher);
        this.processedCards.delete(card);
      }
      delete card.dataset[DATASET_KEYS.processed];
    }
    pruneInjectedUi() {
      for (const [card, { launcher }] of this.processedCards) {
        if (!card.isConnected || !launcher.isConnected || !card.contains(launcher)) {
          this.forgetCard(card);
        }
      }
      for (const launcher of this.injectedLaunchers) {
        if (!launcher.isConnected) {
          this.injectedLaunchers.delete(launcher);
        }
      }
      if (this.activePopupAnchor && !this.activePopupAnchor.isConnected) {
        this.closeActivePopup();
      }
    }
  };
  var PageBreakdownEngine_default = PageBreakdownEngine;

  // src/main.js
  async function bootstrap() {
    "use strict";
    const logger = createLogger(CONFIG.debug);
    const adapter = await resolveAdapter({ logger });
    if (!adapter) {
      return;
    }
    window[ENGINE_INSTANCE_KEY]?.destroy?.();
    const engine = new PageBreakdownEngine_default({
      adapter,
      actions: getActiveActions(),
      logger,
      popup: CONFIG.popup,
      scanDelay: CONFIG.scanDelay
    });
    window[ENGINE_INSTANCE_KEY] = engine;
    try {
      await engine.start();
    } catch (error) {
      logger.error("Engine startup failed", error);
      engine.destroy();
      if (window[ENGINE_INSTANCE_KEY] === engine) {
        delete window[ENGINE_INSTANCE_KEY];
      }
    }
  }
  void bootstrap();
})();
