/********************************** DATABASE **********************************/
'use strict';

import jetpack from 'fs-jetpack';
import moment from 'moment';
const sql = require('sql.js');

const dbstore = (fileName) => {
    if (!fileName) return null;

    let store = {};
    let db;

    store.write = () => {
        try {
            let binArray = db.export();
            let fileBuffer = new Buffer(binArray);
            jetpack.write(fileName, fileBuffer);
            return true;
        } catch(err) {
            Logger.error(err);
            return false;
        }
    };

    store.select = (query) => {
        try {
            let response = db.exec(query);
            return {array: response, object: makeObj(response), erbject: eventObj(response)};
        } catch(err) {
            Logger.error(err);
            return false;
        }
    };

    store.run = (query) => {
        try {
            db.run(query);
            store.write();
            return true;
        } catch (err) {
            if (err.message === 'UNIQUE constraint failed: commands.name') return Logger.absurd('ERR in addCommand:: Command already exists.');
            Logger.error(err);
            return false;
        }
    };

    store.get = (query) => {
        try {
            let response = db.exec(query);
            return response;
        } catch (err) {
            Logger.error(err);
            return false;
        }
    };

    try {
        // let file = fs.readFileSync(fileName);
        let file = jetpack.read(fileName, 'buffer');
        db = new sql.Database(file);
    } catch(err) {
        Logger.error(err);
        db = new sql.Database();
        store.write();
    }

    const makeObj = (dataset) => {
        let output = { followers: [] };
        for (let j = 0; j < dataset.length; j++) {
            for (let i = 0; i < dataset[j].values.length; i++) {
                let thisFollower = {
                    name: dataset[j].values[i][1],
                    time: moment(dataset[j].values[i][2], 'x').fromNow()
                    // notifications: dataset[j].values[i][4]
                };
                output.followers.push(thisFollower);
            }
        }
        return output;
    };

    const eventObj = (dataset) => {
        let output = { events: [] };
        for (let j = 0; j < dataset.length; j++) {
            let thisEvent = {
                name: dataset[j][1],
                time: moment(dataset[j][2], 'x').fromNow(),
                type: dataset[j][3]
            };
            output.events.push(thisEvent);
        }
    };

    store.newFollowerObj = (follower) => {
        return {
            name: follower.display_name,
            time: moment(follower.created_at, 'x').fromNow()
        };
    };
    return store;
};

module.exports = dbstore;
module.exports.bot = {
    get: (query) => {
        // die bot
    }
};