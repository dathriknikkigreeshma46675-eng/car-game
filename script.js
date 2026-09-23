const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const startBtn = document.getElementById("startBtn");

const road = {
  x: 50,
  y: 0,
  width: 260,
  height: canvas.height,
};

const laneCount = 3;
const laneWidth = road.width / laneCount;

const player = {
  width: 42,
  height: 78,
  x: road.x + laneWidth * 1 + laneWidth / 2 - 21,
  y: canvas.height - 120,
  speed: 280,
  color: "#22c55e",
};

let animationId = null;
let lastTime = 0;
let spawnTimer = 0;
let score = 0;
let bestScore = Number(localStorage.getItem("carGameBest")) || 0;
let isRunning = false;
let gameOver = false;

const keys = {
  left: false,
  right: false,
};

const obstacles = [];

function resetGame() {
  obstacles.length = 0;
  score = 0;
  scoreEl.textContent = "0";
  player.x = road.x + laneWidth * 1 + laneWidth / 2 - player.width / 2;
  spawnTimer = 0;
  gameOver = false;
  isRunning = true;
  lastTime = 0;
}

function updateBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("carGameBest", String(bestScore));
    bestScoreEl.textContent = String(bestScore);
  }
}

function getRandomLane() {
  return Math.floor(Math.random() * laneCount);
}

function createObstacle() {
  const lane = getRandomLane();
  const x = road.x + lane * laneWidth + laneWidth / 2 - 21;

  obstacles.push({
    x,
    y: -100,
    width: 42,
    height: 78,
    speed: 180 + Math.random() * 90 + score * 0.7,
    color: randomColor(),
  });
}

function randomColor() {
  const colors = ["#ef4444", "#f59e0b", "#60a5fa", "#a78bfa", "#f472b6", "#facc15"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function handleInput(dt) {
  if (keys.left) {
    player.x -= player.speed * dt;
  }
  if (keys.right) {
    player.x += player.speed * dt;
  }

  const minX = road.x + 10;
  const maxX = road.x + road.width - player.width - 10;

  player.x = clamp(player.x, minX, maxX);
}

function update(dt) {
  handleInput(dt);

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    createObstacle();
    spawnTimer = 0.8 - Math.min(score * 0.01, 0.45);
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.y += obstacle.speed * dt;

    if (obstacle.y > canvas.height + 100) {
      obstacles.splice(i, 1);
      score += 1;
      scoreEl.textContent = String(score);
      continue;
    }

    if (rectCollision(player, obstacle)) {
      isRunning = false;
      gameOver = true;
      updateBestScore();
      startBtn.textContent = "Play Again";
      break;
    }
  }
}

function drawRoad() {
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(road.x, road.y, road.width, road.height);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3;
  ctx.setLineDash([30, 25]);

  for (let i = 1; i < laneCount; i++) {
    const laneX = road.x + i * laneWidth;
    ctx.beginPath();
    ctx.moveTo(laneX, 0);
    ctx.lineTo(laneX, canvas.height);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawCar(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = "#dbeafe";
  ctx.fillRect(x + 8, y + 10, width - 16, height * 0.25);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x + 6, y + height - 12, width - 12, 10);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x + 6, y + 8, 8, 18);
  ctx.fillRect(x + width - 14, y + 8, 8, 18);
  ctx.fillRect(x + 6, y + height - 28, 8, 18);
  ctx.fillRect(x + width - 14, y + height - 28, 8, 18);
}

function drawGameOverOverlay() {
  ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);

  ctx.font = "20px Arial";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
}

function draw() {
  drawRoad();

  // Player car
  drawCar(player.x, player.y, player.width, player.height, player.color);

  // Obstacles
  for (const obstacle of obstacles) {
    drawCar(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.color);
  }

  if (gameOver) {
    drawGameOverOverlay();
  }
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.03);
  lastTime = timestamp;

  if (isRunning) {
    update(dt);
  }

  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();
  bestScoreEl.textContent = String(bestScore);
  startBtn.textContent = "Restart Game";
  animationId = requestAnimationFrame(gameLoop);
}

startBtn.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keys.left = true;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    keys.right = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keys.left = false;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    keys.right = false;
  }
});

bestScoreEl.textContent = String(bestScore);
drawRoad();
drawCar(player.x, player.y, player.width, player.height, player.color);
