const groups = {
    getGroupName(level) {
        return $.db.get('groups', 'name', { level });
    },
    getGroupLevel(name) {
        return parseInt($.db.get('groups', 'level', { name }));
    },
    getUserGroup(user) {
        // 'user' parameter should always be an object
        // minimum requirements:
        // user = { 'display-name': 'name' };

        const username = user['display-name'];
        const userType = user['user-type'];
        if (!username) return;

        let defaultGroupID = 5;

        if (userType === 'mod') defaultGroupID = 1;
        if ($.user.isAdmin(username)) defaultGroupID = 0;

        const _groupID = $.util.num.validate($.db.get('users', 'permission', { name: username }));
        if (!$.util.val.isNullLike(_groupID) && _groupID >= 0) {
            return _groupID;
        } else {
            Logger.trace(`getUserGroup:: assigning default group to ${username} (level ${defaultGroupID})`);
            $.db.set('users', { permission: defaultGroupID }, { name: username });
            return defaultGroupID;
        }
    }
};

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', () => {
    $.user.getGroup = groups.getUserGroup;
    $.groups = {
        getName: groups.getGroupName,
        getLevel: groups.getGroupLevel
    };

    if ($.settings.get('groups', 'initial') === 'initial') {
        $.db.set('groups', { name: 'admin', level: 0, bonus: 0 });
        $.db.set('groups', { name: 'moderator', level: 1, bonus: 0 });
        $.db.set('groups', { name: 'subscriber', level: 2, bonus: 5 });
        $.db.set('groups', { name: 'regular', level: 3, bonus: 5 });
        $.db.set('groups', { name: 'follower', level: 4, bonus: 2 });
        $.db.set('groups', { name: 'viewer', level: 5, bonus: 0 });
        $.settings.set('groups', 'default');
    }
});

export default groups;
