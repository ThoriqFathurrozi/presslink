import { BaseAdapter } from './BaseAdapter.js';
import {
    normalizeArticleUrl,
    safeQuery,
    safeQueryAll,
    setRelativePosition
} from '../core/utils.js';
import {
    createSiteLauncherOptions,
    getRelativePageMount,
    matchesSite
} from './utils.js';

function hasStoryId(pathname) {
    return /[0-9a-f]{12}(?:$|[/?#])/i.test(pathname);
}

function getStoryId(value) {
    try {
        const url = new URL(value, window.location.href);

        return (
            url.pathname.match(/[0-9a-f]{12}/i)?.[0]
                .toLowerCase() ?? null
        );
    } catch {
        return null;
    }
}

function getComparableUrl(value) {
    try {
        const url = new URL(value, window.location.href);
        const pathname =
            url.pathname.length > 1
                ? url.pathname.replace(/\/$/, '')
                : url.pathname;

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
        '/about',
        '/explore',
        '/followers',
        '/following',
        '/lists',
        '/m/signin',
        '/m/signout',
        '/me/',
        '/membership',
        '/new-story',
        '/plans',
        '/search',
        '/tag/'
    ].some((path) => pathname.startsWith(path));
}

function isProbablyArticleUrl(href) {
    try {
        const url = new URL(href, window.location.href);

        if (!['http:', 'https:'].includes(url.protocol)) {
            return false;
        }

        if (isExcludedPath(url.pathname)) {
            return false;
        }

        return (
            hasStoryId(url.pathname) ||
            url.pathname.startsWith('/p/') ||
            url.pathname.split('/').filter(Boolean).length >= 2
        );
    } catch {
        return false;
    }
}

function findBestArticleLink(links) {
    const usableLinks = links.filter((link) =>
        isProbablyArticleUrl(link.href)
    );

    return (
        usableLinks.find((link) =>
            Boolean(safeQuery('h2, h3', link))
        ) ??
        usableLinks.find((link) =>
            hasStoryId(new URL(link.href, window.location.href).pathname)
        ) ??
        usableLinks.find((link) =>
            link.textContent.trim().length > 20
        ) ??
        usableLinks[0] ??
        null
    );
}

class MediumAdapter extends BaseAdapter {
    name = 'medium';

    selectors = {
        siteIdentifier:
            'head meta[content="Medium"], meta[property="og:site_name"][content="Medium"]',
        card: 'article',
        articleLink: 'a[data-discover="true"], a[href]',
        memberOnly:
            'button[aria-label="Member-only story"], [aria-label="Member-only story"]',
        heading: 'h1',
        pageMount: 'main article, article, main'
    };

    async match() {
        return matchesSite('medium.com', this.selectors.siteIdentifier);
    }

    isDetailPage() {
        const pathname = window.location.pathname;

        return (
            !isExcludedPath(pathname) &&
            (
                hasStoryId(pathname) ||
                /^\/p\/[0-9a-f]+/i.test(pathname)
            )
        );
    }

    async getCards() {
        const cards = safeQueryAll(this.selectors.card);

        if (!this.isDetailPage()) {
            return cards;
        }

        return cards.filter((card) =>
            this.isDetailRecommendationCard(card)
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
            safeQuery(this.selectors.memberOnly, card) &&
            url &&
            !isCurrentStoryUrl(url)
        );
    }

    async shouldProcessPage() {
        return Boolean(
            this.isDetailPage() &&
            safeQuery(this.selectors.heading) &&
            (
                safeQuery(this.selectors.memberOnly) ||
                hasStoryId(window.location.pathname)
            )
        );
    }

    async getPageMountPoint() {
        return getRelativePageMount(this.selectors.pageMount, this.selectors.heading);
    }

    getCardMountPoint(card) {
        return setRelativePosition(card);
    }

    getLauncherOptions({ pageType }) {
        return createSiteLauncherOptions('medium', pageType, {
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

        return !(
            heading &&
            card.contains(heading)
        );
    }

    normalizeUrl(url) {
        return normalizeArticleUrl(url);
    }
}

export default new MediumAdapter();
