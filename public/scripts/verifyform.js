var socket = new WebSocket("ws://localhost:3000/ws");

$(document).on('click', '#submit-game-form', function(event){
    event.preventDefault();

    let formData = $("#play-form").serializeArray();
    let data = {};

    $(formData).each(function(i, field){
        data[field.name] = field.value;
    });

    let nickname = data['nickname'].trim();
    let code = data['code'].trim();
    let illegalChars = ['&', '/', '=', ':'];
    let validInput = true;

    // Check nickname
    let i = nickname.length;
    while (i-- && validInput){
        let char = nickname.charAt(i);

        if (illegalChars.includes(char)){
            displayError(Messages.INVALID_CHAR.replace("%char%", char).replace("%target%", "name"));
            validInput = false;
        }
    }


    // Check code
    let pattern = new RegExp("^[0-9|a-z]{5}$"); // exactly five 5 digits or letters
    let regTest = pattern.test(code);

    // Check if regex failed and there was some input
    if (!regTest && code.trim() !== ""){
        displayError(Messages.ILLEGAL_INVITE);
        validInput = false;
    }

    if (validInput){
        if (nickname.trim() !== ""){
            console.log("Verifying name '" + nickname + "' & code '" + code + "'");
            verifyData(nickname, code);
        } else {
            displayError(Messages.NICK_EMPTY);
        }
    }
});

// Check if we need to display any errors from the game
$(document).ready(function(){
    let url = new URL(window.location.href);
    let error = url.searchParams.get("error");

    if (error !== null && error !== undefined && error.trim() !== "") {
        //TODO: Maybe add something to fancify these messages a bit
        let errorMessage = Messages[error];

        if (errorMessage !== "undefined" && errorMessage !== undefined && errorMessage !== null){
            displayError(errorMessage);

            // Quick fix to only show error messages once, doesn't look pretty. Maybe replace all error messages by a css popup?
            window.history.pushState({}, document.title, "/");
        } else {
            console.error("Recieved invalid error code: " + error);
        }
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
                    displayError(Messages.NICK_TAKEN);
                }
                break;
            case "verify-invite-rsp":
                // Check if code was valid
                if (resp === "TRUE"){
                    submitForm();
                } else {
                    // Name not available, notify user
                    displayError(Messages.INVALID_INVITE);
                }
                break;
            case "verify-err":
                displayError(Messages[resp]);
                break;
            default:
            // Ignore
            break;
        }

        
    }
}