/* game.js
   Contra-style Run & Gun Game (Canvas-based, with endless enemy spawn + scrolling background)
   Expects a <canvas id="game"></canvas> in your HTML.
   Controls:
     - A: Move left
     - D: Move right
     - W / Space: Jump
     - J: Shoot
*/

(function () {
  const canvas = document.getElementById("game");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Resize canvas
  function resize() {
    canvas.width = 960;
    canvas.height = 540;
    canvas.style.width = "100%";
  }
  window.addEventListener("resize", resize);
  resize();

  // --- Game State ---
  let lastTime = performance.now();
  let cameraX = 0;
  let spawnTimer = 0;

  // Player object
  const player = {
    x: 100,
    y: 400,
    vx: 0,
    vy: 0,
    width: 30,
    height: 50,
    speed: 5,
    jump: -14,
    gravity: 0.8,
    onGround: false,
    facing: 1,
    health: 100,
    bullets: []
  };

  // Platforms
  const platforms = [{ x: 0, y: 500, w: 999999, h: 40 }]; // infinite ground

  // Enemies
  const enemies = [];

  // Input handling
  const input = { left: false, right: false, jump: false, shoot: false };

  window.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "A") input.left = true;
    if (e.key === "d" || e.key === "D") input.right = true;
    if (e.key === "w" || e.key === "W" || e.code === "Space") input.jump = true;
    if (e.key === "j" || e.key === "J") shootBullet();
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "a" || e.key === "A") input.left = false;
    if (e.key === "d" || e.key === "D") input.right = false;
    if (e.key === "w" || e.key === "W" || e.code === "Space") input.jump = false;
  });

  function rectRect(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  // Shoot bullet
  function shootBullet() {
    const bullet = {
      x: player.x + (player.facing > 0 ? player.width : -10),
      y: player.y + player.height / 2,
      vx: player.facing * 10,
      width: 10,
      height: 4
    };
    player.bullets.push(bullet);
  }

  // Spawn enemies infinitely
  function spawnEnemies(dt) {
    spawnTimer += dt;
    if (spawnTimer > 1) { // every 1 second
      spawnTimer = 0;
      const spawnX = cameraX + canvas.width + Math.random() * 200;
      const enemy = {
        x: spawnX,
        y: 450,
        width: 30,
        height: 50,
        health: 30,
        color: "red",
        vx: -2
      };
      enemies.push(enemy);
    }
  }

  // Update game state
  function update(dt) {
    // Player movement
    player.vx = 0;
    if (input.left) {
      player.vx = -player.speed;
      player.facing = -1;
    }
    if (input.right) {
      player.vx = player.speed;
      player.facing = 1;
    }

    if (input.jump && player.onGround) {
      player.vy = player.jump;
      player.onGround = false;
    }

    player.vy += player.gravity;
    player.x += player.vx;
    player.y += player.vy;

    // Collision with ground
    player.onGround = false;
    if (player.y + player.height > platforms[0].y) {
      player.y = platforms[0].y - player.height;
      player.vy = 0;
      player.onGround = true;
    }

    // Update bullets
    for (let i = player.bullets.length - 1; i >= 0; i--) {
      const b = player.bullets[i];
      b.x += b.vx;
      if (b.x < cameraX - 50 || b.x > cameraX + canvas.width + 50) {
        player.bullets.splice(i, 1);
        continue;
      }
      // Check collision with enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (rectRect(b, enemies[j])) {
          enemies[j].health -= 10;
          player.bullets.splice(i, 1);
          if (enemies[j].health <= 0) enemies.splice(j, 1);
          break;
        }
      }
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x += e.vx;
      if (e.x < cameraX - 200) {
        enemies.splice(i, 1);
        continue;
      }
    }

    // Camera follows player
    cameraX = player.x - canvas.width / 2;

    // Spawn enemies
    spawnEnemies(dt);
  }

  // --- Drawing ---
  function drawBackground() {
    // Scrolling parallax sky and ground
    const skyWidth = 400;
    const offset = cameraX * 0.5;
    for (let x = -offset % skyWidth - skyWidth; x < canvas.width; x += skyWidth) {
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(x, 0, skyWidth, canvas.height / 2);
      ctx.fillStyle = "#228B22";
      ctx.fillRect(x, canvas.height / 2, skyWidth, canvas.height / 2);
    }
  }

  function drawPlayer() {
    const screenX = player.x - cameraX;
    ctx.fillStyle = "#2196F3";
    ctx.fillRect(screenX, player.y, player.width, player.height);
  }

  function drawEnemies() {
    enemies.forEach((enemy) => {
      const screenX = enemy.x - cameraX;
      ctx.fillStyle = enemy.color;
      ctx.fillRect(screenX, enemy.y, enemy.width, enemy.height);
      ctx.fillStyle = "green";
      ctx.fillRect(screenX, enemy.y - 8, (enemy.width * enemy.health) / 30, 5);
    });
  }

  function drawBullets() {
    ctx.fillStyle = "yellow";
    player.bullets.forEach((b) => {
      ctx.fillRect(b.x - cameraX, b.y, b.width, b.height);
    });
  }

  function drawHUD() {
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText("Enemies: " + enemies.length, 20, 30);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawHUD();
  }

  // Game loop
  function frame(t) {
    const dt = Math.min((t - lastTime) / 1000, 0.1);
    lastTime = t;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
