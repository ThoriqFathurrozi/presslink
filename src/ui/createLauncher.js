import { DATASET_KEYS } from '../config/constants.js';

const DEFAULT_STYLE = {
    alignItems: 'center',
    background: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '999px',
    boxShadow: '0 6px 18px rgba(17, 24, 39, 0.18)',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'inline-flex',
    font: '600 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    gap: '6px',
    justifyContent: 'center',
    letterSpacing: '0.01em',
    padding: '7px 11px',
    position: 'absolute',
    right: '5px',
    textDecoration: 'none',
    top: '5px',
    transform: 'translateY(0)',
    transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
    zIndex: '2147483646'
};

const DEFAULT_HOVER_STYLE = {
    boxShadow: '0 8px 22px rgba(17, 24, 39, 0.22)',
    transform: 'translateY(-1px)'
};

const NAMED_STYLES = Object.freeze({
    card: Object.freeze({
        background: '#1a8917',
        borderColor: 'rgba(255, 255, 255, 0.24)'
    }),
    default: Object.freeze({}),
    page: Object.freeze({
        background: '#111827',
        borderColor: 'rgba(255, 255, 255, 0.18)'
    })
});

const NAMED_HOVER_STYLES = Object.freeze({
    card: Object.freeze({
        background: '#156d12'
    }),
    default: Object.freeze({}),
    page: Object.freeze({
        background: '#030712'
    })
});

const STYLE_CONFIG_KEYS = new Set([
    'default',
    'defaults',
    'name',
    'overrides',
    'style',
    'styleName',
    'styles'
]);

function isStyleObject(value) {
    return Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
    );
}

function getObjectStyle(value) {
    return isStyleObject(value) ? value : {};
}

function getStyleName(config, fallbackName) {
    if (typeof config === 'string') {
        return config;
    }

    if (!isStyleObject(config)) {
        return fallbackName;
    }

    return config.name ?? config.styleName ?? fallbackName;
}

function getStyleOverrides(config) {
    const overrides = {};

    if (!isStyleObject(config)) {
        return overrides;
    }

    for (const [property, value] of Object.entries(config)) {
        if (
            STYLE_CONFIG_KEYS.has(property) ||
            isStyleObject(value)
        ) {
            continue;
        }

        overrides[property] = value;
    }

    return overrides;
}

function resolveStyleConfig({
    builtInStyles,
    config,
    name,
    styles
}) {
    const styleName = getStyleName(config, name);
    const configObject = getObjectStyle(config);
    const configStyles = getObjectStyle(configObject.styles);
    const fallbackStyles = getObjectStyle(styles);

    return {
        ...getObjectStyle(builtInStyles.default),
        ...getObjectStyle(fallbackStyles.default),
        ...getObjectStyle(configStyles.default),
        ...getObjectStyle(configObject.default),
        ...getObjectStyle(configObject.defaults),
        ...getObjectStyle(builtInStyles[styleName]),
        ...getObjectStyle(fallbackStyles[styleName]),
        ...getObjectStyle(configStyles[styleName]),
        ...getObjectStyle(configObject[styleName]),
        ...getObjectStyle(configObject.style),
        ...getStyleOverrides(configObject),
        ...getObjectStyle(configObject.overrides)
    };
}

function toCssProperty(property) {
    if (property.startsWith('--') || property.includes('-')) {
        return property;
    }

    return property.replace(
        /[A-Z]/g,
        (character) => `-${character.toLowerCase()}`
    );
}

function applyStyles(element, styles) {
    for (const [property, value] of Object.entries(styles)) {
        const cssProperty = toCssProperty(property);

        if (value === null || value === undefined || value === '') {
            element.style.removeProperty(cssProperty);
            continue;
        }

        element.style.setProperty(cssProperty, String(value));
    }
}

function clearMissingBaseStyles(element, hoverStyle, baseStyle) {
    for (const property of Object.keys(hoverStyle)) {
        if (property in baseStyle) {
            continue;
        }

        element.style.removeProperty(toCssProperty(property));
    }
}

export function createLauncher({
    className = '',
    hoverStyle = {},
    hoverStyleName,
    hoverStyles = {},
    label,
    onClick,
    placement = 'card',
    style = {},
    styleName,
    styles = {},
    title = label
}) {
    const launcher = document.createElement('button');
    const activeStyleName = getStyleName(
        style,
        styleName ?? 'default'
    );
    const baseStyle = {
        ...DEFAULT_STYLE,
        margin: placement === 'page' ? '12px 0' : '8px 0 0',
        ...resolveStyleConfig({
            builtInStyles: NAMED_STYLES,
            config: style,
            name: activeStyleName,
            styles
        })
    };
    const activeHoverStyle = {
        ...DEFAULT_HOVER_STYLE,
        ...resolveStyleConfig({
            builtInStyles: NAMED_HOVER_STYLES,
            config: hoverStyle,
            name: hoverStyleName ?? activeStyleName,
            styles: hoverStyles
        })
    };

    launcher.type = 'button';
    launcher.textContent = label;
    launcher.title = title;
    launcher.setAttribute('aria-haspopup', 'menu');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.dataset[DATASET_KEYS.launcher] = 'true';
    launcher.dataset.pageBreakdownPlacement = placement;

    if (className) {
        launcher.classList.add(
            ...className.split(/\s+/).filter(Boolean)
        );
    }

    applyStyles(launcher, baseStyle);

    launcher.addEventListener('mouseenter', () => {
        applyStyles(launcher, activeHoverStyle);
    });

    launcher.addEventListener('mouseleave', () => {
        clearMissingBaseStyles(
            launcher,
            activeHoverStyle,
            baseStyle
        );
        applyStyles(launcher, baseStyle);
    });

    launcher.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick?.({ event, launcher });
    });

    return launcher;
}

export default createLauncher;
