import {
    CONFIG,
    DATASET_KEYS,
    MARKER_SELECTORS
} from '../config/constants.js';
import DomObserver from './DomObserver.js';
import NavigationObserver from './NavigationObserver.js';
import Scanner from './Scanner.js';
import {
    createLogger,
    isElement,
    simpleHash
} from './utils.js';
import createLauncherComponent from '../ui/createLauncher.js';
import createPopupComponent from '../ui/createPopup.js';
import createActionItemComponent from '../ui/createActionItem.js';

export class PageBreakdownEngine {
    constructor({
        adapter,
        actions = [],
        scanDelay = CONFIG.scanDelay,
        launcherLabel = CONFIG.launcherLabel,
        popup = CONFIG.popup,
        logger = createLogger(CONFIG.debug),
        createLauncher = createLauncherComponent,
        createPopup = createPopupComponent,
        createActionItem = createActionItemComponent
    }) {
        this.adapter = adapter;
        this.actions = actions;
        this.launcherLabel = launcherLabel;
        this.popupConfig = popup;
        this.logger = logger;
        this.createLauncherComponent = createLauncher;
        this.createPopupComponent = createPopup;
        this.createActionItemComponent = createActionItem;
        this.activePopup = null;
        this.activePopupAnchor = null;
        this.injectedLaunchers = new Set();
        this.processedCards = new Map();
        this.started = false;
        this.destroyed = false;
        this.generation = 0;

        this.scanner = new Scanner({
            delay: scanDelay,
            logger,
            onScan: () => this.scan()
        });

        this.domObserver = new DomObserver({
            logger,
            onMutation: () => this.scheduleScan()
        });

        this.navigationObserver = new NavigationObserver({
            logger,
            onNavigate: () => {
                this.closeActivePopup();
                this.resetInjectedUi();
                this.scheduleScan();
            }
        });

        this.handlePageHide = this.handlePageHide.bind(this);
    }

    async start() {
        if (this.started || this.destroyed) {
            return;
        }

        this.started = true;
        window.addEventListener('pagehide', this.handlePageHide);
        this.domObserver.start();
        this.navigationObserver.start();
        await this.scanner.runNow();
    }

    async scan() {
        const generation = this.generation;
        if (!this.isScanCurrent(generation)) {
            return;
        }

        this.pruneInjectedUi();
        this.logger.debug('Scan started');

        await this.runAdapterHook('onBeforeProcess');
        if (!this.isScanCurrent(generation)) {
            return;
        }

        try {
            await this.processCards(generation);
        } catch (error) {
            this.logger.warn('Card scan failed', error);
        }

        if (!this.isScanCurrent(generation)) {
            return;
        }

        try {
            await this.processPage(generation);
        } catch (error) {
            this.logger.warn('Page processing failed', error);
        }

        if (this.isScanCurrent(generation)) {
            await this.runAdapterHook('onAfterProcess');
        }
    }

    isScanCurrent(generation) {
        return !this.destroyed && generation === this.generation;
    }

    async processCards(generation = this.generation) {
        if (!this.isScanCurrent(generation)) {
            return;
        }
        let cards;

        try {
            cards = Array.from(await this.adapter.getCards() ?? []);
        } catch (error) {
            this.logger.warn('Unable to get cards', error);
            return;
        }

        this.logger.debug('Cards found:', cards.length);

        for (const card of new Set(cards)) {
            try {
                if (!this.isScanCurrent(generation)) {
                    return;
                }

                if (!isElement(card) || !card.isConnected) {
                    continue;
                }

                const eligible =
                    await this.adapter.shouldProcessCard(card);

                if (!this.isScanCurrent(generation)) {
                    return;
                }

                const url = eligible && this.normalizeUrl(
                    this.adapter.getCardUrl(card)
                );
                const previous = this.processedCards.get(card);

                if (url && card.isConnected && previous?.url === url &&
                    previous.launcher.isConnected && card.contains(previous.launcher)) {
                    continue;
                }

                this.forgetCard(card);

                if (!url || !card.isConnected) {
                    continue;
                }

                const mount =
                    await this.adapter.getCardMountPoint(card);

                if (!this.isScanCurrent(generation)) {
                    return;
                }

                if (!isElement(mount) || !mount.isConnected || !card.isConnected) {
                    continue;
                }

                const launcher = this.createLauncher({
                    url,
                    element: card,
                    pageType: 'card'
                });

                mount.appendChild(launcher);
                card.dataset[DATASET_KEYS.processed] = 'true';
                this.processedCards.set(card, { url, launcher });
                this.injectedLaunchers.add(launcher);
                this.logger.debug('Launcher injected', {
                    pageType: 'card',
                    url
                });
            } catch (error) {
                this.logger.warn('Card processing failed', error);
            }
        }
    }

    async processPage(generation = this.generation) {
        if (!this.isScanCurrent(generation) || !this.adapter.isDetailPage()) {
            return;
        }

        this.logger.debug('Detail page detected');

        if (document.querySelector(MARKER_SELECTORS.pageLauncher)) {
            return;
        }

        const eligible = await this.adapter.shouldProcessPage();

        if (!this.isScanCurrent(generation) || !eligible) {
            return;
        }

        const mount = await this.adapter.getPageMountPoint();

        if (!this.isScanCurrent(generation) || !isElement(mount) || !mount.isConnected) {
            return;
        }

        const url = this.normalizeUrl(window.location.href);

        if (!url) {
            return;
        }

        const launcher = this.createLauncher({
            url,
            element: mount,
            pageType: 'page'
        });

        launcher.dataset[DATASET_KEYS.pageLauncher] = 'true';
        mount.appendChild(launcher);
        this.injectedLaunchers.add(launcher);
        this.logger.debug('Launcher injected', {
            pageType: 'page',
            url
        });
    }

    scheduleScan() {
        this.scanner.schedule();
    }

    createLauncher(context) {
        let launcher;
        const actionContext = {
            ...context,
            adapter: this.adapter
        };
        const launcherOptions =
            this.getLauncherOptions(actionContext);
        const launcherLabel =
            launcherOptions.label ?? this.launcherLabel;

        launcher = this.createLauncherComponent({
            className: launcherOptions.className,
            hoverStyle: launcherOptions.hoverStyle,
            hoverStyleName: launcherOptions.hoverStyleName,
            hoverStyles: launcherOptions.hoverStyles,
            label: launcherLabel,
            placement:
                launcherOptions.placement ?? actionContext.pageType,
            style: launcherOptions.style,
            styleName: launcherOptions.styleName,
            styles: launcherOptions.styles,
            title:
                launcherOptions.title ??
                `Open ${launcherLabel} actions`,
            onClick: () => {
                this.openActions({
                    launcher,
                    context: actionContext
                });
            }
        });

        return launcher;
    }

    getLauncherOptions(context) {
        if (typeof this.adapter.getLauncherOptions !== 'function') {
            return {};
        }

        try {
            return this.adapter.getLauncherOptions(context) ?? {};
        } catch (error) {
            this.logger.warn('Launcher options failed', error);
            return {};
        }
    }

    openActions({ launcher, context }) {
        if (this.activePopupAnchor === launcher) {
            this.closeActivePopup();
            return;
        }

        this.closeActivePopup();

        const activeActions = this.actions.filter(
            (action) => action.enabled !== false
        );

        if (activeActions.length === 0) {
            return;
        }

        const items = activeActions.map((action) =>
            this.createActionItemComponent({
                action,
                context,
                onExecute: async (selectedAction, actionContext) => {
                    const succeeded = await this.executeAction(
                        selectedAction,
                        actionContext
                    );

                    if (succeeded && this.activePopup === popup) {
                        this.closeActivePopup();
                    }
                }
            })
        );

        let popup;

        popup = this.createPopupComponent({
            anchor: launcher,
            closeOnOutside:
                this.popupConfig.closeOnOutside !== false,
            id: `page-breakdown-popup-${simpleHash(
                `${context.pageType}:${context.url}`
            )}`,
            items,
            onClose: () => {
                if (this.activePopup === popup) {
                    this.activePopup = null;
                    this.activePopupAnchor = null;
                }
            }
        });

        this.activePopup = popup;
        this.activePopupAnchor = launcher;
        popup.mount();
    }

    async executeAction(action, context) {
        try {
            if (typeof action.execute === 'function') {
                await action.execute(context);
                return true;
            }

            if (typeof action.buildUrl === 'function') {
                const destinationUrl = action.buildUrl(context);

                if (!destinationUrl) {
                    return false;
                }

                const openedWindow = window.open(
                    destinationUrl,
                    '_blank',
                    'noopener,noreferrer'
                );

                if (openedWindow) {
                    openedWindow.opener = null;
                }

                return true;
            }

            this.logger.warn(
                `Action "${action.key}" has no executor`
            );
        } catch (error) {
            this.logger.warn(
                `Action "${action.key}" failed`,
                error
            );
        }

        return false;
    }

    normalizeUrl(url) {
        if (!url) {
            return null;
        }

        try {
            if (typeof this.adapter.normalizeUrl === 'function') {
                return this.adapter.normalizeUrl(url) || null;
            }

            return new URL(url, window.location.href).href;
        } catch (error) {
            this.logger.warn('URL normalization failed', error);
            return null;
        }
    }

    closeActivePopup() {
        this.activePopup?.unmount();
        this.activePopup = null;
        this.activePopupAnchor = null;
    }

    async runAdapterHook(hookName) {
        if (typeof this.adapter[hookName] !== 'function') {
            return;
        }

        try {
            await this.adapter[hookName]();
        } catch (error) {
            this.logger.warn(
                `Adapter hook "${hookName}" failed`,
                error
            );
        }
    }

    handlePageHide(event) {
        if (!event.persisted) {
            this.destroy();
        }
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.started = false;
        this.destroyed = true;
        window.removeEventListener('pagehide', this.handlePageHide);
        this.domObserver.destroy();
        this.navigationObserver.destroy();
        this.scanner.destroy();
        this.closeActivePopup();
        this.resetInjectedUi();

        if (typeof this.adapter.cleanup === 'function') {
            Promise.resolve().then(() => this.adapter.cleanup()).catch((error) => {
                this.logger.warn('Adapter cleanup failed', error);
            });
        }
    }

    resetInjectedUi() {
        this.generation += 1;
        for (const launcher of this.injectedLaunchers) {
            launcher.remove();
        }

        for (const card of this.processedCards.keys()) {
            delete card.dataset[DATASET_KEYS.processed];
        }

        this.injectedLaunchers.clear();
        this.processedCards.clear();
    }

    forgetCard(card) {
        const previous = this.processedCards.get(card);
        if (previous) {
            if (this.activePopupAnchor === previous.launcher) {
                this.closeActivePopup();
            }
            previous.launcher.remove();
            this.injectedLaunchers.delete(previous.launcher);
            this.processedCards.delete(card);
        }
        delete card.dataset[DATASET_KEYS.processed];
    }

    pruneInjectedUi() {
        for (const [card, { launcher }] of this.processedCards) {
            if (!card.isConnected || !launcher.isConnected || !card.contains(launcher)) {
                this.forgetCard(card);
            }
        }
        for (const launcher of this.injectedLaunchers) {
            if (!launcher.isConnected) {
                this.injectedLaunchers.delete(launcher);
            }
        }
        if (this.activePopupAnchor && !this.activePopupAnchor.isConnected) {
            this.closeActivePopup();
        }
    }
}

export default PageBreakdownEngine;
