const OpenUrlAction = {
    key: 'OPEN_URL',
    name: 'Open URL',
    enabled: true,

    buildUrl(context) {
        return context.url;
    }
};

export default OpenUrlAction;
