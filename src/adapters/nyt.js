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

function hasNYTNews(pathname) {
    const newsPattern = /^\/\d{4}\/\d{2}\/\d{2}\//;
    const paths = [
        '/athletic',
    ]
    return matchesArticlePath(pathname, newsPattern, paths);
}

class NYTAdapter extends BaseAdapter {
    name = 'nyt';

    selectors = {
        siteIdentifier:
            'head meta[content="@nytimes"]',
        articleLink: 'a[data-tpl="l"],a[href^="/"]',
        cardMount: 'div[data-tpl="sli"], div[data-tpl="lb"], section[class="story-wrapper"], article',
        pageMount: 'div[id="app"],main',
        heading: 'h1'
    };

    async match() {
        return matchesSite('nytimes.com', this.selectors.siteIdentifier);
    }

    isDetailPage() {
        const pathname = window.location.pathname;

        return (
            !isExcludedNewsPath(pathname) &&
            (
                hasNYTNews(pathname)
            )
        );
    }

    async getCards() {
        const cards = getCardsFromLinks(
            this.selectors.articleLink,
            this.selectors.cardMount
        );

        const subsCards = cards.filter((card) => {
            let sectionData = card.closest('div[class="isPersonalizedAddOn"]')?.dataset?.pers
            if (sectionData) {
                try {
                    sectionData = JSON.parse(sectionData)
                } catch (error) {
                    console.error('Failed to parse sectionData:', error)
                }
            }
            if (sectionData && sectionData.surface === 'home-packages-always-free') {
                return false;
            }
            return true;
        })

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
        return createSiteLauncherOptions('nyt', pageType);
    }

    normalizeUrl(url) {
        return normalizeArticleUrl(url);
    }
}

export default new NYTAdapter();
