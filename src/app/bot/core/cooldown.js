/* jshint -W014, -W018 */

const cooldown = {
    // cooldowns['command-name'] = { name, until, scope }
    cooldowns: [],
    get(cmd, sub) {
        if (!sub) {
            return core.data.get('commands', 'cooldown', { name: cmd });
        } else {
            return core.data.get('subcommands', 'cooldown', { name: sub });
        }
    },
    start(cmd, user, sub) {
        // if this command has no default specified, use the bot default
        const time = this.get(cmd, sub) || this.getDefault();
        this.cooldowns.push({
            name: cmd,
            sub: sub,
            until: Date.now() + (time * 1000),
            // if globalCooldown is set to true or no user was provided
            scope: (core.settings.get('globalCooldown') || !user)
                // a value of false for cooldown scope means global, ie. all users
                ? false
                // handle the case where no user is provided
                : user || false
        });
    },
    clear(cmd, user, sub) {
        const index = this.getIndex(cmd, user, sub);

        // check that the item was actually in the array, remove if it was
        if (index >= 0) {
            // returns true if exactly 1 item was removed, otherwise false
            return (this.cooldowns.splice(index, 1).length === 1);
        } else {
            // if the item was not in the array, do nothing
            return false;
        }
    },
    clearAll() {
        this.cooldowns = [];
        return this;
    },
    getDefault() {
        return core.settings.get('defaultCooldown');
    },
    isActive(cmd, user, sub) {
        // see above for comments about cooldown scope
        const scope = (core.settings.get('globalCooldown') || !user)
            ? false
            : user || false;

        for (let [index, command] of this.cooldowns.entries()) {
            // if we matched a command name & scope combination
            if (command.name === cmd && command.scope === scope && command.sub === sub) {

                const timeLeft = command.until - Date.now();

                if (timeLeft > 0) {
                    if (user === $.channel.name) return false;
                    // return the number of seconds left if > 0
                    return parseInt(timeLeft / 1000);
                } else {
                    // remove the cooldown if the time has reached 0
                    // returns false if exactly 1 item was removed, otherwise true
                    return !(this.cooldowns.splice(index, 1).length === 1);
                }
            }
        }
    },
    getIndex(cmd, user, sub) {
        // see above for comments about cooldown scope
        const scope = (core.settings.get('globalCooldown') || !user)
            ? false
            : user || false;

        for (let [index, command] of this.cooldowns.entries()) {
            // if we matched a command name & scope combination
            if (command.name === cmd && command.scope === scope && command.sub === sub) {
                // return the position in the array
                return index;
            }
        }
    }
};

/**
 * Add methods to the global core object
 **/
const exportAPI = {
    getCooldown: cooldown.get,
    startCooldown: cooldown.start.bind(cooldown),
    clearCooldown: cooldown.clear.bind(cooldown),
    isOnCooldown: cooldown.isActive.bind(cooldown)
};

// this needs to happen on bot:ready
// `core` is undefined until the bot fires up
Transit.on('bot:ready', () => {
    Object.assign($.command, exportAPI);
});

export default cooldown;