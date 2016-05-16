export default class Tock {
    constructor() {
        this.timers = new Map();
        this.intervals = new Map();
    }

    setTimeout(fn, time, ...args) {
        if (this.timers.has(fn)) this.clearTimeout(fn);
        this.timers.set(fn, setTimeout(fn, time, args));
        return this.timers.get(fn);
    }

    clearTimeout(fn) {
        if (!this.timers.has(fn)) return;
        const id = this.timers.get(fn);
        return clearTimeout(id);
    }

    setInterval(fn, interval, ...args) {
        if (this.intervals.has(fn)) this.clearInterval(fn);
        this.intervals.set(fn, setInterval(fn, interval, args));
        return this.intervals.get(fn);
    }

    clearInterval(fn) {
        if (!this.intervals.has(fn)) return;
        const id = this.intervals.get(fn);
        return clearInterval(id);
    }
}