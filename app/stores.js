/********************************** DATABASE **********************************/
const fs = require('fs'),
      sql = require('sql.js'),
      emitter = require('./emitter'),
      moment = require('../public/js/vendor/moment.min.js');

function dbstore(fileName) {
    if (!fileName) return null;

    let store = {};
    let db;

    store.write = function() {
        try {
            let binArray = db.export();
            let fileBuffer = new Buffer(binArray);
            fs.writeFile(fileName, fileBuffer);
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    };

    store.select = function(query) {
        try {
            let response = db.exec(query);
            return {array: response, object: makeObj(response), erbject: eventObj(response)};
        } catch(err) {
            console.log(err);
            return false;
        }
    };

    store.run = function(query) {
        try {
            db.run(query);
            store.write();
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    };

    try {
        let file = fs.readFileSync(fileName);
        db = new sql.Database(file);
    } catch(err) {
        console.log(err);
        db = new sql.Database();
        store.write();
    }

    function makeObj(dataset) {
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
    }

    function eventObj(dataset) {
        let output = { events: [] };
        for (let j = 0; j < dataset.length; j++) {
            let thisEvent = {
                name: dataset[j][1],
                time: moment(dataset[j][2], 'x').fromNow(),
                type: dataset[j][3]
            };
            output.events.push(thisEvent);
        }
    }

    store.newFollowerObj = function(follower) {
        return {
            name: follower.display_name,
            time: moment(follower.created_at, 'x').fromNow()
        };
    };
    return store;
}

module.exports = dbstore;