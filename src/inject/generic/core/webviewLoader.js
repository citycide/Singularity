import { shell, remote } from 'electron';
import path from 'path';

const webview = document.querySelector('webview');

if (webview) {
    let once = true;
    webview.addEventListener('did-start-loading', () => {
        if (once) {
            once = false;
            // webview.src = Settings.get('lastPage', 'https://play.google.com/music/listen');
            document.body.setAttribute('loading', 'loading');
        }
    });

/*    const savePage = (param) => {
        const url = param.url || param;
        if (!/https?:\/\/play\.google\.com\/music/g.test(url)) return;
        Emitter.fire('settings:set', {
            key: 'lastPage',
            value: url
        });
    };*/

    webview.addEventListener('dom-ready', () => {
        // webview.openDevTools();
        /*setTimeout(() => {
            document.body.removeAttribute('loading');
            webview.addEventListener('did-navigate', savePage);
            webview.addEventListener('did-navigate-in-page', savePage);

            const focusWebview = () => {
                document.querySelector('webview::shadow object').focus();
            };
            window.addEventListener('beforeunload', () => {
                remote.getCurrentWindow().removeListener('focus', focusWebview);
            });
            remote.getCurrentWindow().on('focus', focusWebview);
        }, 700);*/
    });

    webview.addEventListener('new-window', (e) => {
        if (e.url.indexOf('bttvSettings') !== -1) {
            let bttvSettings = new remote.BrowserWindow({
                title: 'BetterTTV Settings',
                autoHideMenuBar: true,
                width: 810,
                height: 548,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    webSecurity: false,
                    plugins: true,
                    allowRunningInsecureContent: true,
                    preload: path.resolve(`${__dirname}/../../bttv/index.js`)
                }
            });
            bttvSettings.loadURL(e.url);
            bttvSettings.show();
            bttvSettings.openDevTools();
            bttvSettings.on('closed', () => {
                bttvSettings = null;
            });
        }
    });
}