const Timers = {
    timeouts: new Map(),
    intervals: new Map(),

    set(fn, time, ...args) {
        if (this.timeouts.has(fn)) this.clear(fn);
        return this.timeouts.set(fn, setTimeout(fn, time, args));
    },

    clear(fn) {
        if (!this.timeouts.has(fn)) return;
        const id = this.timeouts.get(fn);
        return clearTimeout(id);
    }
};

const Intervals = {
    set(fn, interval, ...args) {
        if (this.intervals.has(fn)) this.clear(fn);
        return this.intervals.set(fn, setInterval(fn, interval, args));
    },

    clear(fn) {
        if (!this.intervals.has(fn)) return;
        const id = this.intervals.get(fn);
        return clearInterval(id);
    }
};

module.exports.Timers = Timers;
module.exports.Intervals = Intervals;