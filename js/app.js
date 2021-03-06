// Enemies our player must avoid
var Enemy = function() {

    this.sprite = 'images/enemy-bug.png';

    /* SET EACH ENEMY'S START LOCATION & SPEED BASED ON ORDER OF CREATION "i" IN "allEnemies" ARRAY
     width 101 & height 80 are the increments for the rows/columns*/
    this.width = 101;
    this.height = 80;
    //start position "-this.width" places the enemies off screen at start
    this.x = -this.width;
    //randomly places enemies in the 3 stone/brick rows at game start
    this.y = gameBoard.rowStartY + Math.ceil(Math.random() * 3) * gameBoard.rowHeightY;
    //assigns a random speed between 242.5 - 400 at start
    this.speed = 225 + 17.5 * Math.ceil(Math.random() * 10);
};

// Update the enemy's position, and monitor for collisions
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // Simple position change in X value based on time change & speed
    this.x = this.x + this.speed * dt;
    //reposition enemy that has moved off screen right to return screen left & reset speed & row randomly
    if (this.x > 505) {
        this.x = -this.width * 2;
        this.y = gameBoard.rowStartY + Math.ceil(Math.random() * 3) * gameBoard.rowHeightY;
        this.speed = 225 + 17.5 * Math.ceil(Math.random() * 10);
    }

    //Collision detection between enemy & player
    /*check to see if enemy is on row with enemy (y value) & if horizontal X values
    overlap (x position + width calc */
    if (player.death === false && this.y === player.y && this.x + this.width > player.x && this.x < player.x + player.width) {
        //if so run "deathFunction"
        player.deathFunction();
    }
};

// Function to draw the enemy on the screen
Enemy.prototype.render = function() {
    /* Crop source image to include only visible object, then draw onto canvas
     */
    ctx.drawImage(Resources.get(this.sprite), 0, 74, this.width, this.height, this.x, this.y, this.width, this.height);
};

/* create new Star "class" based on Enemy "prototype" */
var Star = function() {
    Enemy.call(this);
    //then add specific details unique to the Star class
    // The Star's "holder" is a randomly chosen "Enemy" that the "bonus star" will appear in front of & appear "pushed" by;
    this.holder = allEnemies[Math.floor(Math.random() * allEnemies.length)];
    this.sprite = 'images/Star.png';
    //"bonus star" is positioned in front of the "holder"
    this.x = this.holder.x + this.holder.width;
    this.y = this.holder.y;
    this.speed = this.holder.speed;

};
// completes the use of prototype Enemy's methods in Star class
Star.prototype = Object.create(Enemy.prototype);
// links Star as the constructor of Star
Star.prototype.constructor = Star;
//timer methods for "bonus star" appearance / disappearance
Star.prototype.update = function() {
    //if no "bonus star" has appeared for 8 sec, then make it appear
    if ((Date.now() - player.bonusTime) > 8000) {
        player.bonusTime = Date.now();
    } else if (Date.now() - player.bonusTime < 5000) {
        /* keeps the "bonus star" off screen for 5 sec after bonusTime reset */
        this.x = -101;
    } else {
        //places bonus star in front of the "holder" enemy, if it's been more than 5 secs since it disappeared
        this.x = this.holder.x + this.holder.width;
        this.y = this.holder.y;
        /*if bonus star overlaps with player, reset bonusTime, award extra life*/
        if (player.death === false && this.y === player.y && this.x + this.width > player.x && this.x < player.x + player.width) {
            player.bonusTime = Date.now();
            player.lives += 1;
        }
    }
};

Star.prototype.render = function() {
    /* Crop source image to include only visible object, then draw onto canvas */
    ctx.drawImage(Resources.get(this.sprite), 0, 50, this.width, 101, this.x, this.y, this.width, this.height);
};

/* Player function sets image and start position for Player objects
 */
var Player = function() {
    this.sprite = 'images/char-boy.png';
    //to provide image contrast for dead player
    this.deadSprite = 'images/char-boy-red.png';
    //to provide image contrast for scoring player
    this.scoreSprite = 'images/char-boy-inverse.png';
    //start positions using row/column calculations
    this.x = gameBoard.columnStartX + 2 * gameBoard.columnWidthX;
    this.y = gameBoard.rowStartY + 5 * gameBoard.rowHeightY;
    this.width = 68;
    this.height = 90;
    //counter for key stroke position calculations
    this.moveX = 0;
    this.moveY = 0;
    //info for player death sequence
    this.death = false;
    this.deathTime = 0;
    this.score = false;
    //info for scoring sequence
    this.scoreTime = Date.now(); //+15000;
    this.scoreTotal = 0;
    //counter for player lives
    this.lives = 3;
    //info for bonus sequence
    this.bonusTime = Date.now();
    //counter for player clock display
    this.timeLeft = Math.round((15 - (Date.now() - this.scoreTime) / 1000));
};
// Logic for calculating state of play for player
Player.prototype.update = function() {
    //update time remaining to score
    this.timeLeft = Math.round((15 - (Date.now() - this.scoreTime) / 1000));
    // player is dead if time left gets down to zero
    if (this.timeLeft <= 0) {
        this.deathFunction();
    }
    //after player SCORES & therefore .score === true...
    if (this.score === true) {
        if (Date.now() - this.scoreTime < 2000) {
            //prevent movement for 2 secs
            this.freezeMove();
        } else {
            /*After 2 sec hold expires, resets scoring player (score: true -> false)
            and moves player into starting position */
            this.freezeMove();
            this.reset();
        }
        // DEATH: Updating players after DEATH (collision with enemy)
    } else if (this.death === true) {
        //Filters for players with lives left to use
        if (this.lives > 0) {
            // if 2 secs have elapsed since death, player is reset to death position.
            if (Date.now() - this.deathTime > 2000) {
                this.freezeMove();
                this.reset();
            } else {
                /* but if 2 secs haven't elapsed since death, then player holds in position
                unable to move */
                this.freezeMove();
            }
        } else {
            //Holds dead player with NO lives left to play in position on screen for 2 secs
            if (Date.now() - this.deathTime < 2000) {
                this.freezeMove();
            } else {
                /*HIDES dead player with NO lives left to play off screen & bottom row,
                and and locks movement forever - essentially "GAME OVER"*/
                this.x = gameBoard.columnStartX - gameBoard.columnWidthX;
                this.y = gameBoard.rowStartY + 5 * gameBoard.rowHeightY;
                this.freezeMove();
            }
        }
    } // end of scoring & death updating
    //MOVEMENT: Updates Player horiz position based on moveX
    this.x += this.moveX;
    this.moveX = 0; //empties the moveX value after use above
    //if player is not out of lives, rules to keep player from going off the gameboard:
    //keeps player from exiting left side
    if (player.lives > 0 && this.x < gameBoard.columnStartX) {
        this.x = gameBoard.columnStartX;
    }
    //keeps player from exiting right side
    if (this.x > gameBoard.columnStartX + 4 * gameBoard.columnWidthX) {
        this.x = gameBoard.columnStartX + 4 * gameBoard.columnWidthX;
    }
    //Updates Player vert position based on moveY
    this.y += this.moveY;
    this.moveY = 0; // empties the moveY value after use above
    //keep player from exiting bottom
    if (this.y > gameBoard.rowStartY + 5 * gameBoard.rowHeightY) {
        this.y = gameBoard.rowStartY + 5 * gameBoard.rowHeightY;
    }
    /*SCORING: If player reaches top vert row (water), set .score togle to true,
    assign points to scoreTotal & reset scoreTime */
    if (this.score === false && this.y === gameBoard.rowStartY) {
        this.scoreTime = Date.now();
        this.score = true;
        this.scoreTotal += 10;
    }
};
//method to render game character after update calcs
Player.prototype.render = function() {
    /* drawImage items crop source image */
    // Death image render uses "modulo" formula to flicker between normal and dead sprite to indicate death
    if (this.death === true) {
        if (Math.floor((Date.now() - this.deathTime) / 100) % 2 > 0) {
            ctx.drawImage(Resources.get(this.deadSprite), 18, 60, this.width, this.height, this.x, this.y, this.width, this.height);
        } else {
            ctx.drawImage(Resources.get(this.sprite), 18, 60, this.width, this.height, this.x, this.y, this.width, this.height);
        }
    } else if (this.score === true) {
        // Scoring image render uses modulo formula to flicker between normal and score sprite to indicate score victory
        if (Math.floor((Date.now() - this.scoreTime) / 100) % 2 > 0) {
            ctx.drawImage(Resources.get(this.scoreSprite), 18, 60, this.width, this.height, this.x, this.y, this.width, this.height);
        } else {
            ctx.drawImage(Resources.get(this.sprite), 18, 60, this.width, this.height, this.x, this.y, this.width, this.height);
        }
    } else {
        //normal sprite render when player isn't dead or scoring
        ctx.drawImage(Resources.get(this.sprite), 18, 60, this.width, this.height, this.x, this.y, this.width, this.height);
    }
};

Player.prototype.handleInput = function(playerKeyStroke) {
    /* Converts string directions from event listener's "allowedKeys"  x or y values
    added to moveX or Y variable, to be used in updating character position*/
    if (playerKeyStroke === 'left') {
        this.moveX += -gameBoard.columnWidthX;
    } else if (playerKeyStroke === 'right') {
        this.moveX += gameBoard.columnWidthX;
    } else if (playerKeyStroke === 'up') {
        this.moveY += -gameBoard.rowHeightY;
    } else if (playerKeyStroke === 'down') {
        this.moveY += gameBoard.rowHeightY;
    }
};

//sets player back to start position, and clears "score" and "death" toggles to false
Player.prototype.reset = function() {
    this.x = gameBoard.columnStartX + 2 * gameBoard.columnWidthX;
    this.y = gameBoard.rowStartY + 5 * gameBoard.rowHeightY;
    this.score = false;
    this.death = false;
};

//changes player info to indicate death has occurred and subtracts 1 life; resets score timer
Player.prototype.deathFunction = function() {
    this.death = true;
    this.deathTime = Date.now();
    this.lives += -1;
    this.scoreTime = Date.now();
};

//keeps player frozen in place by clearing moveX & Y; allows for "flicker" display of static player after death or scoring
Player.prototype.freezeMove = function() {
    this.moveX = 0;
    this.moveY = 0;
};

// gameBoard holds values useful in calculating uniform positions/collisions of Player, Star, Enemy
var gameBoard = {
    columnStartX: 18,
    rowStartY: 50,
    columnWidthX: 101,
    rowHeightY: 83
};
// Places all enemy objects in an array called allEnemies
//iterates 4 enemies as objects in the allEnemies array, addressable by index number
var allEnemies = [];
allEnemies.enemyNumber = 4;
for (i = 0; i < allEnemies.enemyNumber; i++) {
    var enemyInstance = new Enemy();
    allEnemies.push(enemyInstance);
}

// Instantiate a player via Player prototype
var player = new Player();

// create the bonus star
var star = new Star();

// This listens for key presses and sends the keys to
// player.handleInput() method.
document.addEventListener('keydown', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
