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

function hasWaPosNews(pathname) {
    const newsPattern = /(?<=\/)\d{4}\/\d{2}\/\d{2}(?=\/)/
    const paths = [
        '/athletic',
    ]
    return matchesArticlePath(pathname, newsPattern, paths);
}

class WaPosAdapter extends BaseAdapter {
    name = 'wapos';

    selectors = {
        siteIdentifier:
            'head meta[content="@WashingtonPost"]',
        articleLink: 'a[data-pb-local-content-field="web_headline"]',
        cardMount: 'div[class*="card"]',
        pageMount: 'main',
        heading: 'h1'
    };

    async match() {
        return matchesSite('washingtonpost.com', this.selectors.siteIdentifier);
    }

    isDetailPage() {
        const pathname = window.location.pathname;

        return (
            !isExcludedNewsPath(pathname) &&
            (
                hasWaPosNews(pathname)
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
        return createSiteLauncherOptions('wapos', pageType);
    }

    normalizeUrl(url) {
        return normalizeArticleUrl(url);
    }
}

export default new WaPosAdapter();
