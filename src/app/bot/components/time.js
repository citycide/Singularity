import moment from 'moment';

const time = {
    getUserTime(user) {
        return $.db.get('users', 'time', { name: user });
    },
    setUserTime(user, time) {
        $.db.set('users', { time }, { name: user });
    },
    run() {
        if ($.stream.isLive || this.settings.getTimeKeeping(true)) {
            const userList = $.user.list || [];

            const nextTime = moment();
            const lastTime = moment(this.settings.lastRun, 'x');
            const timeSince = nextTime.diff(lastTime, 'seconds');

            for (let user of userList) {
                let newTime = 0;

                if (user !== $.channel.botName) {
                    if (this.settings.lastUserList.includes(user)) {
                        newTime = $.db.incr('users', 'time', timeSince, { name: user });

                        if (this.settings.getAutoRegTime() > 0) {
                            if (($.db.get('users', 'permission', { name: user }) || 5) > this.settings.getRegLevel()) {
                                if (newTime > this.settings.getAutoRegTime()) {
                                    $.db.set('users', {
                                        permission: this.settings.getRegLevel()
                                    }, { name: user });
                                    $.shout(`${user} just became a regular!`);
                                }
                            }
                        }
                    } else {
                        this.settings.lastUserList.push(user);
                    }
                }
            }

            this.settings.lastRun = nextTime.valueOf();
        }

        $.tick.setTimeout('timeKeeping', ::this.run, 60 * 1000);
    },
    settings: {
        lastRun: Date.now(),
        lastUserList: [],
        getRegLevel() {
            return $.db.get('groups', 'level', { name: 'regular' });
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
    }, 5 * 1000);
});

export default time;
