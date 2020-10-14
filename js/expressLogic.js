import fs from "fs";

var express = require("express");

var http = require("http");
var https = require("https");

import { getData } from "./server";

var logger;
var db;

export function isTokenValid(username, token, next) {
    var sql = "SELECT * FROM users WHERE username = ?";
    var params = [username];

    db.all(sql, params, (err, result) => {
        if (err) {
            logger.error(err);
        }
        if (result[0].token == token) {
            next(true);
        }
        else {
            next(false);
        }

    });
}

export function setLogger(loggerIn, dbin) {
    logger = loggerIn;
}

export function setDatabase(dbin) {
    db = dbin;
}

export function setError(err, res) {
    logger.error(err);
    res.status(400).json({ "success": false, "error": err.message });
}

export function setResult(rows, res) {
    res.json({
        "message": "success",
        "data": rows
    });
}

export function queryCallback(err, rows, res) {
    if (err) {
        setError(err, res);
    } else {
        setResult(rows, res);
    }
}

export function createExpress(logger) {
    var app = express();

    // creating express logic
    const bodyParser = require("body-parser");
    app.use(
        bodyParser.urlencoded({
            extended: true
        })
    );
    app.use(bodyParser.json());

    // adding logging in express
    var securityCheck = function (req, res, next) {
        // exceptions : 
        if (req.url == "/news" || req.url == "/signup" || req.url == "/login" || req.url == "/getlevels") {
            next();
        }
        // check if token is valid
        else {
            isTokenValid(req.body.username, req.body.token, (result) => {
                if (result) {
                    logger.info(req.ip + " : " + req.url);
                    next();
                }
                else {
                    try {
                        logger.warn(req.ip + " : wrong token " + req.url);
                        throw new Error(JSON.stringify({
                            "success": false,
                            "reason": "wrong token"
                        }));
                    }
                    catch (err) {
                        next(err);
                    }
                }
            });
        }
    };

    app.use(securityCheck);
    // error handler
    app.use(function (err, req, res, next) {
        res.status(400).send(err.message);
    });

    return app;
}

export function runExpress(app, logger) {

    // detect if we can enable https
    var credentials;
    var httpsEnabled = false;
    try {
        var data = getData();
        var privateKey = fs.readFileSync(data.certKey, "utf8");
        var certificate = fs.readFileSync(data.cert, "utf8");
        httpsEnabled = true;

        credentials = { key: privateKey, cert: certificate };
    } catch (error) {
        logger.warn("Could not get certificate. Https disabled.");
    }


    // start server
    // https only if enabled, fallback to http
    if (httpsEnabled) {
        var httpsServer = https.createServer(credentials, app);
        httpsServer.listen(8073, function () {
            var host = httpsServer.address().address;
            var port = httpsServer.address().port;
            logger.info("Bridge listening securely at https://" + host + ":" + port);
        });
    }
    else {
        var httpServer = http.createServer(app);
        httpServer.listen(8070, function () {
            var host = httpServer.address().address;
            var port = httpServer.address().port;
            logger.warn("Bridge listening (not secure !!!! for developpement purpose only) at http://" + host + ":" + port);
        });
    }


}