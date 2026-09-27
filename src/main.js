import { getActiveActions } from './actions/registry.js';
import { resolveAdapter } from './adapters/registry.js';
import {
    CONFIG,
    ENGINE_INSTANCE_KEY
} from './config/constants.js';
import PageBreakdownEngine from './core/PageBreakdownEngine.js';
import { createLogger } from './core/utils.js';

async function bootstrap() {
    'use strict';

    const logger = createLogger(CONFIG.debug);
    const adapter = await resolveAdapter({ logger });

    if (!adapter) {
        return;
    }

    window[ENGINE_INSTANCE_KEY]?.destroy?.();

    const engine = new PageBreakdownEngine({
        adapter,
        actions: getActiveActions(),
        logger,
        popup: CONFIG.popup,
        scanDelay: CONFIG.scanDelay
    });

    window[ENGINE_INSTANCE_KEY] = engine;

    try {
        await engine.start();
    } catch (error) {
        logger.error('Engine startup failed', error);
        engine.destroy();

        if (window[ENGINE_INSTANCE_KEY] === engine) {
            delete window[ENGINE_INSTANCE_KEY];
        }
    }
}

void bootstrap();
