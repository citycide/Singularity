/********************************** DATABASE **********************************/
var nedb = require('nedb');

var db = {};
db.events = new nedb({ filename: 'db/events.db', autoload: true });

db.events.count({}, function (err, count) {
    // console.log(count);
});

module.exports = db;