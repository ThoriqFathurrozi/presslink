import CopyUrlAction from './actions/copyUrl.js';
import OpenUrlAction from './actions/openUrl.js';
import OpenFreeAction from './actions/openFree.js';

const ACTIONS = [
    CopyUrlAction,
    OpenUrlAction,
    OpenFreeAction
];

export function getActiveActions() {
    return ACTIONS.filter(
        (action) => action.enabled !== false
    );
}

export default ACTIONS;
