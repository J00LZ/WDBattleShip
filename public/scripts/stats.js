var statsock = new WebSocket("ws://localhost:3000/ws");
statsock.onclose = function(s){
    console.log("Shuting down ws!");
}
statsock.onopen = sendStatRequest;
statsock.onmessage = processStats;

var stat_playersOnline = 1;
var stat_GamesInProgress = 0;
var stat_GamesPlayedToday = 0;
var stat_GamesPlayedTotal = 0;

var lastUpdate = 0;
var updateTime = 5 * 1000;

/*
Sends the request for all stats
*/
function sendStatRequest(){
    if (statsock.readyState === statsock.OPEN){
        statsock.send("STATS=PLAYERS_ONLINE&STATS=GAMES_IN_PROGRESS&STATS=GAMES_PLAYED_TODAY&STATS=GAMES_PLAYED_TOTAL");
    }
}

/*
Handles the incoming stat packets
*/
function processStats(message){
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
            case "PLAYERS_ONLINE":
                stat_playersOnline = value;
                break;
            case "GAMES_IN_PROGRESS":
                stat_GamesInProgress = value;
                break;
            case "GAMES_PLAYED_TODAY":
                stat_GamesPlayedToday = value;
                break;
            case "GAMES_PLAYED_TOTAL":
                stat_GamesPlayedTotal = value;
                break;
            default:
                console.error("Received unknown packet: " + identifier);
        }

        lastUpdate = 0;
    }
}

function updateStats(){
    // $("#stats").find("p").each(function(){
    //     let statID = $(this).attr("id");

    //     $(this).find("span").text(window[statID]);
    // });
    $("#stats").find("span").each(function(){
        let statID = $(this).attr("id");
        $(this).text(window[statID]);
    })

    if (lastUpdate >= 4){
        // No update for 5 seconds, server is not responding/dead
        if (!$("#error-msg").length)
        {
            $("div #error-box-stats").append('<p id="error-msg" style="color: red" hidden>Warning: Stats are no longer live, server has stopped responding! Try reloading the page</p>');
            $("#error-msg").fadeIn(300);
        }
    }
}

// Start task
$(document).ready(function(){
    // Update once
    updateStats();

    // Repeat
    setInterval(function(){
        sendStatRequest();

        // Creating a small gap for the stats to be returned by the server
        setTimeout(function(){
            updateStats();
        }, 500);
        lastUpdate += 1;
    }, updateTime);  
});