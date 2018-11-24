(function(exports){
    // Messages related to joining games
    exports.INVALID_INVITE = "Invalid invite code!";
    exports.ILLEGAL_INVITE = "Please enter a valid invite code!";
    exports.NICK_TAKEN ="That nickname is already in use!";
    exports.INVALID_CHAR ="The character %char% cannot be used in your %target%!";
    exports.NICK_EMPTY = "Nickname cannot be empty!";
    
    // Messages related to game
    exports.ABORTED_LEFT = "Your opponent left the game";
    exports.ABORTED_ILLEGAL = "Your client made an illegal move!";

    // General messages
    exports.MALFORMED_PACKET = "Your client sent a malformed packet!";
}(typeof exports === "undefined" ? this.Messages = {} : exports));