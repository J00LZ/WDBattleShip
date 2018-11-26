var socket = new WebSocket("ws://localhost:3000/ws/");

let bod = $('body');
let jCanvas = $('#gameCanvas');
let canvas = jCanvas[0];

// Form data
let url = new URL(window.location.href);
let nickname = url.searchParams.get("nickname");
let code = url.searchParams.get("code");

//bod.css("background-color", "rgb(180, 180, 180)");
//jCanvas.css("background-color", "rgb(0, 0, 0)");

console.log("Working with name '" + nickname + "' and code '" + code + "'");

socket.onopen = initConnection;
socket.onmessage = processEvent;

/*
Starts connection to game manager
*/
function initConnection(){
    if (nickname === null || nickname === undefined || nickname.trim() === ""){
        // If this fires the user probably went directly to the game page
        // We don't want that to happen
        socket.close();
        location.href = '/?error=NICK_EMPTY';
        return;
    }

    let req = "NAME=" + nickname;

    if (code !== null && code !== undefined && code.trim() != ""){
        req += "&CODE=" + code;
    }

    socket.send(req + "&REQUESTGAME=TRUE");
}

/*
Handles incoming packets
*/
function processEvent(message){
    console.log("Response:" + message.data);

    let packets = message.data.split("&");

    for (let i = 0; i < packets.length; i++){
        let packetData = packets[i].split("=");

        // Malformed packet, should not happen
        if (packetData.length !== 2){
            console.error("Received malformed packet from server: " + packetData);
            continue;
        }

        let identifier = packetData[0];
        let value = packetData[1];

        switch (identifier){
            case "KICK":
                // Client was kicked, so redirect to home page and show error
                location.href = '/?error=' + value;
                break;
            default:
                console.error("Received unknown packet: " + identifier);
        }
    }

    //TODO: Implement packet handling
}


/* Starting game */
//TODO: Start game