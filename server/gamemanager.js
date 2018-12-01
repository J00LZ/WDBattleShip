var Game = require("../server/game");

function GameManager() {
    this.games = [];
    this.players = [];

    /**
     * Starts the game and lets all clients now they can go into start phase
     */
    this.startGame = function(game) {
        let firstPlayer = game.getFirstPlayer();
        let secondPlayer = game.getSecondPlayer();

        if (firstPlayer === null || secondPlayer === null) {
            // End game
            console.error("Game with key '" + game.getKey() + "' ended before it started..");
            return;
        }

        // Send packets with names
        this.sendSavePacket(firstPlayer, "START_GAME=" + secondPlayer.getName());
        this.sendSavePacket(secondPlayer, "START_GAME=" + firstPlayer.getName());
    }

    /**
     * Aborts the given game because of the given reason
     */
    this.endGame = function(game, reason) {
        console.log("Ending game with key '" + game.getKey() + "', reason: " + reason);

        this.sendSavePacket(game.getFirstPlayer(), "GAME_SC_ABORT=" + reason);
        this.sendSavePacket(game.getSecondPlayer(), "GAME_SC_ABORT=" + reason);

        this.removeGame(game);
    }

    /**
     * Sends a packet to the player after several safety checks
     */
    this.sendSavePacket = function(player, packet) {
        if (player !== null && player !== undefined) {
            let socket = player.getSocket();

            if (socket !== null && socket !== undefined && socket.readyState === 1) {
                console.log(" > Sending '" + packet + "' to '" + player.getName() + "'");
                socket.send(packet);
            }
        }
    }

    /**
     * Removes given game from active games
     */
    this.removeGame = function(game) {
        if (game === null || game === undefined) {
            return;
        }

        // Loop over active games
        for (let i = 0; i < this.games.length; i++) {
            let currentGame = this.games[i];
            
            // Compare codes and delete if found
            if (game.getKey() === currentGame.getKey()) {
                this.games.splice(i, 1);
                return;
            }
        }
    }

    /**
     * Handles game joining
     */
    this.joinGame = function(player, inviteCode, private){
        let game = null;

        // Check if player wants to join a game by invite code
        if (inviteCode !== null){
            game = this.getGameByInviteCode(inviteCode);

            // Invalid invite code
            if (game === null){
                player.kick("INVALID_INVITE", "supplied an invalid invite code!");

                return;
            }

            // Game is full
            if (game.getSecondPlayer() !== null) {
                player.kick("GAME_FULL", "tried to join a full game!");
                return;
            }

            // Add player to game
            game.setSecondPlayer(player);
            player.setKey(game.getKey());
            
            console.log("Player '" + player.getName() + "' joined the game with invite code '" + inviteCode + "'");
            this.startGame(game);
        } else {
            game = this.getFirstGameInQueue();

            if (private || game === null){
                // No games waiting for players, creating one
                let key = this.createGameKey(); // Unique key
                game = new Game(player, key, !private);

                console.log("Creating new " + (private ? "private" : "public") + " game with key '" + key + "' and player '" + player.getName() + "'");
                this.games.push(game);
                player.setKey(key);
            } else {
                // Found a game to join
                game.setSecondPlayer(player);
                player.setKey(game.getKey());
    
                console.log("Player '" + player.getName() + "' joined the game with key '" + game.getKey() + "'");
                this.startGame(game);
            }   
        }

        // Notify client of game key
        this.sendSavePacket(player, "GAME_KEY=" + game.getKey());
    }

    /**
     * Returns the first game that needs an extra player
     */
    this.getFirstGameInQueue = function () {
        for (let i = 0; i < this.games.length; i++) {
            let game = this.games[i];

            // Check if game is in need of a second player
            if (game.isPublic() && game.getSecondPlayer() === null) {
                return game;
            }
        }

        return null;
    }

    /**
     * Returns the game using the given key, if any
     */
    this.getGameByKey = function (key) {
        for (let i = 0; i < this.games.length; i++) {
            let game = this.games[i];

            if (game.getKey() === key) {
                return game;
            }
        }

        return null;
    }

    /**
     * Returns the player using the given name, if any
     */
    this.getPlayerByName = function (name) {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];

            console.log("   > Comparing " + name + " to " + player.getName());

            if (player.getName() === name) {
                return player;
            }
        }

        return null;
    }

    /**
     * Returns the player using the given socket, if any
     */
    this.getPlayerBySocket = function (socket) {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];

            if (player.getSocket() === socket) {
                return player;
            }
        }
    }

    /**
     * Removes player from list
     */
    this.removePlayer = function (socket) {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];

            if (player.getSocket() === socket) {
                let game = this.getGameByKey(player.getKey());

                // Check if player was in a game, if so end it
                if (game !== null) {
                    this.endGame(game, "ABORTED_LEFT");
                }

                // Remove player from array
                this.players.splice(i, 1);

                return;
            }
        }
    }

    /**
     * Checks if a given name is still available
     * True if so, false if taken
     */
    this.nameAvailable = function (name) {
        return this.getPlayerByName(name) === null;
    }

    /**
     * Adds the given player to the player list
     */
    this.addPlayer = function (player, addr) {
        console.log("Adding player object (" + addr + ")");
        this.players.push(player);
    }

    /**
     * Handles requests from clients
     */
    this.handleRequest = function handleRequest(socket, message) {
        let ids = message.split("&");

        for (let i = 0; i < ids.length; i++) {
            if (ids[i].split("=").length !== 2) {
                continue;
            }

            let player = this.getPlayerBySocket(socket);
            let id = ids[i].split("=")[0];
            let data = ids[i].split("=")[1];

            // Check if the packet contained data
            if (data.trim() === "") {
                console.warn("Received empty packet from " + player.getName() + ": " + id);
                continue;
            }

            // Check if we can pass this to another method
            if (id.startsWith("GAME_CS_")) {
                if (id.split("_CS_").length !== 2) {
                    player.kick("MALFORMED_PACKET", "sent a malformed packet!");
                    return;
                }

                id = id.split("_CS_")[1];
                this.handleGameRequest(player, id, data);

                continue;
            }

            // More general packet, handle here
            switch (id) {
                case "NAME": // Player is requesting a name 
                    if (this.getPlayerByName(data) !== null) {
                        // Player is connected but name is in use
                        player.kick("NICK_TAKEN");
                        return;
                    }

                    let illegalChars = ['&', '/', '=', ':'];

                    // Check nickname
                    let i = data.length;
                    while (i--) {
                        let char = data.charAt(i);

                        if (illegalChars.includes(char)) {
                            // On the client side we would normally send a more fitting error message
                            // However, it would cost more code to send a formatted string, so we'll just send a more general error code
                            player.kick("NICK_TAKEN", "tried to use an illegal nickname!");
                            return;
                        }
                    }

                    player.setName(data);
                    console.log("Set name of new player to " + data);
                    break;
                case "CODE": // Player is requesting to join the game with the given code
                    if (!new RegExp("^[0-9|a-z]{5}$").test(data)) {
                        // Player is connected but invite code is illegal (invalid characters/length)
                        player.kick("ILLEGAL_INVITE", "supplied an illegal invite code!");
                        return;
                    }

                    if (!this.validInviteCode(data)) {
                        // Player is connected but invite code is invalid
                        player.kick("INVALID_INVITE", "supplied an invalid invite code!");
                        return;
                    }

                    // Set the invite key of the player
                    player.setInviteCode(data);

                    break;
                case "REQUESTGAME": // Player wants to join/create game
                    if (player.getName() === null || player.getName() == undefined || player.getName().trim() === "") {
                        // Player wants to join game but name has not been set: wrong order of packets
                        player.kick("ILLEGAL_PACKET", "sent an illegal packet!");
                        return;
                    }
                    
                    // Join game
                    this.joinGame(player, player.getInviteCode(), data === "on");

                    break;
                case "STATS": // Player is requesting stats
                    switch (data) {
                        case "PLAYERS_ONLINE":
                            var pcounter = 0;
                            this.players.forEach(element => {
                                if (element.getName() !== null && element.getName() !== undefined) {
                                    pcounter++;
                                }
                            });
                            socket.send(data + "=" + pcounter);
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
Game-related packets:

    Server will understand the following packets from client:

    GAME_CS_ABORT=<reason from messages.js>                                     Game will be aborted and other player will receive a message
    GAME_CS_DEPLOY=<code of ship>%<coord of front ship>%<coord of back ship>    Server will deploy a ship of the given type on the given location
    GAME_CS_READY=TOGGLE                                                        Toggle ready status, game phase will start if both players have flagged
    GAME_CS_ATTACK=<coord of attack>                                            Server will register an attack on the given location

    Server will send the following packets to client:

    GAME_SC_ABORT=<reason from messages.js>                                     Other client has aborted the game, reason is supplied
    GAME_SC_INCOMING=<coord of incoming attack>                                 An attack on the given location by the opponent was registered
    GAME_SC_READY_OTHER=<TRUE/FALSE>                                            Ready status of opponent
    GAME_SC_WINNER=<TRUE/FALSE>                                                 Game has ended, value indicitates whether player won or not
    GAME_SC_TURN=<TRUE/FALSE>                                                   Client can make a move. TRUE as value indicates the previous attack was a hit,
                                                                                so the client can make another move. FALSE means it's just a regular turn.
    GAME_SC_WAIT=TRUE                                                           Opponent is making a move

    Ship codes:
        Carrier: 5
        Battleship: 4
        Cruiser: 3
        Destroyer: 2
        Submarine: 1

    Coordinate formatting:
        XY
        Ex: 00    -> (0,0)
            10    -> (1,0)
            19    -> (1,9)
            (9,9) -> 99
            (3,5) -> 35
            (8,2) -> 82
*/

    /**
     * Handles game packets
     */
    this.handleGameRequest = function(player, identifier, value) {
        let game = this.getGameByKey(player.getKey());

        // Check if the player is in a game
        if (game === null) {
            player.kick("ILLEGAL_PACKET", "sent a game packet, without being in a game!");
            return;
        }

        let gameState = game.getGameState();

        switch (identifier) {
            case "ABORT":
                this.endGame(game, value);
                break;
            case "DEPLOY":
                let data = value.split("%");

                // Check if all data was sent
                if (data.length !== 3) {
                    player.kick("MALFORMED_PACKET", "sent a deploy packet with too little/less values!");
                    return;
                }

                // Check if the game has already started
                if (gameState.isPlaying()) {
                    // Kick player, game should be automatically stopped
                    player.kick("ILLEGAl_PACKET", "tried to deploy ships while the game has already started!");
                    return;
                }

                // Init deployment and check the result
                if (!gameState.deploy(gameState.getField(game.getStateID(player)), data[0], data[1], data[2])) {
                    // The deployment was illegal
                    player.kick("ILLEGAL_PACKET", "tried to issue an illegal deployment!");
                }

                break;
            case "READY":
                // Check if the player has deployed all ships
                if (!gameState.fieldReady(gameState.getField(game.getStateID(player)))) {
                    // Player has not yet deployed all ships
                    player.kick("ILLEGAL_PACKET", "tried to toggle his/her ready-state while he/she did not deploy all ships");
                    return;
                }

                // Toggle ready status of player
                player.ready();

                // Send status to other player
                this.sendSavePacket(game.getOpponent(player), "GAME_SC_READY_OTHER=" + (player.isReady() ? "TRUE" : "FALSE"))

                // Check if we can start the game
                if (gameState.isReady()) {
                    gameState.startGame();
                    console.log("Game with key '" + game.getKey() + "' has started");

                    // Send play packet to first player
                    this.sendSavePacket(player, "GAME_SC_TURN=FALSE");

                    // Send wait packet to second player
                    this.sendSavePacket(game.getOpponent(player), "GAME_SC_WAIT=TRUE ");
                }
                break;
            case "ATTACK":
                // Check if the game has already started
                if (gameState.isPlaying()) {
                    player.kick("ILLEGAl_PACKET", "tried to attack while the game has not yet already started!");
                    return;
                }

                // Check if the its the player's turn
                if (gameState.getTurn() !== game.getStateID(player)) {
                    player.kick("ILLEGAL_PACKET", "tried to attack while it was not his/her turn!");
                    return;
                }

                // Process attack
                let hit = gameState.attack(value);

                // Update scores
                gameState.updateScores();

                // Check if a player has won the game
                let winner = gameState.getWinner();

                if (winner !== -1) {
                    // Send packets
                    this.sendSavePacket(player, "GAME_SC_WINNER=" + (winner === 0 ? "TRUE" : "FALSE"));
                    this.sendSavePacket(player, "GAME_SC_WINNER=" + (winner === 1 ? "TRUE" : "FALSE"));
                    this.removeGame(game);
                    return;
                }

                // No winner yet, give turn 
                //TODO: Implement this
                break;
            default:
                // Client sent an illegal game packet
                player.kick("ILLEGAL_PACKET", "sent an illegal game packet");

                break;;
        }
    }

    /**
     * Creates a semi-random game key
     */
    this.createGameKey = function createGameKey() {
        let possible = "abcdefghijklmnopqrstuvwxyz0123456789";

        while (true) {
            let key = "";

            for (var i = 0; i < 12; i++) {
                key += possible.charAt(Math.floor(Math.random() * possible.length));
            }
    
            if (this.getGameByKey(key) === null){
                return key;
            }
        }
    }

    /**
     * Returns game with given invite code, if any
     */
    this.getGameByInviteCode = function (inviteCode) {
        for (let i = 0; i < this.games.length; i++) {
            let game = this.games[i];
            let code = game.getInviteCode();

            if (code === inviteCode) {
                return game;
            }
        }

        return null;
    }

    /**
     * Checks if the given invite code is valid
     */
    this.validInviteCode = function validInviteCode(code) {
        return this.getGameByInviteCode(code) !== null;
    }
}

module.exports = GameManager;