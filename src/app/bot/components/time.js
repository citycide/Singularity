import moment from 'moment';

const time = {
    getUserTime(user) {
        return $.data.get('users', 'time', { name: user });
    },
    setUserTime(user, time) {
        $.data.set('users', { time }, { name: user });
    },
    run() {
        if ($.stream.isLive || this.settings.getTimeKeeping(true)) {
            const userList = $.users.list || [];

            const nextTime = moment();
            const lastTime = moment(this.settings.lastRun, 'x');
            const timeSince = nextTime.diff(lastTime, 'seconds');
            
            for (let user of userList) {
                let name = user.name;
                let newTime = 0;
                
                if (name !== $.channel.botName) {
                    if (this.settings.lastUserList.includes(name)) {
                        newTime = $.data.incr('users', { time: timeSince }, { name });

                        if (this.settings.getAutoRegTime() > 0) {
                            if (($.data.get('users', 'permission', { name }) || 5) > this.settings.getRegLevel()) {
                                if (newTime > this.settings.getAutoRegTime()) {
                                    $.data.set('users', {
                                        permission: this.settings.getRegLevel()
                                    }, { name });
                                    $.shout(`${name} just became a Regular!`);
                                }
                            }
                        }
                    } else {
                        this.settings.lastUserList.push(name);
                    }
                }
            }

            this.settings.lastRun = nextTime.valueOf();
        }

        $.tick.setTimeout('timeKeeping', this.run.bind(this), 60 * 1000);
    },
    settings: {
        lastRun: Date.now(),
        lastUserList: [],
        getRegLevel() {
            return $.data.get('groups', 'level', { name: 'regular' });
        },
        getTimeKeeping(offline) {
            if (!offline) {
                return $.settings.get('timeKeeping', true);
            } else {
                return $.settings.get('timeKeepingOffline', false);
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
            // default auto-promotion time is 15 hours
            return $.settings.get('autoPromoteRegularsTime', 15 * 60 * 60);
        },
        setAutoRegTime(value) {
            $.settings.set('autoPromoteRegularsTime', value);
        }
    }
};

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', () => {
    setTimeout(() => {
        time.run();
    }, 10 * 1000);
});

export default time;
