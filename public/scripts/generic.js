window.debug = false;

var popup = function (text, title, color) {
    if (text === undefined) {
        text = ""
    }
    if (title === undefined) {
        title = ""
    }
    if (color === undefined) {
        color = "#fff"
    }
    mtext = $("#myModal #modal-text")
    mtext.text(text)
    mtitle = $("#myModal #modal-title")
    mtitle.text(title)
    modal = $("#myModal")
    mhead = $("#myModal #modal-head")
    mhead.css("background-color", color)
    modal.fadeIn()
}

var debugLog = function(msg) {
    if (window.debug) {
        console.log(msg);
    }
}


