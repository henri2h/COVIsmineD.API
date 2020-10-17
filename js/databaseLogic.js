
const sqlite3 = require("sqlite3").verbose();

export function createDatabase(logger) {
    // application
    let db = new sqlite3.Database("./server.db", (err) => {
        if (err) {
            return logger.error(err);
        }
        logger.info("Connected to the in-memory SQlite database.");
    });

    db.serialize(function () {
        // create table devices
        // device id : autommaticaly generated id for the device (UUID) : prevent other people form firguring out too easly
        db.run("CREATE TABLE if not exists Users (id INTEGER NOT NULL PRIMARY KEY, username NOT NULL TEXT UNIQUE, name TEXT, lastname TEXT, passwordhash TEXT, power NOT NULL INTEGER, level NOT NULL INTEGER, token text, admin integer)");

        // create table commands
        // device name : id of the computer host
        // username : id of the user having asked for this request
        // client id : id of the device having with wich the user has resquest this command
        // i.e : the device to wich we must give the result
        db.run("CREATE TABLE if not exists News (id INTEGER NOT NULL PRIMARY KEY, title TEXT NOT NULL, content TEXT, date TEXT, author TEXT)");
    });
    return db;
}