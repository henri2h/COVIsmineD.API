import fs from "fs";

// variables
var fileName = "data.json";

// functions

export function createData() {
    var params = {
        cert: "path to certificate.crt",
        certKey: "path to certificate.key",
        appToken: ""
    };

    fs.writeFileSync(fileName, JSON.stringify(params, null, "\t"), "utf8");

    // eslint-disable-next-line no-console
    console.log("Initialised : data.json created");
}


export function getData() {
    try {
        return JSON.parse(fs.readFileSync(fileName, "utf8"));
    }
    catch (error) {
        if (error.code === "ENOENT") {
            createData();
        }
        return "created";
    }
}

export function getUserToken() {
    return getData().appToken;
}

export function isTokenValid(token) {
    var validToken = getUserToken();
    if (token === validToken) {
        return true;
    }
    return false;
}


export function isTokenValidOrWarn(req, token, logger) {

    var isValid = isTokenValid(token);
    if (!isValid) {
        logger.warn(req.ip + " : wrong token");
        //TODO : ban user if too many wrong token guess
    }
}

export function generateUUIDv4() { // not the best implementation of the specification but will satisfy the need for a token here
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
