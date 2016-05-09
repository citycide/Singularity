Emitter.on('theme:updateColor', (e, newColor) => {
  Settings.set('themeColor', newColor);
  Emitter.sendToGooglePlayMusic('theme:updateColor', newColor);
  Emitter.sendToAll('theme:updateColor', newColor);
});

Emitter.on('theme:updateState', (e, state) => {
  Settings.set('theme', state.state);
  Emitter.sendToGooglePlayMusic('theme:updateState', state);
  Emitter.sendToAll('theme:updateState', state);
});

Emitter.on('theme:updateType', (e, newType) => {
  Settings.set('themeType', newType);
  Emitter.sendToGooglePlayMusic('theme:updateType', newType);
  Emitter.sendToAll('theme:updateType', newType);
});
