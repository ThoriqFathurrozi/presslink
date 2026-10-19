function getPopupLeft(anchorRect, width) {
    const gutter = 12;
    const preferred = anchorRect.left;
    const maximum = window.innerWidth - width - gutter;

    return Math.max(gutter, Math.min(preferred, maximum));
}

export function createPopup({
    id,
    items = [],
    anchor = null,
    closeOnOutside = true,
    onClose
}) {
    const popup = document.createElement('div');
    const content = document.createElement('div');
    let mounted = false;
    let outsideClickTimer = null;

    popup.id = id;
    popup.dataset.pageBreakdownPopup = 'true';
    popup.setAttribute('role', 'menu');
    popup.setAttribute('aria-label', 'Presslink actions');

    Object.assign(popup.style, {
        background: '#ffffff',
        border: '1px solid rgba(17, 24, 39, 0.12)',
        borderRadius: '12px',
        boxShadow: '0 20px 45px rgba(17, 24, 39, 0.22)',
        color: '#111827',
        minWidth: '180px',
        padding: '6px',
        position: 'fixed',
        zIndex: '2147483647'
    });

    Object.assign(content.style, {
        display: 'grid',
        gap: '4px'
    });

    popup.appendChild(content);

    const position = () => {
        const popupWidth = popup.offsetWidth || 200;

        if (!anchor?.getBoundingClientRect) {
            Object.assign(popup.style, {
                left: '12px',
                top: '12px'
            });
            return;
        }

        const anchorRect = anchor.getBoundingClientRect();
        const top = Math.min(
            anchorRect.bottom + 8,
            window.innerHeight - popup.offsetHeight - 12
        );

        Object.assign(popup.style, {
            left: `${getPopupLeft(anchorRect, popupWidth)}px`,
            top: `${Math.max(12, top)}px`
        });
    };

    const handleOutsideClick = (event) => {
        const target = event.target;

        if (
            popup.contains(target) ||
            anchor?.contains?.(target)
        ) {
            return;
        }

        api.unmount({ restoreFocus: false });
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            api.unmount();
            return;
        }

        if (event.key === 'Tab') {
            // Resume the page's normal tab order from the launcher.
            api.unmount();
            return;
        }

        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            return;
        }

        const enabledItems = Array.from(content.children).filter((item) => !item.disabled);
        if (!enabledItems.length) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const current = enabledItems.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 :
            event.key === 'End' ? enabledItems.length - 1 :
            (current + (event.key === 'ArrowDown' ? 1 : -1) + enabledItems.length) % enabledItems.length;
        enabledItems[next].focus();
    };

    popup.addEventListener('keydown', handleKeyDown);

    const api = {
        element: popup,

        mount(target = document.body ?? document.documentElement) {
            if (mounted) {
                return api;
            }

            this.updateChildren(items);
            target.appendChild(popup);
            position();
            mounted = true;
            anchor?.setAttribute('aria-expanded', 'true');
            anchor?.setAttribute('aria-controls', id);
            Array.from(content.children).find((item) => !item.disabled)?.focus();

            if (closeOnOutside) {
                outsideClickTimer = setTimeout(() => {
                    outsideClickTimer = null;

                    if (mounted) {
                        document.addEventListener(
                            'click',
                            handleOutsideClick,
                            true
                        );
                    }
                }, 0);
            }

            window.addEventListener('resize', position);
            window.addEventListener('scroll', position, true);
            return api;
        },

        unmount({ restoreFocus = true } = {}) {
            if (!mounted) {
                return;
            }

            clearTimeout(outsideClickTimer);
            outsideClickTimer = null;
            document.removeEventListener(
                'click',
                handleOutsideClick,
                true
            );
            window.removeEventListener('resize', position);
            window.removeEventListener('scroll', position, true);
            const hadFocus = popup.contains(document.activeElement);
            popup.remove();
            mounted = false;
            anchor?.setAttribute('aria-expanded', 'false');
            anchor?.removeAttribute('aria-controls');
            if (restoreFocus && hadFocus && anchor?.isConnected) {
                anchor.focus();
            }
            onClose?.();
        },

        updateChildren(children = []) {
            content.replaceChildren(...children);
            position();
        }
    };

    return api;
}

export default createPopup;
