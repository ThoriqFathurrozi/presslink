export function isElement(value) {
    return (
        typeof Element !== 'undefined' &&
        value instanceof Element
    );
}

export function isCurrentArticleUrl(value) {
    if (!value) {
        return false;
    }

    const comparable = (input) => {
        const url = new URL(input, window.location.href);
        return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
    };

    try {
        return comparable(value) === comparable(window.location.href);
    } catch {
        return false;
    }
}

export function safeQuery(selector, root = document) {
    try {
        return root?.querySelector?.(selector) ?? null;
    } catch {
        return null;
    }
}

export function safeQueryAll(selector, root = document) {
    try {
        return Array.from(
            root?.querySelectorAll?.(selector) ?? []
        );
    } catch {
        return [];
    }
}

export function simpleHash(value) {
    const input = String(value ?? '');
    let hash = 5381;

    for (let index = 0; index < input.length; index += 1) {
        hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
    }

    return (hash >>> 0).toString(36);
}

// Keep the first HTTP(S) link accepted by the site's article path rule.
export function findArticleLink(links, matchesPath) {
    return links.find((link) => {
        try {
            const url = new URL(link.href, window.location.href);
            return ['http:', 'https:'].includes(url.protocol) && matchesPath(url.pathname);
        } catch {
            return false;
        }
    }) ?? null;
}

export function normalizeArticleUrl(url) {
    try {
        const normalized = new URL(url, window.location.href);
        normalized.hash = '';
        return normalized.href;
    } catch {
        return url;
    }
}

export function setRelativePosition(element) {
    Object.assign(element.style, { position: 'relative' });
    return element;
}

export function createLogger(debug = false) {
    const prefix = '[PageBreakdown]';

    return {
        debug(...args) {
            if (debug) {
                console.debug(prefix, ...args);
            }
        },

        warn(...args) {
            console.warn(prefix, ...args);
        },

        error(...args) {
            console.error(prefix, ...args);
        }
    };
}
