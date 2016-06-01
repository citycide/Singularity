const cooldown = {
    // cooldowns['command-name'] = { name, until, scope }
    cooldowns: [],
    set(cmd, user) {
        // if this command has no default specified, use the bot default
        const time = core.command.getCooldown(cmd) || this.getDefault();
        this.cooldowns.push({
            name: cmd,
            until: Date.now() + (time * 1000),
            // if globalCooldown is set to true or no user was provided
            scope: (core.settings.get('globalCooldown') || !user)
                // a value of false for cooldown scope means global, ie. all users
                ? false
                // handle the case where no user is provided
                : user || false
        });
    },
    clear(cmd, user) {
        const index = this.getIndex(cmd, user);

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
        return this.cooldowns = [];
    },
    getDefault() {
        return core.settings.get('defaultCooldown');
    },
    isActive(cmd, user) {
        // see above for comments about cooldown scope
        const scope = (core.settings.get('globalCooldown') || !user)
            ? false
            : user || false;

        for (let [index, command] of this.cooldowns.entries()) {
            // if we matched a command name & scope combination
            if (command.name === cmd && command.scope === scope) {
                const timeLeft = command.until - Date.now();

                if (timeLeft > 0) {
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
    getIndex(cmd, user) {
        // see above for comments about cooldown scope
        const scope = (core.settings.get('globalCooldown') || !user)
            ? false
            : user || false;

        for (let [index, command] of this.cooldowns.entries()) {
            // if we matched a command name & scope combination
            if (command.name === cmd && command.scope === scope) {
                // return the position in the array
                return index;
            }
        }
    }
};

export default cooldown;