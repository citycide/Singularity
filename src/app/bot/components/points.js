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
            ? $.db.get('subcommands', 'price', { name: cmd })
            : $.db.get('commands', 'price', { name: cmd });
    },
    setCommandPrice(cmd, price, sub = null) {
        if (sub) {
            $.db.set('subcommands', { name: cmd, price }, { name: cmd });
        } else {
            $.db.set('commands', { name: cmd, price }, { name: cmd });
        }
    },
    getUserPoints(user, makeString) {
        if (makeString) {
            return this.makeString($.db.get('users', 'points', { name: user }));
        } else {
            return $.db.get('users', 'points', { name: user });
        }
    },
    setUserPoints(user, amount) {
        $.db.set('users', { points: amount }, { name: user });
    },
    add(user, amount) {
        $.db.incr('users', 'points', amount, { name: user });
    },
    sub(user, amount) {
        $.db.decr('users', 'points', amount, { name: user });
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

        const userList = $.user.list || [];

        for (let user of userList) {
            let bonus = 0;

            if (user !== $.channel.botName) {
                if (this.settings.lastUserList.includes(user)) {

                    const userDB = $.db.getRow('users', { name: user });

                    if (userDB) {
                        if (this.settings.getRankBonus(userDB.rank)) {
                            bonus = this.settings.getRankBonus(userDB.rank);
                        } else {
                            bonus = this.settings.getGroupBonus(userDB.permission);
                        }
                    }

                    // this.add(user, payout + bonus);
                    $.db.incr('users', 'points', payout + bonus, { name: user });
                } else {
                    this.settings.lastUserList.push(user);
                }
            }

        }

        this.settings.lastPayout = now;

        $.tick.setTimeout('pointPayouts', ::this.run, 60 * 1000);
    },
    settings: {
        lastPayout: 0,
        lastUserList: [],
        getPointName(singular = false) {
            return (singular)
                ? $.settings.get('pointName', 'point')
                : $.settings.get('pointNamePlural', 'points');
        },
        setPointName(name, singular = false) {
            if (singular) {
                $.settings.set('pointName', name);
            } else {
                $.settings.set('pointNamePlural', name);
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
            const _storedRankBonus = $.db.get('ranks', 'bonus', { name: rank });
            if (_storedRankBonus) {
                return _storedRankBonus;
            } else {
                return false;
            }
        },
        setRankBonus(rank, bonus) {
            $.db.set('ranks', { name: rank, bonus }, { name: rank });
        },
        getGroupBonus(group) {
            let _storedGroupBonus;

            if (typeof group === 'number') {
                _storedGroupBonus = $.db.get('groups', 'bonus', { level: group });
            } else if (typeof group === 'string') {
                _storedGroupBonus = $.db.get('groups', 'bonus', { name: group });
            } else return 0;

            return (_storedGroupBonus) ? _storedGroupBonus : 0;
        },
        setGroupBonus(group, bonus) {
            if (typeof group === 'number') {
                $.db.set('groups', { level: group, bonus }, { level: group });
            } else if (typeof group === 'string') {
                $.db.set('groups', { name: group, bonus }, { name: group });
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
        add: ::points.add,
        sub: ::points.sub,
        get: ::points.getUserPoints,
        set: points.setUserPoints,
        str: ::points.makeString,
        getName: points.getPointName,
        setName: points.setPointName
    };

    setTimeout(() => {
        points.run();
    }, 5 * 1000);
});

export default points;
