/********************************** DATABASE **********************************/
var nedb = require('nedb');

var db = {};
db.events = new nedb({ filename: 'db/events.db', autoload: true });

module.exports = db;