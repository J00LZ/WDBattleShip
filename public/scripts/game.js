var socket = new WebSocket("ws://" + window.location.hostname + ":" + window.location.port + "/ws");
let key = null;
let inviteCode = null;
let gameStarted = false;
let gameEnded = false;

console.log("Working with name '" + nickname + "' and code '" + code + "'");

socket.onopen = initConnection;
socket.onmessage = processEvent;
socket.onclose = function () {
    // Only send error message when closing the socket was not intentional
    if (!gameEnded) {
        console.error("Lost connection to server");
        popup(Messages.LOST_CONNECTION, "Error", "#cc0000");
    }
}

let ships = [0, 1, 2, 3, 4, 5]
let hits = [""]

/**
 * Sets waiting message
 */
$(document).ready(function () {
    //TODO: Maybe add a fancy animation

    // Get canvas and try to draw text centered (by subtracting half the width and height from the center of the canvas)
    if (key === null || key === undefined) {
        console.log("Drawing waiting message..");
        let canvas = $("#gameCanvas");
        let x = canvas.width() / 2;
        let y = canvas.height() / 2;

        Drawing.drawText(x, y, "Waiting for opponent..");
    }
});

/**
 * Sends a message using the given socket, if it is save to do so.
 * @param {socket} socket socket to use
 * @param {string} message message to send
 */
function sendSaveMessage(socket, message) {
    if (!gameEnded && socket !== null && socket !== undefined && socket.readyState === 1) {
        socket.send(message);
    }
}

/**
 * Starts the connection with the server.
 */
function initConnection() {
    if (nickname === null || nickname === undefined || nickname.trim() === "") {
        // If this fires the user probably went directly to the game page
        // We don't want that to happen
        socket.close();
        location.href = '/?error=NICK_EMPTY';
        return;
    }

    let req = "NAME=" + nickname;

    if (code !== null && code !== undefined && code.trim() != "") {
        req += "&CODE=" + code;
    }

    sendSaveMessage(socket, req + "&REQUESTGAME=" + private);
}

/**
 * Handles all incoming packets. Will delegate game related packets to the packetHandler method.
 * @see packetHandler
 * @param {string} message 
 */
function processEvent(message) {
    debugLog("Response: " + message.data);

    let packets = message.data.split("&");

    for (let i = 0; i < packets.length; i++) {
        let packetData = packets[i].split("=");

        // Malformed packet, should not happen
        if (packetData.length !== 2) {
            console.error("Received malformed packet from server: " + packetData);
            continue;
        }

        let identifier = packetData[0];
        let value = packetData[1];

        // Let a seperate method handle game-related packets
        if (identifier.startsWith("GAME_SC_")) {
            identifier = identifier.split("_SC_")[1];

            // i dunno, add an illegal packet check here or nah?

            packetHandler(identifier, value);
            return;
        }

        // Let this method handle general packets
        switch (identifier) {
            case "KICK":
                // Client was kicked, so redirect to home page and show error
                location.href = '/?error=' + value;
                break;
            case "START_GAME":
                // Clear waiting message
                console.log("Removing waiting message..")
                Drawing.clearCanvas();

                onStart(value);
                break;
            case "GAME_KEY":
                key = value;
                inviteCode = value.substring(0, 5);

                console.log("Received game key (" + key + ") and invite code (" + inviteCode + ")");
                break;
            default:
                console.error("Received unknown packet: " + identifier);
        }
    }
}

/**
 * Handles all packets related to the game.
 * @param {string} identifier packet identifier
 * @param {string} value packet value
 */
function packetHandler(identifier, value) {
    debugLog("Game related packet (" + identifier + "): " + value)

    // Set flag
    gameStarted = gameStarted || !identifier.includes("READY_OTHER");

    switch (identifier) {
        case "ABORT":
            popup(Messages[value], "Game aborted", "#cc0000");
            break;
        case "INCOMING":
            onIncoming(Number(value.charAt(0)), Number(value.charAt(1)));
            break;
        case "TURN":
            let success = value.split("%").length === 3;
            let x = success ? Number(value.split("%")[2].charAt(0)) : -1;
            let y = success ? Number(value.split("%")[2].charAt(1)) : -1;

            onTurn(value.includes("TRUE"), success ? Number(value.split("%")[1]) : 0, x, y);
            break;
        case "WAIT":
            let miss = value.split("%")[0] === "TRUE";

            onWait(miss, miss ? Number(value.split("%")[1].charAt(0)) : -1, miss ? Number(value.split("%")[1].charAt(1)) : -1);
            break;
        case "READY_OTHER":
            onReady(value === "TRUE");
            break;
        case "WINNER":
            // Check if user won the game
            if (value === "TRUE") {
                popup("You won the game, congratulations!", "Game has ended!", "#DAA520")
            } else {
                popup("You lost the game, better luck next time!", "Game has ended!", "#8A0707")
            }

            gameEnded = true;
            break;
        default:
            // Probs should notify user
            break;
    }
}

/**
 * Abort the game with the given reason.
 * @param {string} reason reason to abort the game
 */
function abortGame(reason) {
    console.log("Aborting game: " + reason);

    sendSaveMessage(socket, "GAME_CS_ABORT=" + reason);
}

/**
 * Deploy a ship.
 * @param {number} shipCode the code of the ship to deploy
 * @param {number} start the coordinate of the 'start' of the ship
 * @param {number} end the coordinate of the 'end' of the ship
 */
function deployShip(shipCode, start, end) {
    console.log("Deploying ship " + shipCode + "from " + start + " to");
    sendSaveMessage(socket, "GAME_CS_DEPLOY=" + shipCode + "%" + start + "%" + end);
}

/**
 * Toggles the ready state of the client. The game will start if both players have toggled to 'ready'.
 */
function toggleReady() {
    console.log(Drawing.canvas.getLayer("back/Ready?").fillStyle)
    var l = (Drawing.canvas.getLayer("back/Ready?").fillStyle === "#F55") || (Drawing.canvas.getLayer("back/Ready?").fillStyle == "rgb(255,85,85)")
    Drawing.canvas.animateLayer("back/Ready?", {
        fillStyle: l ? "#5F5" : "#F55"
    });
    Drawing.canvas.setLayers("boats", {
        draggable: !l
    }).drawLayers()

    console.log("Toggled ready state");
    sendSaveMessage(socket, "GAME_CS_READY=TOGGLE");
}

/**
 * Attacks the possible ship at the given location.
 * Result of the attack will become clear when the onTurn event is fired:
 * If the 'lastAttackHit' param is set to true the attack was a success, otherwise it was a miss.
 * @param {string} coordinate coordinate to attack
 */
function attackShip(coordinate) {
    // Check if it's the player's turn
    if (!myturn || hits.includes(coordinate)) {
        return;
    }
    myturn = false
    hits += coordinate

    console.log("Attacking possible ship at " + coordinate);
    sendSaveMessage(socket, "GAME_CS_ATTACK=" + coordinate);
}

/*
Game-related docs/info:
    Ship codes:
        Carrier: 5
        Battleship: 4
        Cruiser: 3
        Destroyer: 2
        Submarine: 1

    Coordinate formatting:
        XY
        Ex: 00    -> (0,0)
            10    -> (1,0)
            19    -> (1,9)
            (9,9) -> 99
            (3,5) -> 35
            (8,2) -> 82
    
    Event functions:
    onIncoming
        Desc:
            Will be called when the opponent attacks one of your ships
        Params:
            x: X-coordinate
            y: Y-coordinate
    onTurn
        Desc:
            Will be called when the client can make a turn
        Params:
            lastAttackHit: will be true if the last attack by the client was a success (hit a ship)
            lastAttackShip: if the last attack was successful this will be the code of the ship that was hit OR 0 if normal turn
            x: if the last attack was successful this will be the X-coordinate of the attack OR -1 if normal turn
            y: if the last attack was successful this will be the Y-coordinate of the attack OR -1 if normal turn
    onWait
        Desc:
            Will be called when the opponent is making a move
        Params:
            miss: This param will be set to true if this wait is caused by a missed attack, false otherwise.
            x: This param will be set to the X-coordinate of the failed attack if this wait is caused by a missed attack. -1 if not caused by a missed attack
            y: This param will be set to the Y-coordinate of the failed attack if this wait is caused by a missed attack. -1 if not caused by a missed attack
    onReady
        Desc:
            Will be called when the opponent toggled his/her ready state
        Params:
            opponentReady: true if the opponent is ready, false otherwise
    onStart
        Desc:
            Will be called when the game starts
        Params:
            opponentName: the opponent's name
*/

var myturn = false

onIncoming = function (x, y) {
    console.log("Incoming attack at " + x + ", " + y);

    Drawing.miss(10 + 50 * x, 70 + 50 * y);
}

onTurn = function (lastAttackHit, lastAttackShip, x, y) {
    myturn = true
    console.log("Client can make a move, last attack was " + (lastAttackHit ? "a hit on ship " + lastAttackShip + " at (" + x + ", " + y + ")" : "not a hit"));
    Drawing.canvas.animateLayer("txt/opponent", {
        fillStyle: "black"
    }).drawLayers()
    // Check if the last attack was successfull
    if (lastAttackHit) {
        Drawing.hit(Drawing.canvas.width() - 10 - 50 * 10 + 50 * x, 70 + 50 * y)

        if ((--ships[lastAttackShip]) === 0) {
            Drawing.canvas.setLayer("txt/hitship", {
                fillStyle: 'black',
                text: "Destroyed Ship " + lastAttackShip
            }).drawLayers()
        }
    }

    Drawing.canvas.animateLayer("txt/It is your turn!", {
        fillStyle: 'black',
        index: 5
    }).animateLayer("txt/Opponents turn!", {
        fillStyle: 'white',
        index: -5
    }).drawLayers();
}

onWait = function (miss, x, y) {
    console.log("Opponent is making a move. This wait is " + (!miss ? "not " : "") + "caused by a missed attack " + (miss ? "at (" + x + "," + y + ")" : ""));


    if (miss) {
        Drawing.miss(Drawing.canvas.width() - 10 - 50 * 10 + 50 * x, 70 + 50 * y)
    }

    Drawing.canvas.setLayer("txt/hitship", {
        fillStyle: 'white'
    })

    Drawing.canvas.animateLayer("txt/opponent", {
        fillStyle: "black"
    }).drawLayers()

    Drawing.canvas.animateLayer("txt/It is your turn!", {
        fillStyle: 'white',
        index: -5
    }).animateLayer("txt/Opponents turn!", {
        fillStyle: 'black',
        index: 5
    }).drawLayers();
}

onReady = function (opponentReady) {
    console.log("Opponent changed ready status: " + opponentReady);
    Drawing.canvas.animateLayer("txt/opponent", {
        fillStyle: opponentReady ? "#4caf50" : "black"
    }).drawLayers()
}

onStart = function (opponentName) {
    console.log("Start game with opponent '" + opponentName + "'");

    Drawing.drawText((50 * 10 + 10) / 2, 30, nickname, "you")
    Drawing.drawText(Drawing.canvas.width() - 10 - 5 * 50, 30, opponentName, "opponent")
    Drawing.drawBoard(10, 70, 10)
    Drawing.drawBoard(Drawing.canvas.width() - 10 - 50 * 10, 70, 10, attackShip)

    // Drawing.
    Drawing.drawShip(10, 620, 1)
    Drawing.drawShip(260, 570, 2)
    Drawing.drawShip(360, 570, 3)
    Drawing.drawShip(60, 620, 4)
    Drawing.drawShip(10, 570, 5)

    let x = Drawing.canvas.width() / 2;
    let y = Drawing.canvas.height() - Drawing.canvas.height() / 8;
    Drawing.button(x, y, "Ready?", manageReady)

    let texty = Drawing.canvas.height() / 5;
    Drawing.drawText(x, texty, "It is your turn!")
    Drawing.drawText(x, texty + 45, "Opponents turn!")
    Drawing.drawText(Drawing.canvas.width() / 2, Drawing.canvas.height() / 2 + Drawing.canvas.height() / 8, "Destroyed ship x", "hitship")

    Drawing.canvas.setLayer("txt/It is your turn!", {
        fillStyle: 'white'
    }).setLayer("txt/Opponents turn!", {
        fillStyle: 'white'
    }).setLayer("txt/hitship", {
        fillStyle: 'white'
    }).drawLayers();
}

function manageReady() {
    // Make sure users cannot click this button while in-game or after the game has ended
    if (gameStarted || gameEnded) {
        return;
    }

    var boats = Drawing.canvas.getLayers(function (layer) {
        return (layer.draggable === true);
    });

    if (!Drawing.inBoard(10, 70, 10)) {
        popup("Please all of your ships inside the grid!", "Board not ready!", "#cc0000");
        return;
    } else if (Drawing.overlap()) {
        popup("Please make sure your ships don't overlap!", "Overlapping ships!", "#cc0000");
        return;
    }
    for (b in boats) {
        var boat = boats[b];
        var startx = (boat.x - 20) / 50;
        var starty = (boat.y - 80) / 50;
        var start = starty + startx * 10;
        // console.log(start)

        // console.log("x=" + boat.x + ", w =" + boat.width)
        var endx = (boat.x + boat.width - 50) / 50;
        // console.log(endx)

        // console.log("y=" + boat.y + ", h =" + boat.height)
        var endy = (boat.y + boat.height - 80 - 30) / 50;
        // console.log(endy)
        var end = endy + endx * 10;
        // console.log(end)

        var scode = Math.max(Math.abs(startx - endx), Math.abs(starty - endy)) + 1;
        // console.log("SCode=" + scode)
        // console.log("")
        if (start < 10) {
            start = "0" + start;
        }
        if (end < 10) {
            end = "0" + end;
        }
        deployShip(scode, start, end);
    }

    toggleReady();
}