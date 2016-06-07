import moment from 'moment';
import 'moment-duration-format';

const twitchAPI = {
    settings: {
        API_OPTIONS: {
            method: 'GET',
            headers: {
                "Accept": "application/vnd.twitchtv.v3+json",
                "Authorization": `OAuth ${Settings.get('accessToken').slice(6)}`,
                "Client-ID": Settings.get('clientID')
            }
        }
    },
    getStreamInfo() {
        const opts = Object.assign({
            url: `https://api.twitch.tv/kraken/streams/${$.channel.name}?ts=${Date.now()}`
        }, this.settings.API_OPTIONS);

        let isLive = false;
        let game = null;
        let status = null;
        let uptime = 0;

        $.api(opts, (err, res, body) => {
            if (err) return Logger.error(err);

            if (body) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    Logger.error(e);
                    return;
                }
            } else {
                return;
            }

            if (body.stream) {
                isLive = true;
                game = body.stream.game || null;
                status = body.stream.channel.status || null;

                const createdTime = moment(body.stream.created_at).valueOf();
                const timeSince = moment().valueOf() - createdTime;
                uptime = moment()
                    .duration(timeSince, 'milliseconds')
                    .format('h [h], m [m], s [s]');
            }

            $.stream = Object.assign({}, {
                isLive,
                game,
                status,
                uptime
            });
        });
    },
    /**
     * @function getChatUsers()
     * @description updates the viewer list
     * @returns {Array}
     **/
    getChatUsers() {
        let users = [];
        let userCount = 0;

        const opts = Object.assign({
            url: `https://tmi.twitch.tv/group/user/${$.channel.name}/chatters?ts=${Date.now()}`
        }, this.settings.API_OPTIONS);

        $.api(opts, (err, res, body) => {
            if (err) Logger.bot(err);

            if (body) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    Logger.error(e);
                    return;
                }
            } else {
                return;
            }

            userCount = body.chatter_count || 0;
            if (userCount < 1) return;

            if (body.chatters.staff) {
                for (let user of body.chatters.staff) {
                    // if (user !== $.channel.name && user !== $.channel.botName) {
                        users.push({
                            username: user,
                            role: 'staff'
                        });
                    // }
                }
            }

            if (body.chatters.moderators) {
                for (let user of body.chatters.moderators) {
                    // if (user !== $.channel.name && user !== $.channel.botName) {
                        users.push({
                            username: user,
                            role: 'mod'
                        });
                    // }
                }
            }

            if (body.chatters.admin) {
                for (let user of body.chatters.admin) {
                    // if (user !== $.channel.name && user !== $.channel.botName) {
                        users.push({
                            username: user,
                            role: 'admin'
                        });
                    // }
                }
            }

            if (body.chatters.global_mods) {
                for (let user of body.chatters.global_mods) {
                    // if (user !== $.channel.name && user !== $.channel.botName) {
                        users.push({
                            username: user,
                            role: 'globalmod'
                        });
                    // }
                }
            }

            if (body.chatters.viewers) {
                for (let user of body.chatters.viewers) {
                    // if (user !== $.channel.name && user !== $.channel.botName) {
                        users.push({
                            username: user,
                            role: 'viewer'
                        });
                    // }
                }
            }
        });

        $.users.list = users;
        $.users.count = userCount;

        return users;
    }
};

Transit.on('bot:ready', () => {
    $.users.list = [];
    $.users.count = 0;

    $.stream = Object.assign({}, {
        isLive: false,
        game: null,
        status: null,
        uptime: 0
    });

    twitchAPI.getStreamInfo();
    twitchAPI.getChatUsers();
    setInterval(() => {
        twitchAPI.getStreamInfo();
        twitchAPI.getChatUsers();
    }, 30 * 1000);
});