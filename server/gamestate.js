function GameState() {
    this.firstField = new Array(10*10).fill(0);
    this.secondField = new Array(10*10).fill(0);
    this.currentTurn = 0; // 0 for first player, 1 for second player
    this.firstScore = 0;
    this.secondScore = 0;
    this.playing = false;

    /*
    Ship codes:
        Carrier: 5
        Battleship: 4
        Cruiser: 3
        Destroyer: 2
        Submarine: 1
        <Empty>: 0
    */

    /**
     * Sets the playing flag to true
     */
    this.startGame = function() {
        this.player = true;
    }

    /**
     * Returns a boolean indicating whether the game is ongoing or deploying
     */
    this.isPlaying = function() {
        return this.playing;
    }

    /**
     * Returns a boolean indicating whether all ships have been deployed
     */
    this.isReady = function() {
        return this.fieldReady(this.firstField) && this.fieldReady(this.secondField);
    }

    /**
     * Handles an attack on the given location
     * Returns true if the attack was a hit, false if it was a miss
     * Will update the next ID to make a move
     */
    this.attack = function(location) {
        let x = location.charAt(0);
        let y = location.charAt(1);
        let gameField = this.getCurrentField(this.currentTurn);

        // Check if the attack resulted in a hit
        if (this.isOccupied(gameField, location)) {
            // Reset ship code at location
            this.setShipCode(gameField, x, y, 0);

            // Indicate hit
            return true;
        }

        // No hit so the other player can make a turn
        this.currentTurn = (this.currentTurn + 1) % 2;

        // Indicate miss
        return false;
    }

    /**
     * Updates the score for both players
     */
    this.updateScores = function() {
        this.firstScore = this.getDestroyedShips(this.secondField);
        this.secondScore = this.getDestroyedShips(this.firstField);
    }

    /**
     * Checks if all ships are deployed on the given field
     */
    this.fieldReady = function(gameField) {
        return this.getDestroyedShips(gameField) === 0;
    }

    /**
     * Returns amount of destroyed ships on the given field 
     */
    this.getDestroyedShips = function(gameField) {
        let score = 0;

        // Update ships
        for (let i = 1; i <= 5; i++) {
            if (!this.checkShip(gameField, i)) {
                score += 1;
            }
        }

        return score;
    }

    /**
     * Checks if the given ship is still present on the given field
     * True if there is at least one part of the ship left, false otherwise
     */
    this.checkShip = function(gameField, ship) {
        // Loop over the entire field and check if there is still a location that has the ship's code
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) { // Would this be O(1) or O(n^2) :thinking:
                if (this.getShipCode(gameField, x, y) === ship) {
                    console.log(">>>" + this.getShipCode(gameField, x, y));
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Removes a given ship from the field, if its present
     */
    this.removeShip = function(gameField, ship) {
        // Check if we have to remove the ship
        if (!this.checkShip(gameField, ship)) {
            return;
        }

        // Loop over the entire field and check if there is still a location that has the ship's code
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                if (this.getShipCode(gameField, x, y) === ship) {
                    this.setShipCode(gameField, x, y, 0);
                }
            }
        }
    }

    /**
     * Returns the winner of the game, if any
     */
    this.getWinner = function() {
        return (this.firstScore === 5)  ? 0 : 
               (this.secondScore === 5) ? 1 :
                                          -1;
    }

    /**
     * Returns the ID of the player whose turn it is (0 for first player, 1 for second player)
     */
    this.getTurn = function() {
        return this.currentTurn;
    }

    /**
     * Returns the current field based on the turn
     */
    this.getCurrentField = function() {
        return currentTurn === 0 ? this.secondField : this.firstField;
    }

    /**
     * Returns the field of the given id
     */
    this.getField = function(id) {
        // Check if the given id is valid
        if (id !== 0 && id !== 1) {
            return null;
        }

        return id === 0 ? this.firstField : this.secondField;
    }

    /**
     * If 'low' is true the function will return the lower location of the two given location
     * If 'low' is false the higher location will be returned
     * If the second parameter 'x' is true, the x-axis will be used for comparison. y-axis will be used if set to false
     */
    this.normalize = function(low, x, start, end) {
        let startX = start.charAt(0);
        let startY = start.charAt(1);
        let endX = end.charAt(0);
        let endY = end.charAt(1);

        // Check if we have to compare the x values
        if (x) {
            // Check if any condition for start is satisfied
            if ((low && startX < endX) || (!low && startX > endX)) {
                return start;
            }
    
            // No start condition was satisfied, return end
            return end;
        }

        // Check if any condition for start is satisfied
        if ((low && startY < endY) || (!low && startY > endY)) {
            return start;
        }

        // No start condition was satisfied, return end
        return end;
    }

    /**
     * Deploys the given ship to the given locations, provided the locations were valid
     * Returns true if the deployment was successful, false otherwise
     */
    this.deploy = function(gameField, ship, front, end) {
        // Check if the deploy is valid
        if (!this.verifyDeploy(gameField, ship, front, end)) {
            console.log("Verify deploy triggered");
            return false;
        }

        // Remove old ship deloyment
        this.removeShip(gameField, ship);

        // Populate field
        return this.walkPath(gameField, start, end, false, ship);
    }

    /**
     * Checks whether given location is withing game borders
     * True if within borders, false otherwise
     */
    this.withinBorders = function(x, y) {
        return x >= 0 && x <= 9 && y >= 0 || y <= 9;
    }

    /**
     * Checks given values on validity.
     * Returns true if the given values are valid, false otherwise
     */
    this.verifyDeploy = function(gameField, length, front, end) {
        // Check if the locations are equal
        if (front === end) {
            console.log("Invalid deployment: locations are equal");
            return false;
        }

        let frontX = front.charAt(0);
        let frontY = front.charAt(1);
        let endX = end.charAt(0);
        let endY = end.charAt(1);

        // Checking of coordinates are withing borders
        if (!this.withinBorders(frontX, frontY) || !this.withinBorders(endX, endY)) {
            console.log("Invalid deployment: locations are outisde borders");
            return false;
        }

        // Determining if the ship is vertical or horizontal
        let horizontal = frontY === endY;
        let vertical = frontX === endX;

        // Check if the coordinates are not diagonal or something
        if (horizontal && vertical) {
            console.log("Invalid deployment: locations are diagonal");
            return false;
        }

        // Checking if ship length aligns with the given coordinates
        let distance = Math.abs(horizontal ? frontX - endX : frontY - endY);

        return length !== distance && this.checkOverlaps(gameField, front, end);
    }

    /**
     * Checks the given values for overlap with other ships
     * Returns true if there is no overlap, false otherwise
     */
    this.checkOverlaps = function(gameField, start, end) {
        return this.walkPath(gameField, start, end, true, 0);
    }

    /**
     * Checks if the given location is occupied (e.g. some ship is on it) on the given game field
     */
    this.isOccupied = function(gameField, location) {
        let x = location.charAt(0);
        let y = location.charAt(1);

        return this.getShipCode(gameField, x, y) !== 0;
    }

    /**
     * Returns the ship code on the given location in the given field
     * Refer to the top of this files for the ship codes
     */
    this.getShipCode = function(gameField, x, y) {
        return gameField[Number(x + y * 10)];
    }

    /**
     * Sets the ship code at the location on the given field to the given value
     * Refer to the top of this files for the ship codes
     */
    this.setShipCode = function(gameField, x, y, code) {
        gameField[Number(x + y * 10)] = code;
    }

    /**
     * Walks the given path.
     * If the check flag is set the function will return a boolean indicating overlap
     * If set contains any other value than 0 and check is false, the walked path will be set to the given value.
     */
    this.walkPath = function(gameField, start, end, check, set) {
        if (!check && set === 0) {
            // Why would you run this method with these parameters :thonk:
            console.log("Invalid deployment: Useless walkPath() call");
            return false;
        }

        // Check how we're going to walk the path
        let horizontal = start.charAt(1) === end.charAt(1);
        let vertical = start.charAt(0) === end.charAt(0);

        // If both are true the locations form a diagonal line, which is not allowed
        if (horizontal && vertical) {
            console.log("Invalid deployment: locations are diagoanl (walk)");
            return false;
        }

        // Set coordinates properly, in case they were mixed up
        start = this.normalize(true, horizontal, start, end);
        end = this.normalize(false, horizontal, start, end);

        // Get coordinates
        let startX = start.charAt(0);
        let startY = start.charAt(1);
        let endX = end.charAt(0);
        let endY = end.charAt(1);

        // Set start + end location and static var
        let startPath = Number(horizontal ? startX : startY);
        let endPath = Number(horizontal ? endX : endY);
        let staticPath = horizontal ? startY : startX;

        console.log("Walking from " + startPath + " to " + endPath);

        // Loop through all locations
        while (startPath <= endPath) {
            let location = horizontal ? "" + startPath + staticPath : "" + staticPath + startPath;

            // If the 'check' flag is set, check if there is overlap
            if (check && this.isOccupied(gameField, location)) {
                console.log("Invalid deployment: found overlap at " + location + ", found: " + this.getShipCode(gameField, location.charAt(0), location.charAt(1)));
                return false;
            }

            // Check if we have to set ship codes
            if (!check && set !== 0) {
                this.setShipCode(gameField, location.charAt(0), location.charAt(1), set);
            }

            console.log("awd");
            startPath += 1;
        }

        return true;
    }
}

module.exports = GameState;