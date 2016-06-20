import moment from 'moment';
import tracer from '../../main/utils/tracer';

const log = function(file, data) {
    $.file.write(file, `${moment().format('LTS L')} :: ${data}`, true);
};

log.level = 1;

log.clear = function(file) {
    if (!$.file.exists(file)) return;

    $.file.write(file, '');
};

log.getLevel = function() {
    return log.level;
};

log.setLevel = function(level) {
    level = parseInt(level);
    if (typeof level !== 'number') return;
    log.level = level;
};

const logTypes = {
    error: 0,
    event: 1,
    debug: 2,
    trace: 3
};

(function() {
    for (let type of Object.keys(logTypes)) {
        log[type] = function(file, data) {
            if (log.getLevel() < logTypes[type]) return;
            try {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('logger');
            } catch (e) {
                const traced = tracer(e.stack)[1];
                const { lineNumber, column } = traced;
                const modulePath = `${traced.fileParsed.base}`;

                const outPath = `${type}/${file}`;
                $.file.write(outPath, `${moment().format('LTS L')} :: ${modulePath} (${lineNumber}, ${column}) -> ${data}`, true);
            }
        };
    }
}());

export default log;

$.log = log;
