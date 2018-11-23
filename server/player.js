function Player(socket){
    this.socket = socket;
    //TODO: Add some sort of game board + functions

    /*
    Returns socket of this player
    */
   this.getSocket = function(){
        return this.socket;
   }

    /*
    Returns name of this player
    */
    this.getName = function(){
        return this.name;
    }

    /*
    Sets the name of this player to the given name
    */
    this.setName = function(name){
        this.name = name;
    }

    /*
    Sets the game key of this player to the given key
    */
    this.setKey = function(key){
        this.key = key;
    }

    /*
    Returns the key of the game the player is participating in
    */
    this.getKey = function(){
        return this.key;
    }
}

module.exports = Player;