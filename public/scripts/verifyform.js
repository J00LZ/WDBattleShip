var socket = new WebSocket("ws://localhost:3000");

$(document).on('click', '#submit-game-form', function(event){
    event.preventDefault();

    let formData = $("#play-form").serializeArray();
    let data = {};

    $(formData).each(function(i, field){
        data[field.name] = field.value;
    });

    let nickname = data['nickname'].trim();
    let code = data['code'].trim();

    if (nickname.trim() !== ""){
        console.log("Verifying name '" + nickname + "' & code '" + code + "'");
        verifyData(nickname, code);
    } else {
        displayError("Nickname cannot be empty!");
    }
});

// Check if we need to display any errors from the game
$(document).ready(function(){
    let url = new URL(window.location.href);
    let error = url.searchParams.get("error");

    if (error.trim() !== "" && error !== null && error !== undefined){
        //TODO: Implement error messages. For now just a simple echo
        displayError(error);
    }
});

/*
Everything was correctly filled in, submitting the form
*/
function submitForm(){
    socket.close();
    $("form#play-form").submit();
}

/*
Display an error message
*/
function displayError(errormsg){
    $("#error-msg").remove();

    $("div #error-box").append('<p id="error-msg" style="color: red" hidden>Error: ' + errormsg + '</p>');
    $("#error-msg").fadeIn(300);
}

/*
Checks if name is available
*/
function verifyData(nickname, code){
    socket.send("verify-name:" + nickname);

    socket.onmessage = function(message){
        console.log("Response: " + message.data);

        let identifier = message.data.split(":")[0];
        let resp = message.data.split(":")[1];

        switch (identifier){
            case "verify-name-rsp":
                // Check if name was available
                if (resp === "TRUE" && code === ""){
                    submitForm();
                } else if (resp === "TRUE" && code !== ""){
                    socket.send("verify-invite:" + code);
                } else {
                    // Name not available, notify user
                    displayError("That name is currently already in use!");
                }
                break;
            case "verify-invite-rsp":
                // Check if code was valid
                if (resp === "TRUE"){
                    submitForm();
                } else {
                    // Name not available, notify user
                    displayError("Invalid invite code!");
                }
                break;
            default:
            // Ignore
            break;
        }

        
    }
}