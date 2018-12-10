var socket = new WebSocket("ws://localhost:3000/ws/");

let key = null;
let inviteCode = null;

console.log("Working with name '" + nickname + "' and code '" + code + "'");

socket.onopen = initConnection;
socket.onmessage = processEvent;
socket.onclose = function() {
    console.error("Lost connection to server");
    popup(Messages.LOST_CONNECTION, "Error", "#cc0000");
}

/**
 * Sets waiting message
 */
$(document).ready(function(){
    //TODO: Maybe add a fancy animation

    // Get canvas and try to draw text centered (by subtracting half the width and height from the center of the canvas)
    if (key === null || key === undefined) {
        console.log("Drawing waiting message..");
        let canvas = $("#gameCanvas");
        let x = canvas.width() / 2 - 205;
        let y = canvas.height() / 2 - 45;
    
        Drawing.drawText(x, y, "Waiting for opponent..");
    }
});

/*
Starts connection to game manager
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

    socket.send(req + "&REQUESTGAME=" + private);
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
    socket.send("GAME_CS_ABORT=" + reason);
}

/**
 * Deploy a ship.
 * @param {number} shipCode the code of the ship to deploy
 * @param {number} start the coordinate of the 'start' of the ship
 * @param {number} end the coordinate of the 'end' of the ship
 */
function deployShip(shipCode, start, end) {
    console.log("Deploying ship " + shipCode + "from " + start + " to");
    socket.send("GAME_CS_DEPLOY=" + shipCode + "%" + start + "%" + end);
}

/**
 * Toggles the ready state of the client. The game will start if both players have toggled to 'ready'.
 */
function toggleReady() {
    console.log("Toggled ready state");
    socket.send("GAME_CS_READY=TOGGLE");
}

/**
 * Attacks the possible ship at the given location.
 * Result of the attack will become clear when the onTurn event is fired:
 * If the 'lastAttackHit' param is set to true the attack was a success, otherwise it was a miss.
 * @param {number} coordinate coordinate to attack
 */
function attackShip(coordinate) {
    console.log("Attacking possible ship at " + coordinate);
    socket.send("GAME_CS_ATTACK=" + coordinate);
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

//TODO: Implement default functions
onIncoming = function(x, y) {
    console.log("Incoming attack at " + x + ", " + y);
}

onTurn = function(lastAttackHit, lastAttackShip, x, y) {
    console.log("Client can make a move, last attack was " + (lastAttackHit ? "a hit on ship " + lastAttackShip + " at (" + x + ", " + y + ")": "not a hit"));
}

onWait = function(miss, x, y) {
    console.log("Opponent is making a move. This wait is " + (!miss ? "not " : "") + "caused by a missed attack " + (miss ? "at (" + x + "," + y + ")" : ""));
}

onReady = function(opponentReady) {
    console.log("Opponent changed ready status: " + opponentReady);
}

onStart = function(opponentName) {
    console.log("Start game with opponent '" + opponentName + "'");
}


/* Rendering canvas */


/* Starting game */
//TODO: Start game