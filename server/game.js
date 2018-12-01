function Game(firstPlayer, key, public, gameState){
    this.public = public;
    this.key = key;
    this.invite = key.substring(0, 5);
    this.firstPlayer = firstPlayer;
    this.secondPlayer = null;
    this.gameState = gameState;

    /**
     * True if the game is public, false if this game is invite-only
     */
    this.isPublic = function() {
        return this.public;
    }

    /**
     * Sets the current public status to the given status
     */
    this.setPublic = function(public) {
        this.public = public;
    }

    /**
     * Returns the key of this game
     */
    this.getKey = function() {
        return this.key;
    }

    /**
     * Returns game state instance
     */
    this.getGameState = function() {
        return this.gameState;
    }

    /**
     * Returns the invite code of this game
     */
    this.getInviteCode = function() {
        return this.invite;
    }

    /**
     * Sets the second player of the game
     */
    this.setSecondPlayer = function(secondPlayer) {
        this.secondPlayer = secondPlayer;
    }

    /**
     * Returns the first player
     */
    this.getFirstPlayer = function() {
        return this.firstPlayer;
    }

    /**
     * Returns the second player
     */
    this.getSecondPlayer = function() {
        return this.secondPlayer;
    }

    this.isParticipating = function(player) {
        let name = player.getName();

        return name === this.firstPlayer.getName() || name === this.secondPlayer.getName();
    }

    /**
     * Returns opponent of given player
     */
   this.getOpponent = function(player) {
       // Check if player is in this game
       if (!this.isParticipating(player)) {
           return null;
       }

       return player.getName() === this.firstPlayer.getName() ? this.secondPlayer : this.firstPlayer;
   }

   /**
    * Returns the ID of the given player inside the game state instance
    */
   this.getStateID = function(player) {
       // Check if the player is in this game
       if (!this.isParticipating(player)) {
            return -1;
       }
       
       return player.getName() === this.firstPlayer.getName() ? 0 : 1;
   }
}

module.exports = Game;