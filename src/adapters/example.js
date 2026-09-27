import { BaseAdapter } from './BaseAdapter.js';
import {
    safeQuery,
    safeQueryAll
} from '../core/utils.js';

class ExampleAdapter extends BaseAdapter {
    name = 'example';

    selectors = {
        card: '.article-card',
        link: 'a[href]',
        targetIndicator: '.target-indicator',
        pageMount: 'main'
    };

    async match() {
        return window.location.hostname === 'example.com';
    }

    isDetailPage() {
        return window.location.pathname.startsWith('/article/');
    }

    async getCards() {
        return safeQueryAll(this.selectors.card);
    }

    getCardUrl(card) {
        return safeQuery(this.selectors.link, card)?.href ?? null;
    }

    async shouldProcessCard(card) {
        return Boolean(safeQuery(this.selectors.targetIndicator, card));
    }

    async shouldProcessPage() {
        return Boolean(safeQuery(this.selectors.targetIndicator));
    }

    async getPageMountPoint() {
        return safeQuery(this.selectors.pageMount);
    }

    getLauncherOptions({ pageType }) {
        return {
            className:
                `pressora-example-launcher pressora-example-launcher--${pageType}`,
            style: {
                background: '#2563eb',
                borderRadius: pageType === 'page' ? '10px' : '6px'
            },
            hoverStyle: {
                background: '#1d4ed8'
            }
        };
    }
}

export default new ExampleAdapter();
