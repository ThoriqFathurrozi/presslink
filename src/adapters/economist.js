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

function hasEconomistNews(pathname) {
    const newsPattern = /\d{4}-\d{2}-\d{2}(?=\/?$)/
    const paths = [
        '/news',
    ]
    return matchesArticlePath(pathname, newsPattern, paths);
}

class EconomistAdapter extends BaseAdapter {
    name = 'economist';

    selectors = {
        siteIdentifier:
            'head meta[property="og:site_name"][content="The Economist"]',
        articleLink: 'a[data-testid="TitleLink"]',
        cardMount: 'li, div[data-testid="common/single-section-blockStoryCard"],div[data-testid="VisualStoryContainer"]',
        pageMount: 'main,#fusion-app',
        heading: 'h1'
    };

    async match() {
        return matchesSite('economist.com', this.selectors.siteIdentifier);
    }

    isDetailPage() {
        const pathname = window.location.pathname;

        return (
            !isExcludedNewsPath(pathname) &&
            (
                hasEconomistNews(pathname)
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
        return getArticleCardUrl(card, this.selectors.articleLink, hasEconomistNews);
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
        return createSiteLauncherOptions('economist', pageType, {
            name: pageType,
            zIndex: 100
        });
    }

    normalizeUrl(url) {
        return normalizeArticleUrl(url);
    }
}

export default new EconomistAdapter();
