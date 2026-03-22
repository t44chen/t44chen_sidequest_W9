/*
  Week 6 — Example 3: Expanded Tile-Based Level with Camera Follow, Fall Reset, and Scrolling Background

  Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
  Date: Feb. 26, 2026

  Controls:
    A or D (Left / Right Arrow)   Horizontal movement
    W (Up Arrow)                  Jump
    Space Bar                     Attack
    ` (Backtick)                  Toggle Debug Menu
*/

let player, sensor, treasure;
let bgLayers = [];
let playerImg, bgForeImg, bgMidImg, bgFarImg, treasureImg;

// UI variables for our HTML overlay
let uiDiv, endDiv;

// Audio variables
let runSound, jumpSound, fallSound;

let playerAnis = {
  idle: { row: 0, frames: 4, frameDelay: 10 },
  run: { row: 1, frames: 4, frameDelay: 3 },
  jump: { row: 2, frames: 3, frameDelay: Infinity, frame: 0 },
  attack: { row: 3, frames: 6, frameDelay: 2 },
};

let ground, groundDeep, platformsL, platformsR, wallsL, wallsR;
let groundTile1Img,
  groundTile2Img,
  platforTileLImg,
  platforTileRImg,
  wallTileLImg,
  wallTileRImg;

let attacking = false;
let attackFrameCounter = 0;

// --- GAME LOGIC VARIABLES ---
let gameState = "PLAYING";
let currentLevel = 1; // Track the current level
let maxTime = 30; // Stores the starting time for the level
let timeLeft = 30;
let timerStarted = false;
let lastTick = 0;

// --- DEBUG MENU VARIABLES ---
let debugMenuOpen = false;
let dbgShowStats = false;
let dbgShowCollisions = false;
let dbgInvincible = false;

// Coordinate grids (column and row) targeting the upper platforms
let spawnPoints = [
  { c: 17, r: 1 },
  { c: 5, r: 2 },
  { c: 11, r: 2 },
  { c: 23, r: 2 },
  { c: 4, r: 4 },
  { c: 15, r: 4 },
  { c: 21, r: 4 },
];

// --- TILE MAP ---
let level = [
  "                    g                   ", // row  0
  "                                        ", // row  1
  "                LggR                    ", // row  2
  "     LR   LgR          LR               ", // row  3: upper platforms
  "                                        ", // row  4
  "   LgggR       LR   LgR                 ", // row  5: mid platforms
  "         LgR            g   LggggR      ", // row  6: walls + low platform
  "               LgR                      ", // row  7
  "                                    LggR", // row  8
  "          LgR               LR  LR  [dd]", // row  9: mid-right platform
  "          [d]        gggg           [dd]", // row 10: wall below mid-right platform
  "ggggg  gggggggg   ggggggg  g ggggggggggg", // row 11: surface ground WITH GAPS
  "ddddd  dddddddd   ddddddd    ddddddddddd", // row 12: deep ground
];

// --- LEVEL CONSTANTS ---
const TILE_W = 24;
const TILE_H = 24;

const FRAME_W = 32;
const FRAME_H = 32;

const LEVELW = TILE_W * level[0].length;
const LEVELH = TILE_H * level.length;

const VIEWTILE_W = 10;
const VIEWTILE_H = 8;
const VIEWW = TILE_W * VIEWTILE_W;
const VIEWH = TILE_H * VIEWTILE_H;

const PLAYER_START_Y = LEVELH - TILE_H * 4;
const GRAVITY = 10;

function preload() {
  playerImg = loadImage("assets/foxSpriteSheet.png");
  bgFarImg = loadImage("assets/background_layer_1.png");
  bgMidImg = loadImage("assets/background_layer_2.png");
  bgForeImg = loadImage("assets/background_layer_3.png");
  groundTile1Img = loadImage("assets/groundTile.png");
  groundTile2Img = loadImage("assets/groundTileDeep.png");
  platformTileLImg = loadImage("assets/platformLC.png");
  platformTileRImg = loadImage("assets/platformRC.png");
  wallTileLImg = loadImage("assets/wallL.png");
  wallTileRImg = loadImage("assets/wallR.png");

  treasureImg = loadImage("assets/treasure.png");

  runSound = loadSound("assets/running.mp3");
  jumpSound = loadSound("assets/jumping.mp3");
  fallSound = loadSound("assets/falling.mp3");
}

function setup() {
  new Canvas(VIEWW, VIEWH, "pixelated");
  noSmooth();

  applyIntegerScale();
  window.addEventListener("resize", applyIntegerScale);

  allSprites.pixelPerfect = true;
  world.gravity.y = GRAVITY;

  // --- HTML UI OVERLAY ---
  uiDiv = createDiv(
    '<div style="font-family: \'Times New Roman\', serif; font-size: 32px; font-weight: bold;"><span id="level-span" style="color: #FFD700;">Level 1</span><br>Find the treasure before time runs out<br><span id="time-span" style="font-size: 42px;">30s</span></div>',
  );
  uiDiv.position(0, 0);
  uiDiv.style("width", "100%");
  uiDiv.style("background", "rgba(0, 0, 0, 0.6)");
  uiDiv.style("color", "white");
  uiDiv.style("text-align", "center");
  uiDiv.style("padding", "10px 0");
  uiDiv.style("pointer-events", "none");

  endDiv = createDiv(
    '<div id="end-title" style="font-family: \'Times New Roman\', serif; font-size: 64px; font-weight: bold;"></div><div id="end-subtitle" style="font-family: \'Times New Roman\', serif; font-size: 32px; margin-top: 15px; color: white;">Press R to restart</div>',
  );
  endDiv.position(0, 0);
  endDiv.style("width", "100%");
  endDiv.style("height", "100%");
  endDiv.style("background", "rgba(0, 0, 0, 0.8)");
  endDiv.style("display", "none");
  endDiv.style("flex-direction", "column");
  endDiv.style("justify-content", "center");
  endDiv.style("align-items", "center");
  endDiv.style("pointer-events", "none");

  // --- TILE GROUPS ---
  ground = new Group();
  ground.physics = "static";
  ground.img = groundTile1Img;
  ground.tile = "g";

  groundDeep = new Group();
  groundDeep.physics = "static";
  groundDeep.img = groundTile2Img;
  groundDeep.tile = "d";

  platformsL = new Group();
  platformsL.physics = "static";
  platformsL.img = platformTileLImg;
  platformsL.tile = "L";

  platformsR = new Group();
  platformsR.physics = "static";
  platformsR.img = platformTileRImg;
  platformsR.tile = "R";

  wallsL = new Group();
  wallsL.physics = "static";
  wallsL.img = wallTileLImg;
  wallsL.tile = "[";

  wallsR = new Group();
  wallsR.physics = "static";
  wallsR.img = wallTileRImg;
  wallsR.tile = "]";

  new Tiles(level, 0, 0, TILE_W, TILE_H);

  // --- PLAYER ---
  player = new Sprite(FRAME_W, PLAYER_START_Y, FRAME_W, FRAME_H);
  player.spriteSheet = playerImg;
  player.rotationLock = true;
  player.anis.w = FRAME_W;
  player.anis.h = FRAME_H;
  player.anis.offset.y = -8;
  player.addAnis(playerAnis);

  player.ani = "idle";
  player.w = 18;
  player.h = 12;
  player.friction = 0;
  player.bounciness = 0;

  // --- TREASURE ---
  treasureImg.resize(24, 0);

  treasure = new Sprite();
  treasure.img = treasureImg;
  treasure.w = 16;
  treasure.h = 16;
  treasure.collider = "static";
  treasure.overlaps(player);

  resetLevel(false, 1);

  // --- GROUND SENSOR ---
  sensor = new Sprite();
  sensor.x = player.x;
  sensor.y = player.y + player.h / 2;
  sensor.w = player.w;
  sensor.h = 2;
  sensor.mass = 0.01;
  sensor.removeColliders();
  sensor.visible = false;
  let sensorJoint = new GlueJoint(player, sensor);
  sensorJoint.visible = false;

  // --- BACKGROUND  ---
  bgLayers = [
    { img: bgFarImg, speed: 0.2 },
    { img: bgMidImg, speed: 0.4 },
    { img: bgForeImg, speed: 0.6 },
  ];

  world.autoStep = false;
}

function draw() {
  background(69, 61, 79);

  // --- DEBUG MENU TOGGLE LOGIC ---
  if (kb.presses("`")) {
    debugMenuOpen = !debugMenuOpen;
  }

  // Handle Input for Debug Menu
  if (debugMenuOpen) {
    if (kb.presses("1")) {
      dbgShowStats = !dbgShowStats;
    }
    if (kb.presses("2")) {
      dbgShowCollisions = !dbgShowCollisions;
      allSprites.debug = dbgShowCollisions;
    }
    if (kb.presses("3")) {
      dbgInvincible = !dbgInvincible;
    }
  }

  if (gameState === "PLAYING") {
    world.step();

    // --- TIMER LOGIC ---
    if (!timerStarted) {
      if (kb.pressing("left") || kb.pressing("right") || kb.presses("up")) {
        timerStarted = true;
        lastTick = millis();
      }
    } else {
      if (millis() - lastTick >= 1000) {
        if (!dbgInvincible && timeLeft > 0) {
          timeLeft--;
        }
        lastTick = millis();
        let timeDisplay = dbgInvincible ? "∞" : timeLeft + "s";
        document.getElementById("time-span").innerText = timeDisplay;
      }
    }

    // --- CAMERA ---
    camera.width = VIEWW;
    camera.height = VIEWH;

    let targetX = constrain(
      player.x,
      VIEWW / 2,
      LEVELW - VIEWW / 2 - TILE_W / 2,
    );
    let targetY = constrain(
      player.y,
      VIEWH / 2 - TILE_H * 2,
      LEVELH - VIEWH / 2 - TILE_H,
    );

    camera.x = Math.round(lerp(camera.x || targetX, targetX, 0.1));
    camera.y = Math.round(lerp(camera.y || targetY, targetY, 0.1));

    // --- PLAYER CONTROLS ---
    let grounded =
      sensor.overlapping(ground) ||
      sensor.overlapping(platformsL) ||
      sensor.overlapping(platformsR);

    // -- ATTACK INPUT --
    if (grounded && !attacking && kb.presses("space")) {
      attacking = true;
      attackFrameCounter = 0;
      player.vel.x = 0;
      player.ani.frame = 0;
      player.ani = "attack";
      player.ani.play();
    }

    // -- JUMP --
    if (grounded && kb.presses("up")) {
      player.vel.y = -4.5;
      jumpSound.play();
    }

    // --- STATE MACHINE ---
    if (attacking) {
      attackFrameCounter++;
      if (attackFrameCounter > 12) {
        attacking = false;
        attackFrameCounter = 0;
      }
    } else if (!grounded) {
      player.ani = "jump";
      player.ani.frame = player.vel.y < 0 ? 0 : 1;
    } else {
      player.ani = kb.pressing("left") || kb.pressing("right") ? "run" : "idle";
    }

    // --- MOVEMENT ---
    let isMoving = false;
    if (!attacking) {
      player.vel.x = 0;
      if (kb.pressing("left")) {
        player.vel.x = -1.5;
        player.mirror.x = true;
        isMoving = true;
      } else if (kb.pressing("right")) {
        player.vel.x = 1.5;
        player.mirror.x = false;
        isMoving = true;
      }
    }

    // --- RUNNING AUDIO LOGIC ---
    if (grounded && isMoving && !attacking) {
      if (!runSound.isPlaying()) {
        runSound.loop();
      }
    } else {
      if (runSound.isPlaying()) {
        runSound.stop();
      }
    }

    // --- PLAYER BOUNDS ---
    player.x = constrain(player.x, FRAME_W / 2, LEVELW - FRAME_W / 2);

    // --- GAME END/WIN STATES ---
    if (player.overlaps(treasure)) {
      if (runSound.isPlaying()) runSound.stop();

      uiDiv.hide();
      endDiv.style("display", "flex");

      if (currentLevel === 1) {
        gameState = "WIN_LEVEL";
        document.getElementById("end-title").innerText = "LEVEL 1 CLEAR";
        document.getElementById("end-title").style.color = "#00ff00";
        document.getElementById("end-subtitle").innerText =
          "Press C for Level 2";
      } else {
        gameState = "WIN_GAME";
        document.getElementById("end-title").innerText = "YOU WIN!";
        document.getElementById("end-title").style.color = "#FFD700"; // Gold
        document.getElementById("end-subtitle").innerText =
          "Press R to play again";
      }
    } else if (timeLeft <= 0 || player.y > LEVELH + TILE_H * 3) {
      if (dbgInvincible && player.y > LEVELH + TILE_H * 3) {
        player.x = FRAME_W;
        player.y = PLAYER_START_Y;
        player.vel.x = 0;
        player.vel.y = 0;
        fallSound.play();
      } else if (!dbgInvincible) {
        if (player.y > LEVELH + TILE_H * 3) {
          fallSound.play();
        }
        gameState = "LOSE";
        if (runSound.isPlaying()) runSound.stop();

        uiDiv.hide();
        endDiv.style("display", "flex");
        document.getElementById("end-title").innerText = "YOU LOSE";
        document.getElementById("end-title").style.color = "#ff0000";
        document.getElementById("end-subtitle").innerText =
          "Press R to restart";
      }
    }
  } else if (gameState === "WIN_LEVEL") {
    // Wait for player to press C to continue to Level 2
    if (kb.presses("c")) {
      resetLevel(false, 2);
    }
  } else {
    // Listen for restart when the game is completely over (Lose or Win Game)
    if (kb.presses("r")) {
      resetLevel(false, 1);
    }
  }

  // --- BACKGROUNDS ---
  camera.off();
  imageMode(CORNER);
  drawingContext.imageSmoothingEnabled = false;

  for (const layer of bgLayers) {
    const img = layer.img;
    const w = img.width;
    let x = Math.round((-camera.x * layer.speed) % w);

    if (x > 0) x -= w;
    for (let tx = x; tx < VIEWW + w; tx += w) {
      image(img, tx, 0);
    }
  }
  camera.on();

  // --- PIXEL SNAP ---
  const px = player.x,
    py = player.y;
  const sx = sensor.x,
    sy = sensor.y;

  player.x = Math.round(player.x);
  player.y = Math.round(player.y);
  sensor.x = Math.round(sensor.x);
  sensor.y = Math.round(sensor.y);

  allSprites.draw();

  player.x = px;
  player.y = py;
  sensor.x = sx;
  sensor.y = sy;

  // --- HUD STATS OVERLAY ---
  if (dbgShowStats) {
    camera.off();
    push();
    fill(0, 150);
    noStroke();
    rect(0, 0, 140, 105);

    fill(255);
    textFont("monospace");
    textSize(10);
    textAlign(LEFT, TOP);

    let grounded =
      sensor.overlapping(ground) ||
      sensor.overlapping(platformsL) ||
      sensor.overlapping(platformsR);

    let debugText =
      `FPS: ${Math.round(frameRate())}\n` +
      `State: ${gameState}\n` +
      `Level: ${currentLevel}\n` +
      `Time: ${dbgInvincible ? "∞" : timeLeft + "s"}\n` +
      `Pos: x:${Math.round(player.x)} y:${Math.round(player.y)}\n` +
      `Vel: x:${player.vel.x.toFixed(1)} y:${player.vel.y.toFixed(1)}\n` +
      `Grounded: ${grounded}`;

    text(debugText, 5, 5);
    pop();
    camera.on();
  }

  // --- FULL DEBUG MENU OVERLAY ---
  if (debugMenuOpen) {
    camera.off();

    push();
    rectMode(CENTER);
    fill(0, 0, 0, 220);
    stroke(100);
    strokeWeight(2);
    // Adjusted height to 160 and shifted down to fit the text better
    rect(VIEWW / 2, VIEWH / 2 + 5, 230, 160, 8);

    // Menu Title
    textAlign(CENTER, CENTER);
    fill(255, 255, 0);
    noStroke();
    textFont('"VT323", monospace');
    textSize(24);
    text("DEBUG MENU", VIEWW / 2, VIEWH / 2 - 45);

    // Menu Options
    textSize(14);
    textAlign(LEFT, CENTER);
    let startX = VIEWW / 2 - 80;
    let startY = VIEWH / 2 - 15;
    let spacing = 20;

    fill(255);
    text(
      `[1] Show HUD Stats:    ${dbgShowStats ? "ON" : "OFF"}`,
      startX,
      startY,
    );
    text(
      `[2] Show Collisions:   ${dbgShowCollisions ? "ON" : "OFF"}`,
      startX,
      startY + spacing,
    );
    text(
      `[3] Player Invincible: ${dbgInvincible ? "ON" : "OFF"}`,
      startX,
      startY + spacing * 2,
    );

    // Footer Instructions
    textAlign(CENTER, CENTER);
    fill(150);
    textSize(12);
    text("Press 1-3 to toggle, ` to close", VIEWW / 2, VIEWH / 2 + 60);

    pop();
    camera.on();
  }
}

// Added an optional levelNum parameter to force a specific level
function resetLevel(playFallSound, levelNum = currentLevel) {
  player.x = FRAME_W;
  player.y = PLAYER_START_Y;
  player.vel.x = 0;
  player.vel.y = 0;

  if (playFallSound) {
    fallSound.play();
  }

  // Set level and determine correct time limit
  currentLevel = levelNum;
  maxTime = currentLevel === 1 ? 30 : 15;
  timeLeft = maxTime;
  timerStarted = false;
  gameState = "PLAYING";

  // Reset HTML UI
  if (uiDiv) {
    uiDiv.show();
    document.getElementById("level-span").innerText = "Level " + currentLevel;
    document.getElementById("time-span").innerText = dbgInvincible
      ? "∞"
      : timeLeft + "s";
  }
  if (endDiv) endDiv.style("display", "none");

  let spawn = random(spawnPoints);
  treasure.x = spawn.c * TILE_W + TILE_W / 2;
  treasure.y = spawn.r * TILE_H + TILE_H / 2;
}

function applyIntegerScale() {
  const c = document.querySelector("canvas");
  const scale = Math.max(
    1,
    Math.floor(Math.min(window.innerWidth / VIEWW, window.innerHeight / VIEWH)),
  );
  c.style.width = VIEWW * scale + "px";
  c.style.height = VIEWH * scale + "px";
}
