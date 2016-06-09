const ranks = {
    // ... rank stuff
};

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', () => {
    if ($.settings.get('ranks', 'initial') === 'initial') {
        $.data.set('ranks', { name: 'atari 2600', level: 1, bonus: 0 });
        $.data.set('ranks', { name: 'commodore 64', level: 2, bonus: 1 });
        $.data.set('ranks', { name: 'sega master', level: 3, bonus: 1 });
        $.data.set('ranks', { name: 'snes', level: 4, bonus: 2 });
        $.data.set('ranks', { name: 'sega saturn', level: 5, bonus: 2 });
        $.data.set('ranks', { name: 'playstation', level: 6, bonus: 3 });
        $.data.set('ranks', { name: 'n64', level: 7, bonus: 3 });
        $.data.set('ranks', { name: 'dreamcast', level: 8, bonus: 3 });
        $.data.set('ranks', { name: 'xbox', level: 9, bonus: 4 });
        $.data.set('ranks', { name: 'ps2', level: 10, bonus: 5 });
        $.settings.set('ranks', 'default');
    }
});

export default ranks;
