var Game = require("../server/game");

function GameManager() {
    this.games = [];
    this.players = [];

    this.joinGame = function (player, inviteCode) {
        let game = null;

        // Check if player wants to join a game by invite code
        if (inviteCode === null) {
            game = this.getGameByInviteCode(inviteCode);

            // Invalid invite code
            if (game === null) {
                this.removePlayer(player.getSocket());
                player.kick("INVALID_INVITE");
            }
        }
        let key = createGameKey();

        // Make sure the chosen key is not yet used (most likely)
        while (true) {
            console.log("Checking key: " + key);

            if (this.getGameByKey(key) === null) {
                console.log("Creating new game with key: " + key);
                this.games.push(new Game(player, key, false));
                break;
            }

            console.log(key + " is already in use. Trying again.");
        }

    }

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

    /*
    Returns the game using the given key, if any
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

    /*
    Returns the player using the given name, if any
    */
    this.getPlayerByName = function (name) {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];

            console.log("\t>Comparing " + name + " to " + player.getName());

            if (player.getName() === name) {
                return player;
            }
        }

        return null;
    }

    /*
    Returns the player using the given socket, if any
    */
    this.getPlayerBySocket = function (socket) {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];

            if (player.getSocket() === socket) {
                return player;
            }
        }
    }

    /*
    Removes player from list
    */
    this.removePlayer = function (socket) {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];

            if (player.getSocket() === socket) {
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
    this.nameAvailable = function (name) {
        return this.getPlayerByName(name) === null;
    }

    /*
    Adds the given player to the player list
    */
    this.addPlayer = function (player, addr) {
        console.log("Adding player object (" + addr + ")");
        this.players.push(player);
    }

    /*
    Handles requests from clients
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

            if (data.trim() === "") {
                continue;
            }

            switch (id) {
                case "NAME": // Player is requesting a name 
                    if (this.getPlayerByName(data) !== null) {
                        // Player is connected but name is in use
                        this.removePlayer(socket);
                        player.kick("NICK_TAKEN");
                        return;
                    }

                    let illegalChars = ['&', '/', '=', ':'];

                    // Check nickname
                    let i = data.length;
                    while (i--) {
                        let char = data.charAt(i);

                        if (illegalChars.includes(char)) {
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
                    if (!new RegExp("^[0-9|a-z]{5}$").test(data)) {
                        // Player is connected but invite code is illegal
                        this.removePlayer(socket);
                        player.kick("ILLEGAL_INVITE");
                        return;
                    }

                    if (!this.validInviteCode(data)) {
                        // Player is connected but invite code is invalid
                        this.removePlayer(socket);
                        player.kick("INVALID_INVITE");
                        return;
                    }

                    // Set the invite key of the player
                    player.setInviteKey(data);

                    break;
                case "REQUESTGAME": // Player wants to join/create game
                    if (player.getName() === null || player.getName() == undefined || player.getName()) {
                        // Player wants to join game but name has not been set: wrong order of packets
                        this.removePlayer(socket);
                        player.kick("ILLEGAL_PACKET");
                        return;
                    }

                    // Join game
                    this.joinGame(player, player.getInviteCode());

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
    Creates a semi-random game key
    */
    this.createGameKey = function createGameKey() {
        var key = "";
        var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 12; i++) {
            key += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return key;
    }

    /*
    Returns game with given invite code, if any
    */
    this.getGameByInviteCode = function (inviteCode) {
        for (let i = 0; i < this.games.length; i++) {
            let game = this.games[i];
            let inviteCode = game.getInviteCode();

            if (code === inviteCode) {
                return game;
            }
        }

        return null;
    }

    /*
    Checks if the given invite code is valid
    */
    this.validInviteCode = function validInviteCode(code) {
        return this.getGameByInviteCode(code) !== null;
    }
}

module.exports = GameManager;