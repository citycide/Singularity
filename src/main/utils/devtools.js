import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

export default function ({ devtron, vue }) {
  // if (devtron) require('devtron').install()

  if (vue) {
    installExtension(VUEJS_DEVTOOLS)
    .then(name => {})
    .catch(err => console.log('An error occurred: ', err))
  }
}
