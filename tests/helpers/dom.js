// Minimal DOM fixture for engine and menu behavior; no external test dependencies.
export class ElementFixture extends EventTarget {
    constructor() {
        super();
        this.dataset = {};
        this.style = {};
        this.attributes = new Map();
        this.children = [];
        this.parentElement = null;
        this.disabled = false;
    }
    get isConnected() {
        return this === document.body || Boolean(this.parentElement?.isConnected);
    }
    appendChild(child) {
        child.remove();
        this.children.push(child);
        child.parentElement = this;
        return child;
    }
    remove() {
        if (this.parentElement) {
            this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
            this.parentElement = null;
        }
    }
    replaceChildren(...children) {
        for (const child of [...this.children]) child.remove();
        for (const child of children) this.appendChild(child);
    }
    contains(target) {
        return target === this || this.children.some((child) => child.contains(target));
    }
    querySelector(selector) {
        const key = selector.includes('page-launcher') ? 'pageBreakdownPageLauncher' : 'pageBreakdownLauncher';
        for (const child of this.children) {
            if (child.dataset[key]) return child;
            const nested = child.querySelector(selector);
            if (nested) return nested;
        }
        return null;
    }
    setAttribute(key, value) { this.attributes.set(key, value); }
    getAttribute(key) { return this.attributes.get(key) ?? null; }
    removeAttribute(key) { this.attributes.delete(key); }
    focus() { document.activeElement = this; }
    getBoundingClientRect() { return { left: 20, bottom: 40 }; }
}

const globalNames = ['window', 'document', 'Element', 'MutationObserver'];
let originalGlobals;
let cleanups;

export function setupDom() {
    originalGlobals = new Map(globalNames.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    cleanups = [];
    globalThis.window = Object.assign(new EventTarget(), {
        location: new URL('https://www.nytimes.com/'), innerWidth: 1024, innerHeight: 768
    });
    globalThis.document = Object.assign(new EventTarget(), {
        body: new ElementFixture(),
        createElement: () => new ElementFixture(),
        querySelector(selector) { return this.body.querySelector(selector); }
    });
    document.documentElement = document.body;
    globalThis.Element = ElementFixture;
}

// Register fixture resources so failed assertions still release timers/listeners.
export function registerCleanup(cleanup) {
    cleanups.push(cleanup);
}

export function cleanupDom() {
    try {
        for (const cleanup of cleanups.reverse()) cleanup();
    } finally {
        for (const [name, descriptor] of originalGlobals) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
        cleanups = [];
    }
}
