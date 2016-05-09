import {remote} from 'electron';

const refreshButton = document.querySelector('#winRefresh');
const minButton = document.querySelector('#winMinimize');
const maxButton = document.querySelector('#winMaximize');
const closeButton = document.querySelector('#winClose');

if (refreshButton) {
    refreshButton.addEventListener('click',
        Emitter.fire.bind(Emitter, 'window:refresh', remote.getCurrentWindow().id));
}
if (minButton) {
    minButton.addEventListener('click',
        Emitter.fire.bind(Emitter, 'window:minimize', remote.getCurrentWindow().id));
}
if (maxButton) {
    maxButton.addEventListener('click',
        Emitter.fire.bind(Emitter, 'window:maximize', remote.getCurrentWindow().id));
}
if (closeButton) {
    closeButton.addEventListener('click', () => {
        if (document.getElementById('confirmTray') && window.$ && Settings.get('warnMinToTray', true) &&
            Settings.get('minToTray', true)) {
            if ($('#confirmTray').data('open')) {
                return;
            }
            $('#confirmTray').data('open', true);
            $('#confirmTray').openModal();
            $('#confirmTrayButton').one('click', () => {
                Emitter.fire('window:close', remote.getCurrentWindow().id);
                $('#confirmTray').data('open', false);
            });
            $('#confirmTrayNeverButton').one('click', () => {
                Emitter.fire('window:close', remote.getCurrentWindow().id);
                Emitter.fire('settings:set', {
                    key: 'warnMinToTray',
                    value: false,
                });
                $('#confirmTray').data('open', false);
            });
        } else {
            Emitter.fire('window:close', remote.getCurrentWindow().id);
        }
    });
}
