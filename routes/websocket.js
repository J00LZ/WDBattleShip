var express = require('express');
var router = express.Router();

// Game manager
var GameManager = require('../server/gamemanager');
var Player = require('../server/player');
var gameManager = new GameManager();

router.ws("/", function (sock, req) {
    console.log("Incoming connection from: " + req.connection.remoteAddress);

    let player = new Player(sock);
    gameManager.addPlayer(player, req.connection.remoteAddress);

    sock.on("message", function (message) {
        console.log("Message (" + req.connection.remoteAddress + "): " + message)

        // Check if it's a special req
        if (message.startsWith("verify-name:")) {
            if (message.split(":").length !== 2) {
                // Invalid packet
                sock.send("verify-err:MALFORMED_PACKET");
                return;
            }

            let name = message.split(":")[1];
            let response = "verify-name-rsp:";

            // Check if name is valid
            if (!gameManager.validName(sock, name)) {
                console.log("DWAd");
                return;
            }

            if (gameManager.nameAvailable(name)) {
                response += "TRUE";
            } else {
                response += "FALSE";
            }

            sock.send(response);
        } else if (message.startsWith("verify-invite:")) {
            if (message.split(":").length !== 2) {
                // Invalid packet
                sock.send("verify-err:MALFORMED_PACKET");
                return;
            }

            let code = message.split(":")[1];
            let response = "verify-invite-rsp:";

            if (gameManager.validInviteCode(code)) {
                response += "TRUE";
            } else {
                response += "FALSE";
            }

            sock.send(response);
        } else {
            // Not special, let the game manager handle it
            gameManager.handleRequest(sock, message);
        }
    });

    sock.on("close", function () {
        console.log("Closed connection from: " + req.connection.remoteAddress);
        gameManager.removePlayer(sock);
    });

});

module.exports = router;