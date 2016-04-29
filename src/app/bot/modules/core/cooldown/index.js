const EventEmitter = require('events').EventEmitter;

let cooldowns = {};

function Cooldown(params, fn, bind) {
    if (!(this instanceof Cooldown)) return new Cooldown(params, fn, bind);
    if (!params.cmd) {
        console.log('[COOLDOWN ERR]: Command name must be specified.');
        return;
    }
    if (!fn) {
        console.log('[COOLDOWN ERR]: A function must be specified.');
        return;
    }

    let self = this;

    this._cmd = params.cmd;
    this._cooldownTime = params.time * 1000;
    this._user = params.user ? params.user : 'global';
    this._fn = fn;
    this._bind = bind ? bind : this;

    if (cooldowns[this.cmd] === undefined) cooldowns[this._cmd] = {};

    this.fn = function(...args) {
        if(self.isOnCooldown()) {
            self.fn.emit('cooldown.calledOnCooldown', self, args);
            return false;
        }
        self._fn.call(self._bind, args);
        self.startCooldown();
    };

    console.log(this._cmd);
    console.log(this._cooldownTime);
    console.log(this._user);

    this.fn.constructor.prototype.__proto__ = EventEmitter.prototype;

    return this.fn;
}

Cooldown.prototype.startCooldown = function() {
    if (cooldowns[this._cmd][this._user] === undefined) cooldowns[this._cmd][this._user] = {};
    cooldowns[this._cmd][this._user].onCooldown = true;
    cooldowns[this._cmd].timeout = setTimeout(this.endCooldown.bind(this), this._cooldownTime);
    this.fn.emit('cooldown.start', this);
};

Cooldown.prototype.endCooldown = function() {
    if (cooldowns[this._cmd][this._user] === undefined) cooldowns[this._cmd][this._user] = {};
    cooldowns[this._cmd][this._user].onCooldown = false;
    clearTimeout(cooldowns[this._cmd].timeout);
    this.fn.emit('cooldown.end', this);
};

Cooldown.prototype.resetCooldown = function() {
    this.endCooldown() && this.startCooldown();
    this.fn.emit('cooldown.reset', this);
};

Cooldown.prototype.isOnCooldown = function() {
    if (cooldowns[this._cmd][this._user] === undefined) cooldowns[this._cmd][this._user] = {};
    return cooldowns[this._cmd][this._user].onCooldown;
};

module.exports = Cooldown;
