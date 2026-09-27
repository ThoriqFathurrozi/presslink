export class BaseAdapter {
    name = 'base';

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
}

export default BaseAdapter;
