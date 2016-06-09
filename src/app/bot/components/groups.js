const groups = {
    // ... group stuff
};

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', () => {
    if ($.settings.get('groups', 'initial') === 'initial') {
        $.data.set('groups', { name: 'admin', level: 0, bonus: 0 });
        $.data.set('groups', { name: 'moderator', level: 1, bonus: 0 });
        $.data.set('groups', { name: 'subscriber', level: 2, bonus: 5 });
        $.data.set('groups', { name: 'regular', level: 3, bonus: 5 });
        $.data.set('groups', { name: 'follower', level: 4, bonus: 2 });
        $.data.set('groups', { name: 'viewer', level: 5, bonus: 0 });
        $.settings.set('groups', 'default');
    }
});

export default groups;