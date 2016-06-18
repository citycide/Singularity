import installExtension from 'electron-devtools-installer';

if (DEV_MODE) {
    require('devtron').install();

    const vueDevTools = 'nhdogjmejiglipccpnnnanhbledajbpd';

    // Install vue-devtools
    installExtension(vueDevTools)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
}
