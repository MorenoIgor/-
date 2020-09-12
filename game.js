//Initiates the engine
let { init, Sprite, SpriteSheet, GameLoop, Vector, Animation} = kontra
let { canvas } = init();
kontra.initKeys();

//#region Loading the tileset and enemy sprites

let tileatlas = new Image();
tileatlas.src = "tiles.gif";
let tilesheet;
tileatlas.onload = function() {
    tilesheet = SpriteSheet({
        image: tileatlas,
        frameWidth: 16,
        frameHeight: 16,
        animations: {
            laddertile: {
                frames: '0..0', 
            },
            wall: {
                frames: '1..1', 
            },
            watertoptile: {
                frames: '2..2',
                frameRate: 4 
            },
            movingplatform: {
                frames: '3..3',
            },
            pushableblock: {
                frames: '4..4',
            },
            spring: {
                frames: '5..5',
            },
            acidtop: {
                frames: '6..7',
                frameRate: 10 
            },
            acidbody: {
                frames: '8..9',
                frameRate: 10 
            },
            404: {
                frames: '13..13',
            },
            gem: {
                frames: '10..11',
                frameRate: 4
            },
            lasercapsule: {
                frames: '12..12',
            },
            laddercollectible: {
                frames: '14..14',
            },
            watercollectible: {
                frames: '15..15',
            },
            springcollectible: {
                frames: '16..16',
            },
            platformcollectible: {
                frames: '17..17',
            },
            pushablecollectible: {
                frames: '18..18',
            },
            door: {
                frames: '19..19',
            },
        }
    });   
}
let enemyatlas = new Image();
enemyatlas.src = "enemies.gif";
let enemysheet;
enemyatlas.onload = function() {
    enemysheet = SpriteSheet({
        image: enemyatlas,
        frameWidth: 16,
        frameHeight: 16,
        animations: {
            bat: {
                frames: '0..1',
                frameRate: 8 
            },
            rat: {
                frames: '2..3',
                frameRate: 8 
            },
            scorpion: {
                frames: '4..6',
                frameRate: 8 
            },
            wisp: {
                frames: '7..9',
                frameRate: 12 
            }
        }
    });  
}
//#endregion

//Initializing variables
let playerspr, player, rightcol, leftcol, bottomcol, middlecol, topcol, shooting;
                            //Player variables
let block = new Array();    //Array containing the blocks that make up the levels
let enemies = new Array();  //Array containing the enemies
let laser;                  //Reference to the projectile shot by the player
let levelloaded = false;    //If the level is loaded
let gravity = {x:0, y:1};    //Vector containing gravity
let frameCount = 0;         //Frame counter for animation and effects
let currentlevel = 1;       //Stores the current level
let friction = 1;           //Used for levels with slippery floor
let rcol = false;           //Collision with the right collider
let lcol = false;           //Collision with the left collider
let startjump = false;      //Used to avoid registering multiple jumps at once
let dead = 0;               //Whether the player is currently dead, works as a counter
let gp;                     //For referencing the gamepad
let gamerunning;            //Whether the game has started, for timing purposes
let deathcount = 0;         //For displaying on the DOM
let gemsleft = 32;          //For displaying on the DOM
let boxesleft = 5;          //For dsplaying on the DOM
let onfloor = false;        //Exactly what it appears to do
let ladder = false;         //Whether the player is in contact with a ladder tile
let ladderclimb = false;    //Whether the player is actually climbing a ladder
let water = false;          // Whether the player is in water
let onmovingplatform = false;   //Whether the player is on a moving platform
let spacedown = false;      //Used to avoid jump spamming
let updateDOM = false;      //Used so that DOM manipulation does not screw with the game loop
let zdown = false;          //Used to avoid shoot spamming
let verblock = 0;           //Used to store the ID of the block the player currently stands on
let ladderx= 0;             //Used to store the X position of the ladder block (does not use ID due to screen change)  
let horspeed;               //Player's horizontal speed - varies according to situtation
let table404 = {            //Table for checking whether a block of given type has been activated in game
    "BLOCK": {
        found: true
    },
    "LADDER": {
        found: false
    },
    "WATER": {
        found: false
    },
    "MOVINGPLATFORM": {
        found: false
    },
    "SPRING": {
        found: false
    },
    "PUSHABLE": {
        found: false
    },
    "ACID": {
        found: true
    },
    "DOOR": {
        found: true
    },
    "GEM": {
        found: true
    }
};
let gemscollected = new Array();    //Array to track whether the gem in each level has been collected
for (let a=1;a<=48;a++) {
    gemscollected[a] = false;
}

spawnPlayer();

let loop = GameLoop({  //Main Game Loop
  update: function() { // update the game state

    if (player && tilesheet && enemysheet) { //Update 1.1: added verification so as not to have errors during resource loading
    //Copied straight from Mozilla Developer examples and modified for simplicity
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    gp = gamepads[0];

    if (!levelloaded) {
        loadLevel();
    }

    //Does not update the game if it is over
    if (currentlevel!=0) {

        //Used to start the timer
        if (!gamerunning) {
            if (Pressed("a")||Pressed("d")||Pressed("w")||Pressed("s")
            ||Pressed("left")||Pressed("right")||Pressed("up")||Pressed("down")
            ||Pressed("space")||Pressed("z")||Pressed("enter")) {
                gamerunning = true;
            }
        }

        if (player) {
            updatePlayer();
            player.update();

            //Resets laser if it is out of bounds
            if (laser.x<0 || laser.x>416) {
                resetLaser(); 
            }
            laser.update();
        }

        updateEnemies();
        updateBlocks();
        startjump = false;
        if (gamerunning) {
            frameCount++;
        }

        //Stops the player from moving for a single frame to deal with a bug when spawning on top of a level
        if (player) {
            if (!player.canmove) {
                player.canmove = true;
            }
        }
        if (gamerunning) {
            updateTimer();
        }
    }

    if (updateDOM==true) {
        updateDeathCounter();
        updateEnvelopeCounter();
        updateShootInstruction();
        updateTitle();
        updateDOM = false;
    }
    }
  },
  render: function() { // render the game state

    if (player && tilesheet && enemysheet) {    //Update 1.1: added verification so as not to have errors during resource loading
    for (i=0;i<=block.length-1;i++) {
        let anim = isFound(block[i].type)? block[i].anim : "404";
        
        if (anim!="none") {
            block[i].playAnimation(anim);
        }
        if (block[i].type=="WATER" && !block[i].watertop) {
            if (anim=="404") {
                block[i].color = "transparent";
            } else {
                block[i].color = "#005784";
            }
        }
        block[i].opacity = (anim==404 || (i>0 && block[i].type=="GEM" && block[i-1].type=="WATER") )? 0.5 : 1;
        if (!(block[i].type=="DOOR" && !isFound(block[i].type) && currentlevel!=0)) {
            block[i].render();
        }
    }

    for (i=0;i<=enemies.length-1;i++) {
        enemies[i].render();
    }
    
    if (player) {
        player.render();
        laser.render();
    }
  }
    }
});

loop.start();    //Starts the loop

function updatePlayer() {

    //Resets the shooting state
    if (everyXFrames(15)) {
        player.shooting = false;
    }

    //If the player is dead, wait for 30 frames and reset position
    //Counter goes to 31 because the variable is set to 1 when player is dead
    //so it can use 0 as false, forgoing another variable
    if (dead>0) {
        dead++;
        if (dead%31==0) {
            dead = 0;
            player.x = playerStartX;
            player.y = playerStartY;
        }
    }

    //Resetting the collision flags
    rcol = false;
    lcol = false;
    bcol = false;

    //If the player is underwater, adjust horizontal speed and opacity for visual effect
    if (water) {
        player.opacity = 0.5;
        horspeed = 2;
    } else {
        player.opacity = 1;
        horspeed = 3.8;   //was 4
    }
    
    //Deals with moving the player when climbing stairs, uses findBlock() to prevent player from
    //infinitely going down stairs by checking if they hit a wall
    if (Pressed('up') && ladder && !Pressed('left') && !Pressed('right')
    && findBlock(player.x,player.y-32)=="3" && dead==0) {
        player.y-=2;
        ladderclimb = true;
    }

    if (Pressed('down') && ladder && !Pressed('left') && !Pressed('right')
    && findBlock(player.x,player.y+5)!="1" && dead==0) {
        player.y+=2;
        ladderclimb = true;
    }
    
    //Makes the player jump, but prevents jump spamming by using the variable startjump
    //Also cancels ladder climbing
    if (Pressed('space') && (onfloor || water) && !spacedown && dead==0) {
        if (water) {
            player.dy = -6;
        } else {    
            player.dy = -12;
        }
        startjump = true;
        ladderclimb = false;
      }

    if (Pressed('space')) {
        spacedown = true;
    } else {
        spacedown = false;
    }

    //Player horizontal movement, which flips their X scale and cancels ladder climbing
    if (Pressed('left') && !Pressed('right') && player.canmove && dead==0) {
        player.scaleX = -1;
        if (!rcol) {
            player.dx = -horspeed;
            ladderclimb = false;
        }
      }
  
    if (Pressed('right') && !Pressed('left') && player.canmove && dead==0) {
        player.scaleX = 1;
        if (!rcol) {
            player.dx = horspeed;
            ladderclimb = false;
        }
    }

    //Shoots laser avoiding button spamming
    if (Pressed('z') && !zdown && laser.y==-64) {
        shootLaser();
    }
    if (Pressed('z')) {
        zdown = true;
    } else {
        zdown = false;
    }

    //Deals with friction, decelerating player accordingly
    //Update: variable friction was never used in the end
    if ((player.dx!=0 && onfloor) || water) { 
        if (player.scaleX == -1) {
            if (player.dx+friction>0 || rcol) {
                player.dx=0; 
            } else {
                player.dx += friction;
            }
        } else {
            if (player.dx-friction<0 || rcol) {
                player.dx=0;
                } else {
                player.dx -= friction;
            }
        }
    }
    
    //Iterates through each block and marks player collision accordingly if there is a collision with one of the colliders
    //The code iterates through the blocks again for vertical collision - not optimized but does not hinder performance
    //due to the small number of instances in each room
    block.forEach( function(element,index,array) {

        if (kontra.collides(rightcol,element) && isFound(element.type)) {
            if (block[index].type!="LADDER" && block[index].type!="WATER" && block[index].type!="GEM") {
                rcol = true;
            }        
        }
        if (kontra.collides(leftcol,element) && isFound(element.type)) {
            if (block[index].type!="LADDER" && block[index].type!="WATER" && block[index].type!="GEM") {
                lcol = true;
            }
        }
    }
    );

    //Horizontal wall collision based on the collisions detected above
    if (player.dx<0 && rcol) {
        player.dx = 0;
    } else if (player.dx>0 && rcol) {
        player.dx = 0;
    }

    //Limits player vertical speed from going beyond "terminal velocity"
    if (water) {
        if (player.dy > 0.5) {
            player.dy = 0.5;
        }
    } else {
        if (player.dy > 8) {
            player.dy = 8;
        }
    }

    //Initializes and sets some variables for dealing with vertical collision and other adjustments
    let ver = false;
    let sprng = false;
    let top = false;
    let grv;
    ladder = false;
    water = false;
    onmovingplatform = false;
    verblock = 0;

    //Iterares through the blocks for vertical collision checking
    for (i=0;i<=block.length-1;i++) {
        if (kontra.collides(bottomcol,block[i])) {
            if (block[i].y<player.y && player.x+player.width/2>=block[i].x && player.dy>=0) {
                //Sets a bottom collision flag and the block ID for positioning purposes
                if (block[i].type!="LADDER" && block[i].type!="WATER"
                && block[i].type!="GEM" && isFound(block[i].type)) {
                    ver = true;
                    verblock = i;
                }
                //Sets a flag in order to make the player jump if collided with a spring
                if (block[i].type=="SPRING" && isFound(block[i].type)) {
                    sprng = true;
                }
                //Resets player to start position if they collided with an acid block
                if (block[i].type=="ACID" && isFound(block[i].type)) {
                    killPlayer();
                } 
                
                //Makes water walkable if not found
                if (block[i].type=="WATER" && !isFound(block[i].type)) {
                    ver = true;
                    verblock = i;
                }
            }
         }

         //Sets a top collision flag and the block ID for positioning purposes
         if (kontra.collides(topcol,block[i])  && isFound(block[i].type)) {
            if (block[i].y<=player.y-player.height) {
                if (block[i].type!="LADDER"  && block[i].type!="WATER" && block[i].type!="GEM") {
                    ver = false;
                    top = true;
                    verblock = i; 
                }
            }
         }

         //Sets a flag if the player is colliding with a ladder block
         if (kontra.collides(bottomcol,block[i]) && isFound(block[i].type)) {
            if (block[i].type=="LADDER") {
                ladder = true;
                ladderx = block[i].x;
            }
        
         }

         //Sets a flag if the player is in water
         if (kontra.collides(middlecol,block[i]) && isFound(block[i].type)) {
            if (block[i].type=="WATER") {
                water = true;
            }
         }
    }

    //Sets a temporary gravity value for underwater and off-water gameplay
    if (!water) {
        grv = gravity.y;
    } else {
        grv = gravity.y/1.5;
    }

    //Deals with stopping the player vertically if there is a bottom collision by moving them upwards until
    //they are out of the block. Also deals with spring jumping
    if (ver == true) {
                
            while (kontra.collides(player,block[verblock]) && !ladderclimb) {
                player.y-=grv;
            }
            if (!startjump) {
                player.dy = 0;
            }
            onfloor = true;

            if (block[verblock].dx!=0) {
                onmovingplatform = true;
                if (!rcol && !lcol) {
                    player.x+=block[verblock].dx;
                }
            }

            if (sprng) {
                player.dy = -18;
                block[verblock].sprung = true;
            }
    
    } else if (top==true) { //Deals with top collisions in a similar manner
            player.dy = 0;
            while (kontra.collides(player,block[verblock])) {
                player.y+=grv;
            }
    }

    //Sets the flag of whether the player is on the floor or not
    if (!ver) {
        onfloor = false;
      }  

    //Moves the player down by 'grv' if they are not climbing a ladder
    //Also aligns the player with the ladder tile if they are
    if (!ladderclimb && levelloaded==true) {
        if (water==true) {
            player.dy+=grv;
        } else {
            player.dy += grv;
        }
    } else if (ladderclimb) {
        player.x = ladderx+player.width/2;
        player.dy = 0;
    }

    //Deals with specific situations with colliders regarding ladder climbing
    //so that the player can go down once they've reached the top and stop at the bottom
    if (!ladder && ladderclimb && Pressed('down')) {
        ladder = true;
    }
    if (ladderclimb && findBlock(player.x,player.y+5)=="0") {
        ladderclimb = false;
        ladder = false;
    }

    //Checks for level transition - works like screen wrapping
    if (player.x>416) {
        currentlevel++;
        levelloaded = false;
        player.x=0;
        playerStartX = player.x;
        playerStartY = player.y;
    }
    if (player.x<0) {
        currentlevel--;
        levelloaded = false;
        player.x=416;
        playerStartX = player.x;
        playerStartY = player.y;
    }
    if (player.y>320) {
        currentlevel+=8;
        levelloaded = false;
        player.y=16;
        playerStartX = player.x;
        playerStartY = player.y;
    }
    if (player.y<0 || (ladderclimb && player.y<=32 && Pressed("up"))
    || (water && player.y<=32 && player.dx<0)) {
        currentlevel-=8;
        levelloaded = false;
        player.y=320;
        playerStartX = player.x;
        playerStartY = player.y;
    }

    //Animation section - they are listed in a sort of priority order so that states can override previous ones
    if (player.dx==0 && onfloor) {
        player.playAnimation("idle");
    }

    if (player.dy!=gravity.y) {
        player.playAnimation("jump");
    }

    if ((Pressed('left') || Pressed('right'))
        && player.dy==gravity.y || water==true) { //player.dx!=0
        let fr;
        if (water) {
            fr = 4;
        } else {
            fr = 8;
        }
        player.playAnimation("run");
        player.currentAnimation.frameRate = fr;
    }
    

    if (ladderclimb) {
        let fr;
        if (Pressed('up') || Pressed('down')) {
            fr = 8;
        } else {
            fr = 0;
        }
        player.playAnimation("climb");
        player.currentAnimation.frameRate = fr;
    }

    if (player.shooting) {
        player.playAnimation("use");
    }

    if (dead>0) {
        player.playAnimation("dead");
    }
        
}

function updateBlocks() {

    //Iterates through each block to check collisions and interactions
    for (i=0;i<=block.length-1;i++) {

        //Resets the laser if it collided with a block
        if (kontra.collides(block[i],laser) && isFound(block[i].type) && block[i].type!="GEM") {
            resetLaser();
        }

        //Uses global frame count to animate water and acid tiles
        if (block[i].watertop == true && everyXFrames(8) && isFound(block[i].type)) {
           block[i].y+=block[i].y%16==0 ? 1 : -1; 
        }
        if (block[i].type=="ACID" && everyXFrames(12) && isFound(block[i].type)) {
            block[i].y+=block[i].y%16==0 ? 2 : -2; 
         }

        //Deals with the movement of moving platforms
        if (block[i].type == "MOVINGPLATFORM") {
            //If they collide with another block, reverse their direction multiplier
            //They store their original horizontal speed so that they can stop
            //if they hit the player and resume their movement
            block.forEach( function(element,index,array) {
                if (kontra.collides(block[i],block[index]) && index!=i) {
                    if (block[index].y==block[i].y) {
                        block[i].multiplier *= -1;
                    }
                }
            }
            );
            
            block[i].dx = block[i].originaldx * block[i].multiplier;

            //Stops movement if the player blocks their movement, but not if the player is "behind" the block
            if (kontra.collides(block[i],leftcol) || kontra.collides(block[i],rightcol) && isFound(block[i].type)) {
                if (player.x>block[i].x && block[i].dx>0) {
                    block[i].dx = 0;
                }
                if (player.x<block[i].x && block[i].dx<0) {
                    block[i].dx = 0;
                }
            }
        }

        //Deals with pushable blocks in a similar way that the player collisions are dealt with
        if (block[i].type=="PUSHABLE" && isFound(block[i].type)) {
            let cnmv=true;
            let blockfall = true;
            
            block.forEach( function(element,index,array) {
                if (kontra.collides(block[i],block[index]) && index!=i && block[index].type!="LADDER"
                && block[index].type!="GEM") {
                    if (Math.abs(block[index].y-block[i].y)<=Math.round(gravity.y*3)) { //gravity*3 is a magic number
                        cnmv=false;
                        if (block[index].x<block[i].x) {
                            block[i].x+=gravity.y*3;
                        } else {
                            block[i].x-=gravity.y*3;
                        }
                    }
                    if (block[index].y>block[i].y && block[index].type!="WATER" && block[index].type!="LADDER") {
                        block[i].y = block[index].y-32-(gravity.y*2);
                    }
                }
            }
            );

            if (kontra.collides(block[i],rightcol) && cnmv) {
                block[i].dx = player.dx;
            } else {
                block[i].dx = 0;
            }
            if (blockfall) {
                block[i].dy = gravity.y*3;
            } else {
                block[i].dy = 0;
            }
        }

        //Deals with spring blocks, especially setting their "compressed" state and reverting to normal
        //This trick takes advantage of the hierarchy z-positioning, since lower blocks are rendered last
        //This way the spring disappears into the block below, giving the illusion of it being compressed
        if (block[i].type=="SPRING" && isFound(block[i].type)) {
            if (block[i].sprung) {
                block[i].y=block[i].originaly+16;
                if (everyXFrames(30)) {
                    block[i].sprung = false;
                }
            } else {
                block[i].y=block[i].originaly;
            }
        }

        //If the block is a gem, update the collection status of the gem for that level
        //Then it hides the gem by moving it offscreen
        //Also repurposed for the collection of the key block items and laser capsules
        if (block[i].type=="GEM" && kontra.collides(block[i],rightcol)) {
            if (block[i].actualgem && gemscollected[currentlevel]==false) { //DOM glitch
                gemscollected[currentlevel] = true;
                gemsleft--;
                updateDOM = true;
            } else {
                switch(block[i].anim) {
                    case "laddercollectible":
                        table404.LADDER.found = true;
                        boxesleft--;
                        updateDOM = true;
                        levelloaded = false;
                    break;
                    case "watercollectible":
                        table404.WATER.found = true;
                        boxesleft--;
                        updateDOM = true;
                        levelloaded = false;
                    break;
                    case "springcollectible":
                        table404.SPRING.found = true;
                        boxesleft--;
                        updateDOM = true;
                        levelloaded = false;
                    break;
                    case "platformcollectible":
                        table404.MOVINGPLATFORM.found = true;
                        boxesleft--;
                        updateDOM = true;
                        levelloaded = false;
                    break;
                    case "pushablecollectible":
                        table404.PUSHABLE.found = true;
                        boxesleft--;
                        updateDOM = true;
                        levelloaded = false;
                    break;
                    case "lasercapsule":
                        player.ammo++;
                        updateDOM = true;
                    break;
                }
            }

            //Checks to see if the game is in its final state and reloads
            //so that the door on level 1 can be removed
            if (boxesleft==0 && gemsleft==0 && table404.DOOR.found==true) {
                table404.DOOR.found = false;
                levelloaded = false;
            }
            block[i].x = -32;
            block[i].y = -32;
        }

        block[i].update();
    }
}

function updateEnemies() {
    for (i=0;i<=enemies.length-1;i++) {
        //Uses the enemy's dx for animation speed
        enemies[i].playAnimation(enemies[i].type);
        enemies[i].currentAnimation.frameRate = Math.abs(enemies[i].dx)*8;
        enemies[i].walkcount += Math.abs(enemies[i].dx);
        //Flips the enemy around when it reaches the limit of its movement range
        if (enemies[i].walkcount>=enemies[i].hor && enemies[i].dx!=0) {
            enemies[i].dx *= -1;
            enemies[i].scaleX *= -1;
            enemies[i].walkcount = 0;
        }
        //Kills the player if the enemy's collider collides with any of the player's colliders
        if (kontra.collides(enemies[i].children[0],bottomcol)
        || kontra.collides(enemies[i].children[0],middlecol)
        || kontra.collides(enemies[i].children[0],leftcol)
        || kontra.collides(enemies[i].children[0],rightcol)) {
            killPlayer();
        }
        //Deals with enemy life when colliding with the laser
        if (kontra.collides(enemies[i].children[0],laser)) {
            resetLaser();
            enemies[i].life--;
            if (enemies[i].life==0) {
                enemies[i].y = -64;
                enemies[i].x = -64;
            }
        }
        enemies[i].update();
    }
}

//Borrowed from Arduboy library, uses modulus and a global frame counter for sequencing purposes
function everyXFrames(frm) {
    return frameCount % frm == 0;
}

//Returns whether a specific block type is in the 404 state or not
function isFound(type) {
    return table404[type].found;
}

//Function that returns the block type by finding the right character in the map string
//Created for ladder collision checking without having to add another collider to the player
//Does not take into account pushable blocks that can move, so level design takes that into account
//by never having stairs that end on top of blocks or even having this movement possibility in game
function findBlock(ecs, ips) {
    ecs = Math.floor(ecs/32);
    ips = Math.floor(ips/32);
    return levels[currentlevel].charAt(ecs+(ips*13));
}

//Populates the current level by iterating through the level string and spawning blocks accordingly
function loadLevel() {
    block = new Array();
    enemies = new Array();
    let playerStartX, playerStartY;
    for (i=0;i<=10;i++) {
        let subs = levels[currentlevel].substr(i*13,13);
        //alert(subs);
        for (a=0;a<=subs.length-1;a++) {
            if (subs.charAt(a)!="0") {
                    block.push(
                        Sprite( {
                            x: a*32,
                            y: i*32,
                            height: 32,
                            width: 32,
                        })
                    );
                    if (subs.charAt(a)=="#") {
                        block.push(
                            Sprite( {
                                x: a*32,
                                y: i*32,
                                height: 32,
                                width: 32,
                            })
                        );  
                    }
            }
            switch(subs.charAt(a)) {
                case "1":
                    block[block.length-1].type = "BLOCK";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "wall";
                break;
                case "2":
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].type = "MOVINGPLATFORM";
                    block[block.length-1].anim = "movingplatform";
                    block[block.length-1].dx = -1;
                    block[block.length-1].originaldx = -1;
                    block[block.length-1].multiplier = 1;
                break;
                case "3":
                    block[block.length-1].type = "LADDER";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "laddertile";
                break;
                case "4":
                    block[block.length-1].type = "WATER";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "none";
                break;
                case "5":
                    block[block.length-1].type = "WATER";
                    block[block.length-1].watertop = true;
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "watertoptile";
                break;
                case "6":
                    block[block.length-1].type = "PUSHABLE";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "pushableblock";
                break;
                case "7":
                    block[block.length-1].type = "SPRING";
                    block[block.length-1].sprung = false;
                    block[block.length-1].originaly = block[block.length-1].y;
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "spring";
                break;
                case "8":
                    block[block.length-1].type = "ACID";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "acidtop";
                break;
                case "9":
                    block[block.length-1].type = "ACID";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "acidbody";
                break;
                case "A":
                    block[block.length-1].type = "DOOR";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "door";
                break;
                case "*":
                    block[block.length-1].type = "GEM";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "gem";
                    block[block.length-1].actualgem = true;
                    if (gemscollected[currentlevel]==true) {
                        block[block.length-1].x = -32;
                        block[block.length-1].y = -32;
                    }
                break;
                case "%":
                    block[block.length-1].type = "GEM";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "lasercapsule";
                break;
                case "L":
                    block[block.length-1].type = "GEM";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "laddercollectible";
                    if (table404.LADDER.found==true) {
                        block[block.length-1].x = -32;
                        block[block.length-1].y = -32;
                    }
                break;
                case "W":
                    block[block.length-1].type = "GEM";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "watercollectible";
                    if (table404.WATER.found==true) {
                        block[block.length-1].x = -32;
                        block[block.length-1].y = -32;
                    }
                break;
                case "S":
                    block[block.length-1].type = "GEM";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "springcollectible";
                    if (table404.SPRING.found==true) {
                        block[block.length-1].x = -32;
                        block[block.length-1].y = -32;
                    }
                break;
                case "M":
                    block[block.length-1].type = "GEM";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "platformcollectible";
                    if (table404.MOVINGPLATFORM.found==true) {
                        block[block.length-1].x = -32;
                        block[block.length-1].y = -32;
                    }
                break;
                case "P":
                    block[block.length-1].type = "GEM";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "pushablecollectible";
                    if (table404.PUSHABLE.found==true) {
                        block[block.length-1].x = -32;
                        block[block.length-1].y = -32;
                    }
                break;
                case "#":
                    block[block.length-2].type = "WATER";
                    block[block.length-2].animations = tilesheet.animations;
                    block[block.length-2].anim = "none";

                    block[block.length-1].type = "GEM";
                    block[block.length-1].animations = tilesheet.animations;
                    block[block.length-1].anim = "gem";
                    block[block.length-1].actualgem = true;
                    if (gemscollected[currentlevel]==true) {
                        block[block.length-1].x = -32;
                        block[block.length-1].y = -32;
                    }
                break;
            }
        } 
    }
    placeEnemies();
    updateDOM = true;
    player.ammo = 0;
    levelloaded = true;
}

//Spawns the player - only executed once when loading the first stage
function spawnPlayer() {

    updateEnvelopeCounter();
    playerspr = new Image();
    playerspr.src = "player.gif";
    playerspr.onload = function() {
        let playersheet = SpriteSheet({
            image: playerspr,
            frameWidth: 16,
            frameHeight: 16,
            animations: {
            idle: {
                    frames: '0..0', 
                    frameRate: 30
                  },
            jump: {
                    frames: '1..1',
                    frameRate: 30
                  },
              run: {
                frames: '1..2',
                loop: true,
                frameRate: 8
              },
              climb: {
                frames: '3..4',
                frameRate: 6
              },
              use: {
                frames: '5..5',
                frameRate: 30
              },
              dead: {
                frames: '6..6',
                frameRate: 30
              }
            }
          });  
        player.animations = playersheet.animations;
        player.canmove = true;
        player.ammo = 0;
    }
    
    //#region Initializing the player Sprite and its children, used as colliders
    player = Sprite( {
        x: 48,
        y: 300,
        height: 32,
        width: 32,
        shooting: false,
        //color: "red",
        anchor: {x: 0.5, y: 1},
    });
    
    rightcol = Sprite( {
        x: 12,  //17
        y: -30,
        height: 24,
        width: 5,
        //color: "white"
    });
    
    leftcol = Sprite( {
        x: -13-5,   //-17-5
        y: -30,
        height: 24,
        width: 5,
        //color: "red"
    });
    
    bottomcol = Sprite( {
        x: -10,
        y: -5,
        height: 5,
        width: 20,
        //color: "white"
    });
    
    middlecol = Sprite( {
        x: -12,
        y: -15,
        height: 5,
        width: 20,
        //color: "white"
    });
    
    topcol = Sprite( {
        x: -12,
        y: -32,
        height: 5,
        width: 20,
        //color: "white"
    });
    
    player.addChild(rightcol);
    player.addChild(leftcol);
    player.addChild(bottomcol);
    player.addChild(middlecol);
    player.addChild(topcol);

    laser = Sprite( {
        x: -64,
        y: -64,
        height: 4,
        width: 8,
        color: "#66ccff"
    });
}

//Kills the player
function killPlayer() {
    if (dead==0) {
    player.canmove = false;
    dead = 1;
    deathcount++;
    updateDOM=true;
    }
}

//Spawns an enemy
function spawnEnemy(typ,ecs,ips,spd,hor,scl) {
    let enm = Sprite( {
        x: (ecs*16)+16,
        y: ips*16,
        dx: spd,
        hor: hor,
        height: 32,
        width: 32,
        type: typ,
        walkcount: 0,
        anchor: {x: 0.5, y: 0},
        animations: enemysheet.animations
    });
    if (spd!=0) {
        enm.scaleX = Math.sign(spd);
    } else {
        enm.scaleX = scl;
    }
    switch (typ) {
        case "scorpion": enm.life = 2; break;
        case "wisp": enm.opacity = 0.5; break;
        default: enm.life = 1; break;
    }
    //Enemy's collider
    let enmcol = Sprite( {
        x: 0,
        y: 16,
        height: 12,
        width: 20,
        anchor: {x: 0.5, y: 0},
    });
    enm.addChild(enmcol);
    enemies.push(enm);
}

//Places enemies according to level
//This system was favored instead of marking the tileset in order to give fine tune over position, speed and orientation
function placeEnemies() {
    switch (currentlevel) {
        case 3:
            spawnEnemy("rat",16,4,0.5,32,-1);
        break;
        case 4:
            spawnEnemy("rat",16,6,0,0,-1);
        break;
        case 5:
            spawnEnemy("bat",14,6,-1,96,-1);
        break;
        case 6:
            spawnEnemy("scorpion",8,8,-0.5,32,-1);
        break;
        case 8:
            if (table404.WATER.found==true ) {
                spawnEnemy("wisp",2,12,2,304,1);
                spawnEnemy("wisp",22,14,-2,304,-1);
            }
        break;
        case 10:
            spawnEnemy("bat",8,10,1,96,1);
            spawnEnemy("bat",16,12,-1,96,-1);
        break;
        case 11:
            if (table404.WATER.found==true ) {
                spawnEnemy("wisp",2,10,2,304,1);
                spawnEnemy("wisp",22,14,-2,304,-1);
            }
        break;
        case 13:
            spawnEnemy("bat",4,6,1,256,1);
        break;
        case 15:
            spawnEnemy("rat",14,8,0,0,-1);
        break;
        case 17:
            spawnEnemy("wisp",8,10,1,96,1);
            spawnEnemy("wisp",16,12,-1,96,-1);
        break;
        case 18:
            spawnEnemy("scorpion",8,6,1,128,1);
        break;
        case 19:
            spawnEnemy("bat",8,6,1,96,1);
            spawnEnemy("bat",16,12,-1,96,-1);
        break;
        case 20:
            spawnEnemy("rat",6,10,0,0,1);
        break;
        case 21:
            spawnEnemy("rat",6,4,0,0,1);
            spawnEnemy("rat",14,10,0.5,32,1);
        break;
        case 22:
            spawnEnemy("rat",14,10,0,0,1);
            spawnEnemy("rat",14,4,0.5,32,1);
        break;
        case 23:
            spawnEnemy("scorpion",4,14,1,64,1);
        break;
        case 26:
            spawnEnemy("bat",18,4,-1,208,-1);
        break;
        case 27:
            spawnEnemy("rat",4,6,0.5,64,1);
        break;
    }
}

//Shoots laser
function shootLaser() {
    if (player.ammo>0) {
        laser.x = player.x;
        laser.y = player.y-player.height/2;
        laser.dx = player.scaleX*8;
        player.shooting = true;
        player.ammo--;
        updateDOM = true;
    }
}

//Resets laser
function resetLaser() {
    laser.y = -64;
    laser.dx = 0;
}

//Functions for updating the DOM so as not to include UI in-game
//If updated during gameplay it messes up rendering, so all DOM manipulation happens on late update
function updateDeathCounter() {
    let dt="";
    for (i=1;i<=deathcount;i++) {
        dt+="💀";
    }
    document.getElementById("deathcount").innerHTML = dt;
}

function updateEnvelopeCounter() {
    let et="";
    for (i=1;i<=gemsleft;i++) {
        et+="✉️";
    }
    document.getElementById("envcount").innerHTML = et;
}

function updateShootInstruction() {
    let at="";
    for (i=1;i<=player.ammo;i++) {
        at+="⚡";
    }
    document.getElementById("shoot").innerHTML = at;
}

function updateTitle() {
    let tt="";
    for (i=1;i<=boxesleft;i++) {
        tt+="📦";
    }
    if (boxesleft==0 && gemsleft==0) {
        tt="🚪"
    }
    //If the game is over, display the run's time, including three decimal places for speedrunning purposes
    if (currentlevel==0) {
        tt="";
        tt+=Math.floor(frameCount/60/60);
        tt+=":";
        let num = (frameCount/60)%60;
        if (num<10) {
            tt+="0";
        }
        tt+=num.toFixed(3);
        document.getElementById("timer").innerHTML = "Well Done!";
    }
    document.getElementById("title").innerHTML = tt;
}

function updateTimer() {
    let tt="";
    tt+=Math.floor(frameCount/60/60);
    tt+=":";
    let num = (frameCount/60)%60;
    if (num<10) {
        tt+="0";
    }
    tt+=num.toFixed(3);
    document.getElementById("timer").innerHTML = tt;
}

//Function for dealing with controls, making it easier to implement differente control schemes, including gamepad
function Pressed(key) {
    switch(key) {
        case "left": return kontra.keyPressed(key) || kontra.keyPressed("a") || (gp && (gp.buttons[14].pressed || Math.round(gp.axes[0])==-1)) ? true : false; break; 
        case "right": return kontra.keyPressed(key) || kontra.keyPressed("d") || (gp && (gp.buttons[15].pressed || Math.round(gp.axes[0])==1)) ? true : false; break; 
        case "up": return kontra.keyPressed(key) || kontra.keyPressed("w") || (gp && (gp.buttons[12].pressed || Math.round(gp.axes[1])==-1)) ? true : false; break;
        case "down": return kontra.keyPressed(key) || kontra.keyPressed("s") || (gp && (gp.buttons[13].pressed || Math.round(gp.axes[1])==1)) ? true : false; break;  
        case "space": return kontra.keyPressed(key) || (gp && gp.buttons[0].pressed) ? true : false; break; 
        case "z": return kontra.keyPressed(key) || kontra.keyPressed("enter") || (gp && gp.buttons[2].pressed) ? true : false; break;
    }
}