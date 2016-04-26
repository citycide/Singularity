let cooldowns = {
    'rip': {
        'test':
        {
            isOnCooldown: false,
            timeout: 1000
        },
        'onetest':
        {
            isOnCooldown: true,
            timeout: 1000
        },
        'twotest':
        {
            isOnCooldown: true,
            timeout: 1000
        },
        'global':
        {
            isOnCooldown: false,
            timeout: 1000
        }
    }
};

function checkCooldown(cmd, user) {
    this._cmd = cmd;
    this._user = user ? user : 'global';

    let isCooldownActive = false;

    if (cooldowns[this._cmd]['global'] === undefined) {
        cooldowns[this._cmd]['global'] = {};
        cooldowns[this._cmd]['global'].isOnCooldown = false;
    }

    if (cooldowns[this._cmd]['global'].isOnCooldown === true) {
        console.log('Global cooldown is active.');
        isCooldownActive = true;
    } else {
        let status;
        if (cooldowns[this._cmd][this._user] === undefined) {
            console.log('User not in array, adding.');
            cooldowns[this._cmd][this._user] = {
                isOnCooldown: false,
                timeout: null
            };
            console.log(cooldowns);
        }

        if (cooldowns[this._cmd][this._user].isOnCooldown === true) {
            console.log(`${this._user} set to true`);
            isCooldownActive = true;
        } else if (cooldowns[this._cmd][this._user].isOnCooldown === false) {
            console.log(`${this._user} set to false`);
            isCooldownActive = false;
        } else {
            console.log(`${this._user} is not present`);
            isCooldownActive = false;
        }
    }
    return isCooldownActive;
}

function startCooldown(cmd, user) {
    this._cmd = cmd;
    this._user = user ? user : 'global';
    cooldowns[this._cmd][this._user].isOnCooldown = true;
    console.log(`Started cooldown on ${this._user}`);
}

function endCooldown(cmd, user) {
    this._cmd = cmd;
    this._user = user ? user : 'global';
    cooldowns[this._cmd][this._user].isOnCooldown = false;
    console.log(`Ended cooldown on ${this._user}`);
}

function test(cmd, user) {
    if (!user) user = 'global';
    checkCooldown(cmd, user);
    startCooldown(cmd, user);
    checkCooldown(cmd, user);
    endCooldown(cmd, user);
    checkCooldown(cmd,user);
}
// test(command, username);

function newCommand(cmd) {
    cooldowns[cmd] = {};
}
newCommand('rekt');
newCommand('8ball');
newCommand('roll');
test('rekt', 'onetest');
test('rekt', 'twotest');
test('rekt', 'test');
test('8ball', 'shame');
test('roll', 'gitter');
test('8ball');
test('roll');
test('rekt');