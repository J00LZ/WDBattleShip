var socket = new WebSocket("ws://localhost:3000/ws/");

let bod = $('body');
let jCanvas = $('#gameCanvas');
let canvas = jCanvas[0];
let key = null;
let inviteCode = null;

// Form data
// let url = new URL(window.location.href);
// let nickname = url.searchParams.get("nickname");
// let code = url.searchParams.get("code");
// console.log(a);

// bod.css("background-color", "rgb(180, 180, 180)");
// jCanvas.css("background-color", "rgb(0, 0, 0)");

console.log("Working with name '" + nickname + "' and code '" + code + "'");

socket.onopen = initConnection;
socket.onmessage = processEvent;
socket.onclose = function() {
    console.error("Lost connection to server");
    
    // TODO: Css popup or something?
}

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

/*
Handles incoming packets
*/
function processEvent(message) {
    console.log("Response: " + message.data);

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
                // Opponent was found, game is started
                console.log("Start game with opponent '" + value + "'");
                //TODO: Render things and start some listeners or something
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

    //TODO: Implement packet handling
}

function packetHandler(identifier, value) {
    console.log("Game related packet (" + identifier + "): " + value)

    switch (identifier) {
        case "ABORT":
            //TODO: Maybe use some fancy css popup instead
            location.href = '/?error=' + value;
            break;
        case "INCOMING":
            //TODO: Implement
            break;
        case "TURN":
            //TODO: Implement
            break;
        case "READY_OTHER":
            //TODO: Implement
            break;
        case "WINNER":
            //TODO: Implement
            break;
        default:
            // Probs should notify user
            break;
    }
}

/*
Game-related packets:

    Server will understand the following packets from client:

    GAME_CS_ABORT=<reason from messages.js>                                     Game will be aborted and other player will receive a message
    GAME_CS_DEPLOY=<code of ship>%<coord of front ship>%<coord of back ship>    Server will deploy a ship of the given type on the given location
    GAME_CS_READY=TOGGLE                                                        Toggle ready status, game phase will start if both players have flagged
    GAME_CS_ATTACK=<coord of attack>                                            Server will register an attack on the given location

    Server will send the following packets to client:

    GAME_SC_ABORT=<reason from messages.js>                                     Other client has aborted the game, reason is supplied
    GAME_SC_INCOMING=<coord of incoming attack>                                 An attack on the given location by the opponent was registered
    GAME_SC_READY_OTHER=<TRUE/FALSE>                                            Ready status of opponent
    GAME_SC_WINNER=<TRUE/FALSE>                                                 Game has ended, value indicitates whether player won or not
    GAME_SC_TURN=<TRUE/FALSE>                                                   Client can make a move. TRUE as value indicates the previous attack was a hit,
                                                                                so the client can make another move. FALSE means it's just a regular turn.
    GAME_SC_WAIT=TRUE                                                           Opponent is making a move

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
*/

/* Starting game */
//TODO: Start game