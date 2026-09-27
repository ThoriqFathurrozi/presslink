export class DomObserver {
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
            attributeFilter: ['href', 'aria-label']
        });

        this.logger?.debug('DOM observer started');
    }

    destroy() {
        this.observer?.disconnect();
        this.observer = null;
    }
}

export default DomObserver;
