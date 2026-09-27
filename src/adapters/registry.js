import { CONFIG } from '../config/constants.js';
import { createLogger } from '../core/utils.js';
import MediumAdapter from './medium.js';
import NYTAdapter from './nyt.js';
import WaPosAdapter from './wapos.js';
import BloombergAdapter from './bloomberg.js';
import ReutersAdapter from './reuters.js';

export const ADAPTERS = [
    NYTAdapter,
    MediumAdapter,
    WaPosAdapter,
    BloombergAdapter,
    ReutersAdapter
];

export async function resolveAdapter({
    logger = createLogger(CONFIG.debug)
} = {}) {
    for (const adapter of ADAPTERS) {
        try {
            if (await adapter.match()) {
                logger.debug('Adapter detected:', adapter.name);
                return adapter;
            }
        } catch (error) {
            logger.warn(
                `adapter "${adapter.name}" failed`,
                error
            );
        }
    }

    return null;
}
