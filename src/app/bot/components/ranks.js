const ranks = {
    getRankName(level) {
        return $.db.get('ranks', 'name', { level });
    },
    getRankLevel(name) {
        return parseInt($.db.get('ranks', 'level', { name }));
    },
    getUserRank(user = {}) {
        // 'user' parameter should always be an object
        // minimum requirements:
        // user = { 'display-name': 'name' };

        const username = user['display-name'];
        const userType = user['user-type'];
        if (!username) return;

        const _rankID = $.db.get('users', 'rank', { name: username });
        if (!$.util.isNil(_rankID) && _rankID >= 1) {
            return _rankID;
        } else {
            Logger.trace(`getUserRank:: assigning default rank to ${username} (level 1)`);
            $.db.set('users', { permission: 1 }, { name: username });
            return defaultRankID;
        }
    },
    settings: {
        getAllowPurchases() {
            if ($.db.getComponentConfig('points', 'enabled', true)) {
                return $.db.getComponentConfig('ranks', 'allowPurchases', true);
            } else {
                return false;
            }
        },
        setAllowPurchases(bool) {
            if (typeof bool !== 'boolean') return;
            return $.db.setComponentConfig('ranks', 'allowPurchases', bool)
        }
    }
};

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', () => {
    $.db.addTableCustom('ranks', [
        { name: 'level', type: 'int', unique: true },
        'name',
        { name: 'bonus', type: 'int' },
        { name: 'requirement', type: 'int' },
        { name: 'price', type: 'int' }
    ]);

    if ($.db.getComponentConfig('ranks', 'initial') === 'initial') {
        $.log('notice', 'Initializing default user ranks...');
        
        $.db.set('ranks', { name: 'atari 2600', level: 1, bonus: 0, requirement: 0, price: 0 });
        $.db.set('ranks', { name: 'commodore 64', level: 2, bonus: 1, requirement: 3, price: 130 });
        $.db.set('ranks', { name: 'sega master', level: 3, bonus: 1, requirement: 6, price: 360 });
        $.db.set('ranks', { name: 'snes', level: 4, bonus: 2, requirement: 9, price: 540 });
        $.db.set('ranks', { name: 'sega saturn', level: 5, bonus: 2, requirement: 12, price: 720 });
        $.db.set('ranks', { name: 'playstation', level: 6, bonus: 3, requirement: 15, price: 900 });
        $.db.set('ranks', { name: 'n64', level: 7, bonus: 3, requirement: 20, price: 1200 });
        $.db.set('ranks', { name: 'dreamcast', level: 8, bonus: 3, requirement: 30, price: 1800 });
        $.db.set('ranks', { name: 'xbox', level: 9, bonus: 4, requirement: 50, price: 3000 });
        $.db.set('ranks', { name: 'ps2', level: 10, bonus: 5, requirement: 100, price: 6000 });
        
        $.db.setComponentConfig('ranks', 'default');
        $.log('notice', 'Done. Default user ranks initialized.');
    }
});

export default ranks;
