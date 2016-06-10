/* jshint -W014 */

const points = {
    makeString(amount) {
        const inputAmount = parseInt(amount);
        if (inputAmount === 1) {
            // singular
            return `${inputAmount} ${this.settings.getPointName(true)}`;
        } else {
            // plural
            return `${inputAmount} ${this.settings.getPointName()}`;
        }
    },
    getCommandPrice(cmd, sub = null) {
        return (sub)
            ? core.data.get('subcommands', 'price', { name: cmd })
            : core.data.get('commands', 'price', { name: cmd });
    },
    setCommandPrice(cmd, price, sub = null) {
        if (sub) {
            core.data.set('subcommands', { name: cmd, price }, { name: cmd });
        } else {
            core.data.set('commands', { name: cmd, price }, { name: cmd });
        }
    },
    getUserPoints(user) {
        return core.data.get('users', 'points', { name: user });
    },
    setUserPoints(user, amount) {
        core.data.set('users', { points: amount }, { name: user });
    },
    add(user, amount) {
        if (amount === 0) return;
        if (amount < 0) {
            this.sub(user, amount);
            return;
        }

        const current = this.getUserPoints(user) || 0;
        const newAmount = current + parseInt(amount);

        this.setUserPoints(user, newAmount);
    },
    sub(user, amount) {
        if (amount === 0) return;

        const current = this.getUserPoints(user);
        let newAmount = current - Math.abs(amount);

        // do not allow user points to go negative
        newAmount = Math.max(0, newAmount);

        this.setUserPoints(user, newAmount);
    },
    run() {
        const now = Date.now();
        const nextLivePayout = this.lastPayout + (this.settings.getPayoutInterval() * 60 * 1000);
        const nextOfflinePayout = this.lastPayout + (this.settings.getPayoutInterval(true) * 60 * 1000);
        let payout = 0;

        if ($.stream.isLive) {
            if (this.settings.getPayoutAmount() > 0 && this.settings.getPayoutInterval() > 0) {
                if (nextLivePayout >= now) {
                    return;
                } else {
                    payout = this.settings.getPayoutAmount();
                }
            }
        } else {
            if (this.settings.getPayoutAmount(true) > 0 && this.settings.getPayoutInterval(true) > 0) {
                if (nextOfflinePayout >= now) {
                    return;
                }  else {
                    payout = this.settings.getPayoutAmount(true);
                }
            } else {
                return;
            }
        }

        const userList = $.users.list || [];

        for (let user of userList) {
            let bonus = 0;

            if (user !== $.channel.botName) {
                if (this.settings.lastUserList.includes(user)) {

                    const userDB = $.data.getRow('users', { name: user });

                    if (userDB) {
                        if (this.settings.getRankBonus(userDB.rank)) {
                            bonus = this.settings.getRankBonus(userDB.rank);
                        } else {
                            bonus = this.settings.getGroupBonus(userDB.permission);
                        }
                    }
                    
                    // this.add(user, payout + bonus);
                    $.data.incr('users', 'points', payout + bonus, { name: user });
                } else {
                    this.settings.lastUserList.push(user);
                }
            }

        }

        this.settings.lastPayout = now;

        $.tick.setTimeout('pointPayouts', this.run.bind(this), 60 * 1000);
    },
    settings: {
        lastPayout: 0,
        lastUserList: [],
        getPointName(plural = false) {
            return (!plural)
                ? $.settings.get('pointName', 'point')
                : $.settings.get('pointNamePlural', 'points');
        },
        setPointName(name, plural = false) {
            if (plural) {
                $.settings.set('pointNamePlural', name);
            } else {
                $.settings.set('pointName', name);
            }
        },
        getPayoutAmount(offline) {
            if (!offline) {
                return $.settings.get('pointsPayoutLive', 6);
            } else {
                return $.settings.get('pointsPayoutOffline', -1);
            }
        },
        setPayoutAmount(amount, offline) {
            if (!offline) {
                $.settings.set('pointsPayoutLive', amount);
            } else {
                $.settings.set('pointsPayoutOffline', amount);
            }
        },
        getPayoutInterval(offline) {
            if (!offline) {
                return $.settings.get('pointsIntervalLive', 5);
            } else {
                return $.settings.get('pointsIntervalOffline', -1);
            }
        },
        setPayoutInterval(time, offline) {
            if (!offline) {
                $.settings.set('pointsIntervalLive', time);
            } else {
                $.settings.set('pointsIntervalOffline', time);
            }
        },
        getRankBonus(rank) {
            const _storedRankBonus = $.data.get('ranks', 'bonus', { name: rank });
            if (_storedRankBonus) {
                return _storedRankBonus;
            } else {
                return false;
            }
        },
        setRankBonus(rank, bonus) {
            $.data.set('ranks', { name: rank, bonus }, { name: rank });
        },
        getGroupBonus(group) {
            let _storedGroupBonus;
    
            if (typeof group === 'number') {
                _storedGroupBonus = $.data.get('groups', 'bonus', { level: group });
            } else if (typeof group === 'string') {
                _storedGroupBonus = $.data.get('groups', 'bonus', { name: group });
            } else return 0;
    
            return (_storedGroupBonus) ? _storedGroupBonus : 0;
        },
        setGroupBonus(group, bonus) {
            if (typeof group === 'number') {
                $.data.set('groups', { level: group, bonus }, { level: group });
            } else if (typeof group === 'string') {
                $.data.set('groups', { name: group, bonus }, { name: group });
            }
        }
    }
};

/**
 * Add methods to the global core object
 **/
const exportAPI = {
    getPrice: points.getCommandPrice,
    setPrice: points.setCommandPrice
};

$.on('bot:ready', () => {
    Object.assign($.command, exportAPI);

    $.points = {
        add: points.add.bind(points),
        sub: points.sub.bind(points),
        get: points.getUserPoints,
        set: points.setUserPoints,
        str: points.makeString.bind(points),
        getName: points.getPointName,
        setName: points.setPointName
    };

    setTimeout(() => {
        points.run();
    }, 5 * 1000);
});

export default points;
