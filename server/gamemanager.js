function GameManager(){
    this.games = [];
    this.players = [];

    this.createGame = function(player){
        let key = createGameKey();
        
        // Make sure the chosen key is not yet used (most likely)
        while (true){
            console.log("Checking key: " + key);

            if (this.getGameByKey(key) === null){
                console.log("Creating new game with key: " + key);
                this.games.push(new Game(player, key));
                break;
            }

            console.log(key + " is already in use. Trying again.");
        }
        
    }

    /*
    Returns the game using the given key, if any
    */
    this.getGameByKey = function(key){
        for (let i = 0; i < this.games.length; i++){
            let game = this.games[i];

            if (game.getKey() === key){
                return game;
            }
        }

        return null;
    }

    /*
    Returns the player using the given name, if any
    */
    this.getPlayerByName = function(name){
        for (let i = 0; i < this.players.length; i++)
        {
            let player = this.players[i];
            
            console.log("\t>Comparing " + name + " to " + player.getName());

            if (player.getName() === name){
                return player;
            }
        }

        return null;
    }

    /*
    Returns the player using the given socket, if any
    */
   this.getPlayerBySocket = function(socket){
       for (let i = 0; i < this.players.length; i++){
           let player = this.players[i];

           if (player.getSocket() === socket){
               return player;
           }
       }
   }

   /*
   Removes player from list
   */
   this.removePlayer = function(socket){
        for (let i = 0; i < this.players.length; i++){
            let player = this.players[i];

            if (player.getSocket() === socket){
                let gameKey = player.getKey();

                //TODO: End game if not yet finished

                // Remove player from array
                this.players.splice(i, 1);
            }
        }
   }

    /*
    Checks if a given name is still available
    True if so, false if taken
    */
    this.nameAvailable = function(name){
        if (this.getPlayerByName(name) === null){
            return true;
        }

        return false;
    }

    /*
    Adds the given player to the player list
    */
    this.addPlayer = function(player, addr){
        console.log("Adding player object (" + addr + ")");
        this.players.push(player);
    }

    /*
    Handles requests from clients
    */
    this.handleRequest = function handleRequest(socket, message){
        let ids = message.split("&");

        for (let i = 0; i < ids.length; i++){
            if (ids[i].split("=").length !== 2){
                continue;
            }

            let player = this.getPlayerBySocket(socket);
            let id = ids[i].split("=")[0];
            let data = ids[i].split("=")[1];
            
            if (data.trim() === ""){
                continue;
            }

            switch (id){
                case "NAME": // Player is requesting a name 
                    if (this.getPlayerByName(data) !== null){
                        // Player is connected but name is in use
                        this.removePlayer(socket);
                        player.kick("NICK_TAKEN");
                        return;
                    }

                    let illegalChars = ['&', '/', '=', ':'];

                    // Check nickname
                    let i = data.length;
                    while (i--){
                        let char = data.charAt(i);

                        if (illegalChars.includes(char)){
                            this.removePlayer(socket);

                            // On the client side we would normally send a more fitting error message
                            // However, it would cost more code to send a formatted string, so we'll just send a more general error code
                            player.kick("NICK_TAKEN");

                            return;
                        }
                    }

                    player.setName(data);
                    break;
                case "CODE": // Player is requesting to join the game with the given code
                    if (!new RegExp("^[0-9|a-z]{5}$").test(data)){
                        // Player is connected but invite code is illegal
                        this.removePlayer(socket);
                        player.kick("ILLEGAL_INVITE");
                        return;
                    }

                    if (!this.validInviteCode(data)){
                        // Player is connected but invite code is invalid
                        this.removePlayer(socket);
                        player.kick("INVALID_INVITE");
                        return;
                    }

                    //TODO: Implement game connecting
                    break;
                case "STATS": // Player is requesting stats
                    switch (data){
                        case "PLAYERS_ONLINE":
                            socket.send(data + "=" + this.players.length);
                            break;
                        case "GAMES_IN_PROGRESS":
                            socket.send(data + "=" + this.games.length);
                            break;
                        case "GAMES_PLAYED_TODAY":
                            //TODO: Implement
                            socket.send(data + "=0");
                            break;
                        case "GAMES_PLAYED_TOTAL":
                            //TODO: Implement
                            socket.send(data + "=0");
                            break;
                        default:
                            // Oof
                            break;
                    }
                    break;
            }
        }
    }

    /*
    Creates a semi-random game key
    */
    this.createGameKey = function createGameKey() {
        var key = "";
        var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    
        for (var i = 0; i < 12; i++){
            key += possible.charAt(Math.floor(Math.random() * possible.length));
        }
    
        return key;
    }

    /*
    Checks if the given invite code is valid
    */
   this.validInviteCode = function validInviteCode(code){
       for (let i = 0; i < this.games.length; i++){
           let game = this.games[i];
           let inviteCode = game.getInviteCode();

           if (code === inviteCode)
           {
               return true;
           }
       }

       return false;
   }
}

module.exports = GameManager;