import { BaseAdapter } from './BaseAdapter.js';
import {
    normalizeArticleUrl,
    setRelativePosition
} from '../core/utils.js';
import {
    createSiteLauncherOptions,
    getArticleCardUrl,
    getCardsFromLinks,
    getRelativePageMount,
    hasArticleHeading,
    isExcludedNewsPath,
    isOtherArticleUrl,
    matchesArticlePath,
    matchesSite
} from './utils.js';

function hasBloombergNews(pathname) {
    const newsPattern = /(?<=\/)\d{4}-\d{2}-\d{2}(?=\/)/
    const paths = [
        '/features',
        '/news',
    ]

    return matchesArticlePath(pathname, newsPattern, paths);
}

class BloombergAdapter extends BaseAdapter {
    name = 'bloomberg';

    selectors = {
        siteIdentifier:
            'head meta[property="og:site_name"][content="Bloomberg.com"]',
        articleLink: 'a[href]',
        cardMount: 'div',
        pageMount: 'body, #__next',
        heading: 'h1'
    };

    async match() {
        return matchesSite('bloomberg.com', this.selectors.siteIdentifier);
    }

    isDetailPage() {
        const pathname = window.location.pathname;

        return (
            !isExcludedNewsPath(pathname) &&
            (
                hasBloombergNews(pathname)
            )
        );
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
        return createSiteLauncherOptions('bloomberg', pageType);
    }

    normalizeUrl(url) {
        return normalizeArticleUrl(url);
    }
}

export default new BloombergAdapter();
