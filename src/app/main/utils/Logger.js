import { app } from 'electron';
import winston from 'winston';
import path from 'path';

export default function initLogger() {
    const defaultSettings = {
        fileLevel: 'info',
        consoleLevel: DEV_MODE ? 'trace' : 'error',
        levels: {
            error: 0,
            warn: 1,
            info: 2,
            sys: 2,
            bot: 2,
            debug: 3,
            trace: 4,
            absurd: 5
        },
        colors: {
            error: 'red',
            warn: 'yellow',
            info: 'magenta',
            sys: 'magenta',
            bot: 'green',
            debug: 'cyan',
            trace: 'white',
            absurd: 'grey'
        }
    };

    const Logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({
                filename: path.resolve(app.getPath('userData'), 'singularity.log'),
                level: defaultSettings.fileLevel,
                maxsize: 5000000,
                maxfiles: 2
            }),
            new (winston.transports.Console)({
                level: defaultSettings.consoleLevel,
                prettyPrint: true,
                colorize: true
            })
        ]
    });

    Logger.setLevels(defaultSettings.levels);
    winston.addColors(defaultSettings.colors);

    // Replace the log level with those from settings.
    Logger.transports.console.level = Settings.get('consoleLogLevel', defaultSettings.consoleLevel);
    Logger.transports.file.level = Settings.get('fileLogLevel', defaultSettings.fileLevel);

    return Logger;
}
