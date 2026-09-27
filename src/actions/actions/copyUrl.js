function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');

    textarea.value = text;
    textarea.setAttribute('readonly', '');

    Object.assign(textarea.style, {
        left: '-9999px',
        position: 'fixed',
        top: '0'
    });

    const mount = document.body ?? document.documentElement;

    if (!mount) {
        throw new Error('Clipboard fallback has no DOM mount point');
    }

    mount.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();

    if (!copied) {
        throw new Error('Clipboard copy command failed');
    }
}

const CopyUrlAction = {
    key: 'COPY_URL',
    name: 'Copy URL',
    enabled: true,

    async execute(context) {
        if (!context.url) {
            return;
        }

        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(context.url);
                return;
            } catch {
                fallbackCopyText(context.url);
                return;
            }
        }

        fallbackCopyText(context.url);
    }
};

export default CopyUrlAction;
