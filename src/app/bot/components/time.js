const time = {
    getUserTime(user) {
        return $.data.get('users', 'time', { name: user });
    },
    setUserTime(user, time) {
        $.data.set('users', { time }, { name: user });
    },
    run() {
        if ($.isLive || this.settings.getTimeKeeping(true)) {
            const userList = $.users.list || [];
            
            for (let user of userList) {
                let name = user.username;
                let newTime = null;
                
                if (name !== $.channel.botName) {
                    if (this.settings.lastUserList.includes(name)) {
                        newTime = $.data.incr('users', { time: 60 }, { name });
                    } else {
                        this.settings.lastUserList.push(name);
                    }
                    
                    if (this.settings.getAutoRegTime > 0) {
                        if (newTime > this.settings.getAutoRegTime()) {
                            // .. promote the user to the 'regular' group
                        }
                    }
                }
            }
        }
            
        $.tick.setTimeout('timeKeeping', this.run.bind(this), 60 * 1000);
    },
    settings: {
        lastUserList: [],
        getTimeKeeping(offline) {
            if (!offline) {
                return $.settings.get('timeKeeping') || true;
            } else {
                return $.settings.get('timeKeepingOffline') || false;
            }
        },
        setTimeKeeping(value, offline) {
            if (typeof value !== 'boolean') {
                if (value === 'true' || value === 'false') {
                    value = (value === 'true');
                } else {
                    return;
                }
            }
            if (!offline) {
                $.settings.set('timeKeeping', value);
            } else {
                $.settings.set('timeKeepingOffline', value);
            }
        },
        getAutoRegTime() {
            return $.settings.get('autoPromoteRegularsTime') || 15;
        },
        setAutoRegTime(value) {
            $.settings.set('autoPromoteRegularsTime', value);
        }
    }
}

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', () => {
    $.time = {
        add: points.add.bind(points),
        sub: points.sub.bind(points),
        get: points.getUserPoints,
        set: points.setUserPoints,
        str: points.makeString.bind(points),
        getName: points.getPointName,
        setName: points.setPointName
    };

    time.run();
});

export default points;
