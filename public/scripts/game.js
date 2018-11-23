var socket = new WebSocket("ws://localhost:3000");

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

function initConnection(){
    let req = "NAME=" + nickname;

    if (code !== ""){
        req += "&CODE=" + code;
    }

    socket.send(req);
}

function processEvent(message){
    console.log("Response:" + message.data);

    //TODO: Implement packet handling
    //TODO: Implement soemthing to return to home page incase something failed
}


/* Starting game */
//TODO: Start game