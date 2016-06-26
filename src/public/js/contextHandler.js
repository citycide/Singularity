let isElectron = true;
try {
    isElectron = (typeof require('fs') !== 'undefined');
} catch (e) {
    isElectron = false;
}
console.info(isElectron ? 'Running in Electron' : 'Running in browser');
