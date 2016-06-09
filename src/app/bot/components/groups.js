const groups = {
    getGroupName(level) {
        return $.data.get('groups', 'name', { level });
    },
    getGroupLevel(name) {
        return parseInt($.data.get('groups', 'level', { name }));
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
        if ($.users.isAdmin(username)) defaultGroupID = 0;
    
        const _groupID = $.util.num.validate($.data.get('users', 'permission', { name: username }));
        if (!$.util.val.isNullLike(_groupID) && _groupID >= 0 && !$.users.isAdmin(username)) {
            return _groupID;
        } else {
            Logger.trace(`getUserGroup:: assigning default group to ${username} (level ${defaultGroupID})`);
            return defaultGroupID;
        }
    }
};

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', () => {
    $.users.getGroup = groups.getUserGroup;
    $.groups = {
        getName: groups.getGroupName;
        getLevel: groups.getGroupLevel;
    };
    
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
