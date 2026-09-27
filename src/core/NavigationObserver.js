import {
    HISTORY_PATCH_FLAG,
    NAVIGATION_EVENT
} from '../config/constants.js';

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

    for (const methodName of ['pushState', 'replaceState']) {
        const originalMethod = history[methodName];

        history[methodName] = function (...args) {
            const result = originalMethod.apply(this, args);
            dispatchNavigation();
            return result;
        };
    }

    window[HISTORY_PATCH_FLAG] = true;
    logger?.debug('History API patched');
}

export class NavigationObserver {
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
        window.addEventListener('popstate', this.handlePopState);
        this.started = true;
    }

    handlePopState() {
        dispatchNavigation();
    }

    handleNavigation(event) {
        this.logger?.debug(
            'Navigation detected',
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
        window.removeEventListener('popstate', this.handlePopState);
        this.started = false;
    }
}

export default NavigationObserver;
