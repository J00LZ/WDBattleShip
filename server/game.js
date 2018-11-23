function Game(firstPlayer, key, public){
    this.public = public;
    this.key = key;
    this.invite = key.substring(0, 5);
    this.firstPlayer = firstPlayer;
    //TODO: Add game state + functions

    /*
    True if the game is public, false if this game is invite-only
    */
    this.isPublic = function(){
        return this.public;
    }

    /*
    Sets the current public status to the given status
    */
    this.setPublic = function(public){
        this.public = public;
    }

    /*
    Returns the key of this game
    */
    this.getKey = function(){
        return this.key;
    }

    /*
    Returns the invite code of this game
    */
    this.getInviteCode = function(){
        return this.invite;
    }

    /*
    Sets the second player of the game
    */
    this.setSecondPlayer = function(secondPlayer){
        this.secondPlayer = secondPlayer;
    }

    /*
    Returns the first player
    */
    this.getFirstPlayer = function(){
        return this.firstPlayer;
    }

    /*
    Returns the second player
    */
    this.getSecondPlayer = function(){
        return this.secondPlayer;
    }
}

module.exports = Game;