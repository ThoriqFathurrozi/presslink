import {
    findArticleLink,
    isCurrentArticleUrl,
    safeQuery,
    safeQueryAll,
    setRelativePosition
} from '../core/utils.js';

const EXCLUDED_NEWS_PATHS = ['/about', '/account', '/subscription', '/lists'];

export function matchesSite(domain, siteIdentifier) {
    const hostname = window.location.hostname;
    return hostname === domain || hostname.endsWith(`.${domain}`) ||
        Boolean(safeQuery(siteIdentifier));
}

export function matchesArticlePath(pathname, pattern, prefixes) {
    return pattern.test(pathname) || prefixes.some((prefix) => pathname.startsWith(prefix));
}

export function isExcludedNewsPath(pathname) {
    return EXCLUDED_NEWS_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export function getCardsFromLinks(articleLinkSelector, cardSelector) {
    // Preserve link order and duplicates; the engine handles deduplication.
    return safeQueryAll(articleLinkSelector)
        .map((link) => link.closest(cardSelector))
        .filter(Boolean);
}

export function getArticleCardUrl(card, articleLinkSelector, matchesPath) {
    const links = safeQueryAll(articleLinkSelector, card);
    return findArticleLink(links, matchesPath)?.href ?? null;
}

export function isOtherArticleUrl(url) {
    return Boolean(url && !isCurrentArticleUrl(url));
}

export function hasArticleHeading(isDetailPage, headingSelector) {
    return Boolean(isDetailPage && safeQuery(headingSelector));
}

export function getRelativePageMount(pageSelector, headingSelector) {
    const headingParent = headingSelector
        ? safeQuery(headingSelector)?.parentElement
        : null;
    const mount = headingParent ?? safeQuery(pageSelector);
    if (mount) {
        setRelativePosition(mount);
    }
    return mount;
}

export function createSiteLauncherOptions(siteName, pageType, style = pageType) {
    return {
        className: `pressora-${siteName}-launcher pressora-${siteName}-launcher--${pageType}`,
        style
    };
}
