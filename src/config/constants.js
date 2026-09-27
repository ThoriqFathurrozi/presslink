export const CONFIG = Object.freeze({
    debug: false,
    scanDelay: 150,
    launcherLabel: 'Pressora',
    popup: Object.freeze({
        closeOnOutside: true
    })
});

export const DATASET_KEYS = Object.freeze({
    processed: 'pageBreakdownProcessed',
    launcher: 'pageBreakdownLauncher',
    pageLauncher: 'pageBreakdownPageLauncher'
});

export const MARKER_SELECTORS = Object.freeze({
    launcher: '[data-page-breakdown-launcher]',
    pageLauncher: '[data-page-breakdown-page-launcher]'
});

export const NAVIGATION_EVENT = 'userscript:navigation';
export const HISTORY_PATCH_FLAG = '__PAGE_BREAKDOWN_HISTORY_PATCHED__';
export const ENGINE_INSTANCE_KEY = '__PAGE_BREAKDOWN_ENGINE__';
