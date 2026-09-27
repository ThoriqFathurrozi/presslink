export function createActionItem({ action, context, onExecute }) {
    const item = document.createElement('button');

    item.type = 'button';
    item.textContent = action.name ?? action.key;
    item.dataset.pageBreakdownAction = action.key;
    item.setAttribute('role', 'menuitem');

    Object.assign(item.style, {
        background: 'transparent',
        border: '0',
        borderRadius: '8px',
        color: '#111827',
        cursor: 'pointer',
        display: 'block',
        font: '500 13px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: '9px 10px',
        textAlign: 'left',
        width: '100%'
    });

    item.addEventListener('mouseenter', () => {
        item.style.background = '#f3f4f6';
    });

    item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
    });

    item.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        item.disabled = true;

        try {
            await onExecute(action, context);
        } finally {
            item.disabled = false;
        }
    });

    return item;
}

export default createActionItem;
