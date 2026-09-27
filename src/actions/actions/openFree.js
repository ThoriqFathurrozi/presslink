const OpenFreeAction = {
    key: 'OPEN_FREE',
    name: 'Open FREE',
    enabled: true,

    buildUrl(context) {
        const baseUrl = 'https://freedium-mirror.cfd/';
        return baseUrl + context.url;
    }
};

export default OpenFreeAction;
