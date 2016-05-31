const cooldown = {
    cooldowns: [],
    set(cmd, user) {
        this.cooldowns.push({
            name: cmd,
            until: Date.now() + (core.command.getCooldown(cmd) * 1000),
            scope: (core.settings.get('globalCooldown')) ? true : user
        });
    },
    clear(cmd, user) {
        if (arguments.length < 2) {
            for (let [index, command] of this.cooldowns.entries()) {
                if (command.name === cmd && command.scope === true) {
                    this.cooldowns.splice(index, 1);
                    return false;
                }
            }
        } else {
            for (let [index, command] of this.cooldowns.entries()) {
                if (command.name === cmd && command.scope === user) {
                    this.cooldowns.splice(index, 1);
                    return false;
                }
            }
        }
    },
    clearAll() {
        return this.cooldowns = [];
    },
    getDefault() {
        return core.settings.get('defaultCooldown');
    },
    isActive(cmd, user) {
        const hasCooldown = core.command.getCooldown(cmd);
        if (core.settings.get('globalCooldown') && !hasCooldown) {
            for (let [index, command] of this.cooldowns.entries()) {
                if (command.name === cmd && command.scope === true) {
                    const timeLeft = command.until - Date.now();
                    if (timeLeft > 0) {
                        return parseInt(timeLeft / 1000);
                    } else {
                        this.cooldowns.splice(index, 1);
                        return false;
                    }
                }
            }
        } else {
            for (let [index, command] of this.cooldowns.entries()) {
                if (command.name === cmd && command.scope === user) {
                    const timeLeft = command.until - Date.now();
                    if (timeLeft > 0) {
                        return parseInt(timeLeft / 1000);
                    } else {
                        this.cooldowns.splice(index, 1);
                        return false;
                    }
                }
            }
        }
    }
};

export default cooldown;