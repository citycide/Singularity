let isElectron = false;
try {
    isElectron = (typeof require('fs') !== 'undefined');
    console.info('Running in Electron');
} catch (e) {
    isElectron = false;
    console.info('Running in browser');
}
