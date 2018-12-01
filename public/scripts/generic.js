
var popup = function (text, title) {
    if (text === undefined) {
        text = ""
    }
    if (title === undefined) {
        title = ""
    }
    mtext = $("#myModal #modal-text")
    mtext.text(text)
    mtitle = $("#myModal #modal-title")
    mtitle.text(title)
    modal = $("#myModal")
    modal.fadeIn()

}


