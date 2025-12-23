const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 32;

// Размер видимой области (экран)
const VIEW_WIDTH = 20;
const VIEW_HEIGHT = 15;

// Размер карты (в 2 раза больше)
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

canvas.width = VIEW_WIDTH * TILE_SIZE;
canvas.height = VIEW_HEIGHT * TILE_SIZE;

const coinsEl = document.getElementById("coins");
const diamondsEl = document.getElementById("diamonds");
const restartBtn = document.getElementById("restart");

let coins = 0;
let diamonds = 0;
let map = [];
let gameWon = false;

let player = {
    x: 2,
    y: 2,
    stepFrame: 0,
    moving: false
};

let camera = {
    x: 0,
    y: 0
};

// 0 — трава
// 1 — монета
// 2 — стена
// 3 — алмаз
// 4 - дерево
function generateMap() {
    map = Array.from({ length: MAP_HEIGHT }, (_, y) =>
        Array.from({ length: MAP_WIDTH }, (_, x) => {
            if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                return 2;
            }
            if (Math.random() < 0.07) return 2;
            if (Math.random() < 0.03) return 4;
            if (Math.random() < 0.05) return 3;
            if (Math.random() < 0.08) return 1;
            return 0;
        })
    );

    map[player.y][player.x] = 0;
}

function updateCamera() {
    camera.x = player.x - Math.floor(VIEW_WIDTH / 2);
    camera.y = player.y - Math.floor(VIEW_HEIGHT / 2);

    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - VIEW_WIDTH));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - VIEW_HEIGHT));
}

function drawTile(x, y, type) {
    const screenX = (x - camera.x) * TILE_SIZE;
    const screenY = (y - camera.y) * TILE_SIZE;

    if (
        screenX < -TILE_SIZE || screenY < -TILE_SIZE ||
        screenX > canvas.width || screenY > canvas.height
    ) return;

    // ТРАВА
    if (type !== 2) {
        const base = Math.random() > 0.5 ? "#6aa84f" : "#6fae57";
        ctx.fillStyle = base;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // мелкие точки — текстура
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(
                screenX + Math.random() * TILE_SIZE,
                screenY + Math.random() * TILE_SIZE,
                2,
                2
            );
        }
    }

    // СТЕНА (земля + камень)
    if (type === 2) {
        ctx.fillStyle = "#8b6f47";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        ctx.fillStyle = "#6f5737";
        ctx.fillRect(screenX, screenY + TILE_SIZE - 12, TILE_SIZE, 12);

        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(screenX + 4, screenY + 4, 8, 8);
    }

    // МОНЕТА
    if (type === 1) {
        ctx.fillStyle = "#f1c232";
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 16, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // АЛМАЗ
    if (type === 3) {
        ctx.fillStyle = "#76c7ff";
        ctx.beginPath();
        ctx.moveTo(screenX + 16, screenY + 6);
        ctx.lineTo(screenX + 26, screenY + 16);
        ctx.lineTo(screenX + 16, screenY + 26);
        ctx.lineTo(screenX + 6, screenY + 16);
        ctx.closePath();
        ctx.fill();
    }

}

function drawPlayer() {
    const px = (player.x - camera.x) * TILE_SIZE;
    const py = (player.y - camera.y) * TILE_SIZE - 6;

    const step = player.moving ? (player.stepFrame ? 2 : -2) : 0;

    // тень
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 40, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // волосы
    ctx.fillStyle = "#6f4e37";
    ctx.fillRect(px + 8, py + 2, 16, 6);

    // голова
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(px + 8, py + 6, 16, 14);

    // глаза
    ctx.fillStyle = "#000";
    ctx.fillRect(px + 12, py + 12, 2, 2);
    ctx.fillRect(px + 18, py + 12, 2, 2);

    // рот
    ctx.fillRect(px + 15, py + 16, 2, 1);

    // рубашка
    ctx.fillStyle = "#e06666";
    ctx.fillRect(px + 8, py + 20, 16, 12);

    // ремень
    ctx.fillStyle = "#783f04";
    ctx.fillRect(px + 8, py + 28, 16, 2);

    // руки
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(px + 4, py + 22, 4, 8);
    ctx.fillRect(px + 24, py + 22, 4, 8);

    // штаны
    ctx.fillStyle = "#1f66a3ff";
    ctx.fillRect(px + 10, py + 30, 4, 10 + step);
    ctx.fillRect(px + 18, py + 30, 4, 10 - step);
}

function drawTreeTrunk(x, y) {
    const screenX = (x - camera.x) * TILE_SIZE;
    const screenY = (y - camera.y) * TILE_SIZE;

    // основной ствол — длиннее
    ctx.fillStyle = "#7a4a21";
    ctx.fillRect(
        screenX + 10,
        screenY + 6,   // выше начало
        12,
        32             // длиннее
    );

    // тень
    ctx.fillStyle = "#5e3616";
    ctx.fillRect(
        screenX + 10,
        screenY + 6,
        4,
        34
    );

    // корни
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(
        screenX + 8,
        screenY + 36,
        16,
        6
    );
}

function drawTreeCrown(x, y) {
    const screenX = (x - camera.x) * TILE_SIZE;
    const screenY = (y - camera.y) * TILE_SIZE;

    const baseY = screenY - 28;

    // нижняя тёмная масса
    ctx.fillStyle = "#2f6b1f";
    ctx.fillRect(
        screenX - 6,
        baseY + 18,
        44,
        18
    );

    // основная густая листва
    ctx.fillStyle = "#3d8b2f";
    ctx.fillRect(
        screenX - 12,
        baseY + 6,
        56,
        20
    );

    // верх кроны
    ctx.fillStyle = "#3a9625ff";
    ctx.fillRect(
        screenX - 6,
        baseY - 6,
        44,
        16
    );

    // боковые выступы (раскидистость)
    ctx.fillStyle = "#3a7f2a";
    ctx.fillRect(
        screenX - 18,
        baseY + 10,
        16,
        14
    );
    ctx.fillRect(
        screenX + 34,
        baseY + 10,
        16,
        14
    );
}

function drawTreeShadow(x, y) {
    const screenX = (x - camera.x) * TILE_SIZE;
    const screenY = (y - camera.y) * TILE_SIZE;

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(
        screenX + TILE_SIZE / 2,
        screenY + TILE_SIZE + 4,
        16,
        6,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function drawWinScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    ctx.font = "32px monospace";
    ctx.fillText("Поздравляем!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "18px monospace";
    ctx.fillText(
        "Вы собрали все предметы",
        canvas.width / 2,
        canvas.height / 2 + 15
    );

    ctx.font = "14px monospace";
    ctx.fillText(
        "Нажмите «Начать заново»",
        canvas.width / 2,
        canvas.height / 2 + 45
    );
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateCamera();

    // 1. Земля, стены, предметы
    for (let y = camera.y; y < camera.y + VIEW_HEIGHT; y++) {
        for (let x = camera.x; x < camera.x + VIEW_WIDTH; x++) {
            drawTile(x, y, map[y][x]);
        }
    }


    // 2. Тени от крон
    for (let y = camera.y; y < camera.y + VIEW_HEIGHT; y++) {
        for (let x = camera.x; x < camera.x + VIEW_WIDTH; x++) {
            if (map[y][x] === 4) {
                drawTreeShadow(x, y);
            }
        }
    }

    // 2. Стволы деревьев (под игроком)
    for (let y = camera.y; y < camera.y + VIEW_HEIGHT; y++) {
        for (let x = camera.x; x < camera.x + VIEW_WIDTH; x++) {
            if (map[y][x] === 4) {
                drawTreeTrunk(x, y);
            }
        }
    }

    // 3. Игрок
    drawPlayer();

    // 4. Кроны деревьев (над игроком)
    for (let y = camera.y; y < camera.y + VIEW_HEIGHT; y++) {
        for (let x = camera.x; x < camera.x + VIEW_WIDTH; x++) {
            if (map[y][x] === 4) {
                drawTreeCrown(x, y);
            }
        }
    }

    // 5. Экран победы
    if (gameWon) {
        drawWinScreen();
    }
}

function checkWin() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x] === 1 || map[y][x] === 3) {
                return false;
            }
        }
    }
    return true;
}

function collectItem() {
    const cell = map[player.y][player.x];

    if (cell === 1) {
        coins++;
        coinsEl.textContent = coins;
        map[player.y][player.x] = 0;
    }

    if (cell === 3) {
        diamonds++;
        diamondsEl.textContent = diamonds;
        map[player.y][player.x] = 0;
    }

    if (checkWin()) {
        gameWon = true;
    }
}

function canMove(x, y) {
    return map[y][x] !== 2 && map[y][x] !== 4;
}

function move(dx, dy) {
    if (gameWon) return;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (canMove(nx, ny)) {
        player.x = nx;
        player.y = ny;
        player.moving = true;
        player.stepFrame ^= 1;
        collectItem();
    } else {
        player.moving = false;
    }

    draw();
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") move(0, -1);
    if (e.key === "ArrowDown") move(0, 1);
    if (e.key === "ArrowLeft") move(-1, 0);
    if (e.key === "ArrowRight") move(1, 0);
});

restartBtn.addEventListener("click", () => {
    coins = 0;
    diamonds = 0;
    gameWon = false;

    coinsEl.textContent = coins;
    diamondsEl.textContent = diamonds;

    player.x = 2;
    player.y = 2;

    generateMap();
    draw();
});

generateMap();
draw();
