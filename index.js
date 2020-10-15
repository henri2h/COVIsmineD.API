import { generateUUIDv4, getData } from "./js/server";
import { createExpress, runExpress, setError, setLogger, setDatabase, queryCallback } from "./js/expressLogic.js";
import { createCustomLogger } from "./js/logger";
import { createDatabase } from "./js/databaseLogic";

const bcrypt = require('bcrypt');

const logger = createCustomLogger();

// update libraries
setLogger(logger);

// detect if first time run
// first run ?
if (getData() === "created") {
    var text = "\n";
    text += "####################################################\n";
    text += "#  data.json created : Please fill and restart...  #\n";
    text += "####################################################\n";
    text += " \n";

    // eslint-disable-next-line no-console
    console.log(text);

    process.exit();
}

var db = createDatabase(logger);
var app = createExpress(logger);

setDatabase(db);


// news
app.get("/news", (req, res, next) => {
    var sql = "select * from news order by date desc";
    db.all(sql, (err, rows) => queryCallback(err, rows, res));
});

app.get("/cas", (req, res, next) => {
    var sql = "select count(*) as cas from users";
    db.all(sql, (err, rows) => queryCallback(err, rows, res));
});


app.post("/addnews", (req, res, next) => {
    var sql = "INSERT INTO news (title, content, date, author) VALUES (?, ?, ?, ?)";

    // get username
    var username = req.body.username;
    // TODO : check if the username should have access to this computer (device_id)

    var date = new Date().getTime().toString(); // get time

    var params = [req.body.title, req.body.content, date, req.body.username];
    db.run(sql, params, (err, rows) => queryCallback(err, rows, res));
});
app.post("/updatenews", (req, res, next) => {
    var sql = "update news   set title = ?, content = ?, date = ?, author = ? where id =?";

    // get username
    var username = req.body.username;
    // TODO : check if the username should have access to this computer (device_id)

    var date = new Date().getTime().toString(); // get time

    var params = [req.body.id, req.body.title, req.body.content, date, req.body.username];
    db.run(sql, params, (err, rows) => queryCallback(err, rows, res));
});

app.post("/deletenews", (req, res, next) => {
    var sql = "delete from news where id =?";
    var params = [req.body.id];
    db.run(sql, params, (err, rows) => queryCallback(err, rows, res));
});





// user
// add a command
app.post("/signup", (req, res, next) => {
    var sql = "INSERT INTO users (username, passwordhash, token, level) VALUES (?, ?, ?, 0)";

    // get username
    var username = req.body.username;
    var password = req.body.password;

    var token = generateUUIDv4();
    var saltround = 12;

    bcrypt.hash(password, saltround).then(function (hash) {
        var params = [username, hash, token];
        db.run(sql, params, (err, rows) => queryCallback(err, rows, res));
    });;


});


app.post("/login", (req, res, next) => {
    var sql = "SELECT * FROM users WHERE username = ?";
    var params = [req.body.username];
    db.all(sql, params, (err, result) => {
        if (err) {
            setError(err, res);
        }
        console.log(result);
        
        if (result !== undefined) {
            bcrypt.compare(req.body.password, result[0]["passwordhash"]).then(function (match) {
                if (match) {
                    res.json({
                        "message": "success",
                        "token": result[0].token
                    });
                }
                else {
                    res.json({
                        "message": "failed",
                        "reason": "wrong password"
                    });
                }
            });;

        }

    });
});

app.post("/setlevel", (req, res, next) => {
    var sql = "UPDATE users SET level = ? WHERE username = ?";

    var params = [req.body.level, req.body.username];
    db.run(sql, params, (err, result) => {
        if (err) {
            setError(err, res);
        }
        res.json({
            "message": "success"
        })
    });
});

app.get("/getlevels", (req, res, next) => {
    var sql = "SELECT username, level FROM users";
    var params = [];
    db.all(sql, params, (err, rows) => queryCallback(err, rows, res));
});



// client
app.get("/getDevices", (req, res, next) => {
    var sql = "SELECT * FROM Devices";
    var params = [];
    db.all(sql, params, (err, rows) => queryCallback(err, rows, res));
});

// get commands
app.get("/getCommands", (req, res, next) => {
    var sql = "SELECT * FROM Commands WHERE DeviceID = ? AND Executed = 0";
    var params = [req.body.id];
    db.all(sql, params, (err, rows) => queryCallback(err, rows, res));
});

// machine
app.post("/setCommandResult", (req, res, next) => {
    var sql = "UPDATE Commands SET Result = ?, ResultDate = ?, Executed = 1 WHERE CommandID = ?";
    var resultDate = new Date().getTime().toString(); // get time

    var params = [req.body.result, resultDate, req.body.commandID];
    db.run(sql, params, (err, result) => {
        if (err) {
            setError(err, res);
        }
        res.json({
            "message": "success",
            "id": this.lastID
        })
    });
});


// add device
app.post("/addDevice/", (req, res, next) => {
    var errors = [];
    if (!req.body.name) {
        errors.push("No name specified");
    }
    if (errors.length) {
        res.status(400).json({ "success": false, "error": errors.join(",") });
        return;
    }
    var data = {
        name: req.body.name
    };

    var token = generateUUIDv4();

    var sql = "INSERT INTO devices (DeviceName, DeviceToken) VALUES (?,?)";
    var params = [data.name, token];

    // send back data to device
    data.token = token;

    db.run(sql, params, function (err, result) {
        if (err) {
            setError(err, res);
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id": this.lastID, // not really usefull.. to delete
            token
        });
    });
});


runExpress(app, logger);

// should close the database
// db.close();
