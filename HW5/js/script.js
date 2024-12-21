/* NAME : Ilyes Abdellatif Bouazza
EMAIL : ilyesabdellatif_bouazza@student.uml.edu
HW5: Bit of scrabble gamme
DATE : 12/18/2024
FILE : script.js
DESCRIPTION : The purposes of this assignment are to have additional experience
working with the jQuery UI and to pull together much of what we’ve
been doing throughout the semester. You are to implement a bit of the
game of Scrabble using drag-and-drop. The idea is to display one
line of the Scrabble board (one line sample) to the user along with
seven letter tiles on a tile rack. The user then drags tiles to the board
to make a word, and you are to report his or her score, taking the letter
values and bonus squares into consideration */



// ScrabbleBoard Class
// This class manages the Scrabble board's state, UI rendering, and interaction logic. 
// It handles the generation of the board, tracking the current word,
//  validating the word, and updating scores and tiles.
class ScrabbleBoard {
    constructor(squares, squareImages, boardContainerSelector) {
        this.squares = squares;
        this.squareImages = squareImages;
        this.$boardContainer = $(boardContainerSelector);
        this.currentWord = "";      // Track the current word
        this.currentScore = 0;      // Track the current score
        this.highestScore = 0;      // Track the highest score
        this.remainingTiles = 93;   // Track the number of remaining tiles
    }

    generateBoard() {
        this.$boardContainer.empty(); // Clear existing content
        this.squares.forEach((type, index) => {
            const $img = $("<div>", {
                class: `square ${type}`,
                "data-index": index // For tracking purposes
            }).css({
                backgroundImage: `url(${this.squareImages[type]})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
            });
            this.$boardContainer.append($img);
        });
    }



    enableNextWordButton() {
        $("#next-word").removeAttr("disabled");
    }

    disableNextWordButton() {
        $("#next-word").attr("disabled", "disabled");
    }


    updateWord() {
        console.log("updateWord called. Current context:", this);

        const totalSquares = this.squares.length; // Total number of squares on the board
        let wordArray = Array(totalSquares).fill("-"); // Initialize with dashes

        // Iterate through all squares and collect letters where tiles are present
        for (let i = 0; i < totalSquares; i++) {
            const $square = $(`#scrabble-board .square[data-index="${i}"]`);
            const tile = $square.children(".tile");

            if (tile.length > 0) {
                const letter = tile.data("letter");
                if (letter) {
                    wordArray[i] = letter;
                }
            }
        }

        // Remove leading and trailing dashes to create a compact word
        this.currentWord = wordArray.join("").replace(/^-+|-+$/g, "");

        // Append dashes to maintain the length of 12 characters
        this.currentWord = this.currentWord.padEnd(12, "-");

        // Update the UI
        $("#word-display").text(this.currentWord);

        console.log(`Current Word: ${this.currentWord}`);
    }

    hasGaps() {

        // Check if the word consists only of dashes
        if (/^-+$/.test(this.currentWord)) {
            return true; // Word is invalid as it is only dashes
        }

        // Check if there is at least one dash between two letters
        const gapPattern = /[A-Z]-+[A-Z]/;

        // Return true if gaps exist, otherwise false
        return gapPattern.test(this.currentWord);
    }

    hasMinimumTwoLetters() {
        // Match all letters in the current word
        const letterCount = (this.currentWord.match(/[A-Z]/g) || []).length;

        // Return true if the word has at least 2 letters
        return letterCount >= 2;
    }
    async isWordInDictionary() {
        try {
            // Fetch the words from the local `words.txt` file
            const response = await fetch("resources/words.txt");
            if (!response.ok) {
                throw new Error("Failed to load words.txt from resources folder");
            }

            // Read the content and split into an array of words
            const text = await response.text();
            const dictionary = text.split(/\r?\n/).map(word => word.trim().toUpperCase());

            // Sanitize the current word (remove dashes and convert to uppercase)
            const sanitizedWord = this.currentWord.replace(/-/g, "").toUpperCase();

            // Check if the word is in the dictionary
            return dictionary.includes(sanitizedWord);
        } catch (error) {
            console.error("Error loading or validating words from words.txt:", error);
            return false;
        }
    }

    //validate current word
    validateCurrentWord() {
        const self = this;

        // Check for gaps
        const hasGaps = this.hasGaps();
        $("#rule-no-gap .status-check")
            .text(hasGaps ? "✘" : "✔")
            .css("color", hasGaps ? "red" : "green");

        // Check for at least 2 letters
        const hasMinimumLetters = this.hasMinimumTwoLetters();
        $("#rule-min-letters .status-check")
            .text(hasMinimumLetters ? "✔" : "✘")
            .css("color", hasMinimumLetters ? "green" : "red");

        // Check if the word is in the dictionary using Promises
        return this.isWordInDictionary()
            .then((isInDictionary) => {
                $("#rule-found-dictionary .status-check")
                    .text(isInDictionary ? "✔" : "✘")
                    .css("color", isInDictionary ? "green" : "red");

                // Return true if all conditions are met
                return !hasGaps && hasMinimumLetters && isInDictionary;
            })
            .catch((error) => {
                console.error("Error validating dictionary word:", error);
                return false; // Treat as invalid if there's an error
            });
    }







    calculateScore() {
        let totalScore = 0; // Initialize total score
        let wordMultiplier = 1; // Initialize word multiplier

        // Iterate over all squares on the board
        $("#scrabble-board .square").each(function () {
            const $square = $(this);
            const $tile = $square.children(".tile"); // Check if the square contains a tile

            if ($tile.length > 0) {
                const tileValue = parseInt($tile.data("value"), 10); // Get the tile's value
                let tileScore = tileValue; // Initialize the tile's score

                // Check for special squares
                if ($square.hasClass("double-letter")) {
                    tileScore *= 2; // Double the letter's value
                }

                // Add the tile's score to the total score
                totalScore += tileScore;

                // Check for word multipliers
                if ($square.hasClass("double-word")) {
                    wordMultiplier *= 2; // Multiply the word's total score
                }
            }
        });

        // Apply the word multiplier to the total score
        totalScore *= wordMultiplier;

        // Update the current score
        this.currentScore = totalScore;

        // Update the score in the UI
        $("#current-score").text(this.currentScore);

        console.log(`Current Score: ${this.currentScore}`);
    }

    calculateHighestScore() {
        if (this.currentScore > this.highestScore) {
            this.highestScore = this.currentScore; // Update the highest score
        }
    }



    updateRemainingTiles() {
        const tilesOnRack = $(".tile-container .tile").length;
        const tilesOnBoard = $("#scrabble-board .tile").length;

        const totalUsedTiles = tilesOnRack + tilesOnBoard;

        // Calculate the remaining tiles dynamically
        this.remainingTiles = this.pieces.reduce((acc, piece) => acc + piece.amount, 0) - totalUsedTiles;

        // Log or update UI
        console.log(`Remaining Tiles: ${this.remainingTiles}`);
        $("#remaining-tiles").text(this.remainingTiles);
    }





    makeBoardSquaresDroppable() {
        const self = this; // Store a reference to the ScrabbleBoard instance
        $("#scrabble-board .square").droppable({
            accept: ".tile-container .tile", // Accept only tiles from the rack
            drop: function (event, ui) {
                const $square = $(this);
                const $droppedTile = ui.draggable;

                // Prevent multiple tiles on the same square
                if ($square.children(".tile").length > 0) {
                    console.log("Square already occupied!");
                    $droppedTile.draggable("option", "revert", true); // Revert to rack
                    return;
                }

                // Get the current square index
                const squareIndex = $square.data("index");

                // Check adjacency: Only allow if left or right square has a tile or it's the first tile
                const leftNeighbor = $(`#scrabble-board .square[data-index="${squareIndex - 1}"]`);
                const rightNeighbor = $(`#scrabble-board .square[data-index="${squareIndex + 1}"]`);

                const hasLeftTile = leftNeighbor.children(".tile").length > 0;
                const hasRightTile = rightNeighbor.children(".tile").length > 0;

                const isFirstTile = $("#scrabble-board .tile").length === 0; // No tiles on the board yet

                if (!isFirstTile && !hasLeftTile && !hasRightTile) {
                    console.log("Invalid drop location! Must be adjacent to another tile.");
                    $droppedTile.draggable("option", "revert", true); // Revert to rack
                    return;
                }

                // Append the tile to the square
                $square.append($droppedTile);

                // Snap tile to the center of the square
                $droppedTile.css({
                    top: 0,
                    left: 0,
                    width: "100%", // Ensure tile fits square
                    height: "100%", // Ensure tile fits square
                    position: "absolute" // Position relative to the square
                });


                // Store tile data in the square
                $square.data("tile", $droppedTile.data("letter"));

                console.log(`Tile "${$droppedTile.data("letter")}" dropped on square index: ${squareIndex}`);

                // Call updateWord safely
                self.updateWord();
                // Validate the word using Promises
                self.validateCurrentWord()
                    .then((isValid) => {
                        if (isValid) {
                            self.calculateScore();
                            $("#current-score").text(self.currentScore);
                            self.enableNextWordButton();
                        } else {
                            self.currentScore = 0;
                            $("#current-score").text(self.currentScore);
                            self.disableNextWordButton();
                        }
                    })
                    .catch((error) => {
                        console.error("Error during word validation:", error);
                    });





            }
        });
    }

}


// TileRack Class
// This class manages the player's tile rack, handling tile rendering and drag-and-drop interactions.
class TileRack {
    constructor(tileContainerSelector) {
        this.$tileContainer = $(tileContainerSelector);
    }

    populateRack(tiles) {
        this.$tileContainer.empty(); // Clear the rack
        tiles.forEach(tile => {
            const $tile = $("<img>", {
                src: `resources/graphics_data/graphics_data/Scrabble_Tiles/Scrabble_Tile_${tile.letter}.jpg`,
                alt: `Tile ${tile.letter}`,
                class: "tile square",
                "data-letter": tile.letter,
                "data-value": tile.value
            }).css({
                width: "100px",
                height: "110px",
                position: "relative"
            });
            this.$tileContainer.append($tile);
        });
    }

    makeTilesDraggable() {
        $(".tile-container .tile").draggable({
            revert: "invalid", // Automatically revert if not dropped on a valid area
            containment: "#game-ui", // Restrict movement within the game UI
            start: function () {
                const $tile = $(this);
                const offset = $tile.offset();
                $tile.data("originalTop", offset.top); // Save original position
                $tile.data("originalLeft", offset.left);
                $tile.css("z-index", "1000"); // Bring tile to the top while dragging
            },
            stop: function () {
                const $tile = $(this);
                const $parent = $tile.parent();
                if (!$parent.hasClass("square") && !$parent.hasClass("tile-container")) {
                    // If not dropped on a valid square or the rack, move back to the rack
                    $(".tile-container").append($tile);
                    $tile.css({
                        top: 0,
                        left: 0,
                        position: "relative",
                        width: "100px",
                        height: "110px"
                    });
                    console.log(`Tile ${$tile.data("letter")} returned to the rack.`);
                }
                $tile.css("z-index", "auto"); // Reset z-index after dragging stops
            }
        });
    }

    makeRackDroppable() {
        const board = this.board; // Pass the ScrabbleBoard instance when initializing TileRack
        $(".tile-container").droppable({
            accept: ".tile", // Accept only tiles
            tolerance: "touch", // Allow drop as long as the tile touches the rack background
            over: function () {
                $(this).addClass("highlight-rack"); // Highlight the rack
            },
            out: function () {
                $(this).removeClass("highlight-rack"); // Remove highlight
            },
            drop: function (event, ui) {
                const $returnedTile = ui.draggable;

                // Append the tile back to the rack
                $(this).append($returnedTile);

                // Reset the tile's position to be properly aligned in the rack
                $returnedTile.css({
                    top: 0,
                    left: 0,
                    position: "relative", // Reset to default positioning
                    width: "100px", // Restore original dimensions
                    height: "110px"
                });
                //update word
                // Update the word
                if (board && typeof board.updateWord === "function") {
                    board.updateWord();
                } else {
                    console.error("updateWord function not found in ScrabbleBoard instance.");
                }

                if (board) {
                    board.updateWord();
                    board.validateCurrentWord()
                        .then((isValid) => {
                            if (!isValid) {
                                board.currentScore = 0;
                                $("#current-score").text(board.currentScore);
                            }
                        })
                        .catch((error) => {
                            console.error("Error validating word:", error);
                        });
                }

                console.log(`Tile ${$returnedTile.data("letter")} returned to the rack.`);
            }
        });
    }
}


// ScrabbleGame Class
// This class ties the board and tile rack together, managing overall game logic such as 
// initialization, resetting, and advancing to the next word.
class ScrabbleGame {
    constructor(board, tileRack) {
        this.board = board;
        this.tileRack = tileRack;

        // Static pieces data
        this.pieces = [
            { "letter": "A", "value": 1, "amount": 9 },
            { "letter": "B", "value": 3, "amount": 2 },
            { "letter": "C", "value": 3, "amount": 2 },
            { "letter": "D", "value": 2, "amount": 4 },
            { "letter": "E", "value": 1, "amount": 12 },
            { "letter": "F", "value": 4, "amount": 2 },
            { "letter": "G", "value": 2, "amount": 3 },
            { "letter": "H", "value": 4, "amount": 2 },
            { "letter": "I", "value": 1, "amount": 9 },
            { "letter": "J", "value": 8, "amount": 1 },
            { "letter": "K", "value": 5, "amount": 2 },
            { "letter": "L", "value": 1, "amount": 4 },
            { "letter": "M", "value": 3, "amount": 3 },
            { "letter": "N", "value": 1, "amount": 5 },
            { "letter": "O", "value": 1, "amount": 8 },
            { "letter": "P", "value": 3, "amount": 2 },
            { "letter": "Q", "value": 10, "amount": 1 },
            { "letter": "R", "value": 1, "amount": 6 },
            { "letter": "S", "value": 1, "amount": 4 },
            { "letter": "T", "value": 1, "amount": 6 },
            { "letter": "U", "value": 1, "amount": 5 },
            { "letter": "V", "value": 4, "amount": 2 },
            { "letter": "W", "value": 4, "amount": 2 },
            { "letter": "X", "value": 8, "amount": 1 },
            { "letter": "Y", "value": 4, "amount": 2 },
            { "letter": "Z", "value": 10, "amount": 1 }
        ];

        // Keep a deep copy of the original pieces
        this.originalPieces = JSON.parse(JSON.stringify(this.pieces));

    }

    getRandomTiles() {
        const tiles = [];
        const availablePieces = this.pieces.map(piece => ({ ...piece })); // Clone to avoid mutation

        while (tiles.length < 7) {
            const randomIndex = Math.floor(Math.random() * availablePieces.length);
            const piece = availablePieces[randomIndex];
            if (piece.amount > 0) {
                tiles.push(piece);
                piece.amount--; // Decrement the amount
            }
        }

        return tiles;
    }

    getRandomTilesWithCount(count) {
        const tiles = [];

        while (tiles.length < count) {
            const randomIndex = Math.floor(Math.random() * this.pieces.length);
            const piece = this.pieces[randomIndex];

            if (piece.amount > 0) {
                tiles.push({ letter: piece.letter, value: piece.value });
                piece.amount--; // Decrement the amount
            }

            // Break out of the loop if there are no more tiles left to draw
            if (this.pieces.every(piece => piece.amount === 0)) {
                break;
            }
        }

        return tiles;
    }


    calculateRemainingTiles() {
        // Calculate total remaining tiles in the bag
        const totalTilesInBag = this.pieces.reduce((total, piece) => total + piece.amount, 0);

        // Update remaining tiles in the board UI
        console.log(`Remaining Tiles in Bag: ${totalTilesInBag}`);
        $("#remaining-tiles").text(totalTilesInBag);

        return totalTilesInBag;
    }


    initialize() {
        this.board.generateBoard(); // Generate the board
        const tiles = this.getRandomTilesWithCount(7); // Get random tiles for the initial rack
        this.tileRack.populateRack(tiles); // Populate the rack
        this.tileRack.makeTilesDraggable(); // Enable drag-and-drop for tiles
        this.board.makeBoardSquaresDroppable(); // Enable droppable areas on the board
        this.tileRack.makeRackDroppable(); // Allow tiles to return to the rack

        // Initialize the remaining tiles count
        const totalTilesInBag = this.pieces.reduce((total, piece) => total + piece.amount, 0);
        this.board.remainingTiles = totalTilesInBag; // Set the initial count
        this.calculateRemainingTiles(); // Adjust for the rack
    }

    nextWord() {
        // Update the highest score before resetting the current score
        this.board.calculateHighestScore();
        $("#highest-score").text(this.board.highestScore);

        // Clear the board
        $("#scrabble-board .tile").remove();

        // Reset current word and score
        this.board.currentWord = "";
        this.board.currentScore = 0;
        $("#word-display").text("------------");
        $("#current-score").text("0");

        // Refill the rack to ensure it has 7 tiles
        const tilesOnRack = $(".tile-container .tile").length;
        const tilesNeeded = 7 - tilesOnRack;

        if (tilesNeeded > 0) {
            const newTiles = this.getRandomTilesWithCount(tilesNeeded);
            if (newTiles.length > 0) {
                // Add new tiles to the existing ones
                newTiles.forEach(tile => {
                    const $tile = $("<img>", {
                        src: `resources/graphics_data/graphics_data/Scrabble_Tiles/Scrabble_Tile_${tile.letter}.jpg`,
                        alt: `Tile ${tile.letter}`,
                        class: "tile square",
                        "data-letter": tile.letter,
                        "data-value": tile.value
                    }).css({
                        width: "100px",
                        height: "110px",
                        position: "relative"
                    });
                    $(".tile-container").append($tile);
                });

                this.tileRack.makeTilesDraggable();
            } else {
                alert("No more tiles left in the bag!");
                console.log("No more tiles left in the bag.");
            }
        }

        // Update remaining tiles
        this.calculateRemainingTiles();

        // Reset validation rules
        $("#rule-no-gap .status-check").text("✘").css("color", "red");
        $("#rule-min-letters .status-check").text("✘").css("color", "red");
        $("#rule-found-dictionary .status-check").text("✘").css("color", "red");

        // Disable the "Next Word" button
        this.board.disableNextWordButton();

        console.log("Next word setup complete.");
    }

    startOver() {
        // Reset pieces to the original state
        this.pieces = JSON.parse(JSON.stringify(this.originalPieces));

        // Reset the highest score, current score, and word
        this.board.highestScore = 0;
        this.board.currentScore = 0;
        this.board.currentWord = "";

        // Update the UI
        $("#highest-score").text("0");
        $("#current-score").text("0");
        $("#word-display").text("------------");

        // Clear the board
        $("#scrabble-board .tile").remove();

        // Refill the rack with new tiles
        const newTiles = this.getRandomTilesWithCount(7);
        this.tileRack.populateRack(newTiles);
        this.tileRack.makeTilesDraggable();

        // Update remaining tiles
        this.board.remainingTiles = this.pieces.reduce((total, piece) => total + piece.amount, 0);
        $("#remaining-tiles").text(this.board.remainingTiles);

        // Reset validation rules
        $("#rule-no-gap .status-check").text("✘").css("color", "red");
        $("#rule-min-letters .status-check").text("✘").css("color", "red");
        $("#rule-found-dictionary .status-check").text("✘").css("color", "red");

        // Disable the "Next Word" button
        this.board.disableNextWordButton();

        console.log("Game has been reset.");
    }







}


// Main Script
// Initializes the board layout, square images, and game logic on document ready.
// Configures buttons:
// "Start Over": Resets the game state using the startOver method.
// "Next Word": Prepares the board for the next word using the nextWord method.
$(document).ready(() => {
    // Define board layout and square images
    const squares = [
        "plain", "double-letter", "plain", "plain",
        "double-word", "plain", "plain", "double-word",
        "plain", "plain", "double-letter", "plain"
    ];
    const squareImages = {
        plain: "resources/graphics_data/graphics_data/plain_square_tile_size.png",
        "double-letter": "resources/graphics_data/graphics_data/double_letter_tile_size.png",
        "double-word": "resources/graphics_data/graphics_data/double_word_square_tile_size.png"
    };

    // Create instances
    const board = new ScrabbleBoard(squares, squareImages, "#scrabble-board");
    const tileRack = new TileRack(".tile-container");
    tileRack.board = board; // Assign the ScrabbleBoard instance to the TileRack instance
    const game = new ScrabbleGame(board, tileRack);

    // Initialize the game
    game.initialize();

    // Reset button functionality
    $("#start-over").click(() => {
        game.startOver(); // Call the startOver method
    });

    $("#next-word").click(() => {
        game.nextWord(); // Call the nextWord method when clicked
    });

});


/* sources : 
https://jesseheines.com/~heines/91.461/91.461-2015-16f/461-assn/ScrabbleBoard.jpg
https://d1b10bmlvqabco.cloudfront.net/attach/icm9jynacvn5kx/i5ic1b2hwmz6nv/ihf34c9jbxpw/Scrabble_Board_OneLine.png
https://jesseheines.com/~heines/91.461/91.461-2015-16f/461-assn/Scrabble_LetterTiles.png
https://pixabay.com/static/uploads/photo/2014/07/31/20/48/scrabble-tile-holder-406774_640.png
https://www.youtube.com/watch?v=dSXSYwBBTFs&feature=youtu.be
https://en.wikipedia.org/wiki/Scrabble
http://yongcho.github.io/GUI-Programming-1/assignment9.html
https://www.scrabblewizard.com/scrabble-tile-distribution/
The provided zip (graphics_data.zip)
https://jqueryui.com/
https://d1b10bmlvqabco.cloudfront.net/attach/icm9jynacvn5kx/i5ic1b2hwmz6nv/ihf34c9jbxpw/Scrabble_Board_OneLine.png
https://gist.github.com/WChargin/8927565 */




