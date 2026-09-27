import Engine from '../../src/core/PageBreakdownEngine.js';
import { ElementFixture, registerCleanup } from './dom.js';

const logger = { debug() {}, warn() {}, error() {} };

export function setupEngine(overrides = {}) {
    const card = document.body.appendChild(new ElementFixture());
    card.url = '/first';
    card.eligible = true;
    const adapter = {
        getCards: () => [card, card],
        shouldProcessCard: (element) => element.eligible,
        getCardUrl: (element) => element.url,
        getCardMountPoint: (element) => element,
        isDetailPage: () => false,
        ...overrides
    };
    const engine = new Engine({
        adapter, logger,
        createLauncher: ({ onClick }) => {
            const launcher = new ElementFixture();
            launcher.dataset.pageBreakdownLauncher = 'true';
            launcher.click = onClick;
            return launcher;
        }
    });
    registerCleanup(() => engine.destroy());
    return { engine, card, adapter };
}
