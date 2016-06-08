/* jshint -W014 */

const points = {
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

        if ($.isLive) {
            if (this.settings.getPayoutAmount() > 0 && this.settings.getPayoutInterval() > 0) {
                if (nextLivePayout >= now) {
                    return;
                } else {
                    payout = this.settings.getPayoutAmount();
                }
            }
        } else {
            if (!$.settings.get('pointsOffline')) return;
            if (this.settings.getPayoutAmount(true) > 0 && this.settings.getPayoutInterval(true) > 0) {
                if (nextOfflinePayout >= now) {
                    return;
                }  else {
                    payout = this.settings.getPayoutAmount(true);
                }
            }
        }

        const userList = $.users.list || [];

        for (let user of userList) {
            let name = user.username;
            let bonus = 0;

            if (this.settings.lastUserList.includes(name)) {
                if (name !== $.channel.botName) {
                    /**
                     * @TODO add bonus payout amounts for groups / ranks
                     * @TODO unrelated - add ranks to the bot
                     */

                    if (user.hasOwnProperty('rank')) {
                        if (this.settings.getRankBonus(user.rank)) {
                            bonus = this.settings.getRankBonus(user.rank);
                        } else {
                            bonus = this.settings.getGroupBonus(user.permLevel);
                        }
                    }

                    this.add(name, payout + bonus);
                }
            } else {
                this.settings.lastUserList.push(name);
            }

        }

        this.settings.lastPayout = now;

        $.tick.setTimeout('pointPayouts', this.run.bind(this), 60 * 1000);
    },
    settings: {
        lastPayout: 0,
        lastUserList: [],
        getPayoutAmount(offline) {
            if (!offline) {
                return $.settings.get('pointsPayoutLive');
            } else {
                return $.settings.get('pointsPayoutOffline');
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
                return $.settings.get('pointsIntervalLive');
            } else {
                return $.settings.get('pointsIntervalOffline');
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
            let groupName = group;
            let _storedGroupBonus;
    
            if (typeof groupName === 'number') {
                groupName = $.data.get('groups', 'name', { id: group });
            }
    
            if (groupName) {
                _storedGroupBonus = $.data.get('groups', 'bonus', { name: groupName });
            }
    
            if (_storedGroupBonus) {
                return _storedGroupBonus;
            } else {
                return 0;
            }
        },
        setGroupBonus(group, bonus) {
            let groupName = group;
    
            if (typeof groupName === 'number') {
                groupName = $.data.get('groups', 'name', { id: group });
            }
    
            if (groupName) {
                $.data.set('groups', { name: groupName, bonus }, { name: groupName });
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
        set: points.setUserPoints
    };

    points.run();
});

export default points;