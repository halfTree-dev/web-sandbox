let currLevel = {};
const FPS = 60;
let currFrame = 0;

const CHUNK_WIDTH = 16;
const CHUNK_HEIGHT = 16;
const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;

const PLAYER_WIDTH = 64;
const PLAYER_HEIGHT = 68;

// 仅渲染距离玩家切比雪夫距离为该值之内的区块
const RENDER_RADIUS = 2;

function syncGlobalLevel(level) {
    Object.keys(level).forEach(key => {
        if (key !== 'type') {
            currLevel[key] = level[key];
        }
    });
}

function updatePlayer(player) {
    if (currLevel.players && currLevel.players[player.id]) {
        Object.keys(player).forEach(key => {
            if (typeof player[key] === 'object') {
                Object.keys(player[key]).forEach(subKey => {
                    currLevel.players[player.id][key][subKey] = player[key][subKey];
                });
            } else {
                currLevel.players[player.id][key] = player[key];
            }
        });
    } else {
        // 如果玩家不存在，添加到字典中
        if (!currLevel.players) {
            currLevel.players = {};
        }
        currLevel.players[player.id] = player;
    }
}

function getChunkAndTileIndexByPos(x, y) {
    const chunkX = Math.floor((x + TILE_WIDTH / 2) / (CHUNK_WIDTH * TILE_WIDTH));
    const chunkY = Math.floor((y + TILE_HEIGHT / 2) / (CHUNK_HEIGHT * TILE_HEIGHT));
    let tileX = Math.floor((x + TILE_WIDTH / 2) / TILE_WIDTH) % CHUNK_WIDTH;
    if (tileX < 0) { tileX += CHUNK_WIDTH; }
    let tileY = Math.floor((y + TILE_HEIGHT / 2) / TILE_HEIGHT) % CHUNK_HEIGHT;
    if (tileY < 0) { tileY += CHUNK_HEIGHT; }
    return {
        chunkX : chunkX,
        chunkY : chunkY,
        tileX : tileX,
        tileY : tileY
    }
}

function updateTile(chunkX, chunkY, tile) {
    if (!currLevel.map || !currLevel.map.chunkMap) {
        console.warn(`地图或块图不存在，无法更新瓦片: ${chunkX}, ${chunkY}`);
        return;
    }
    const chunkKey = `${chunkX},${chunkY}`;
    if (!currLevel.map.chunkMap[chunkKey]) {
        console.warn(`指定的块不存在: ${chunkKey}`);
        return;
    }
    const chunk = currLevel.map.chunkMap[chunkKey];
    if (tile.x < 0 || tile.x >= CHUNK_WIDTH || tile.y < 0 || tile.y >= CHUNK_HEIGHT) {
        console.warn(`瓦片坐标超出范围: ${tile.x}, ${tile.y}`);
        return;
    }
    chunk.tiles[tile.y][tile.x] = tile;
}

const camera = new Camera(
    { x: 0, y: 0 }, // 初始位置
    1, // 初始缩放比例
    { width: 800, height: 600 }, // 画布大小
    { width: 800, height: 600 } // 摄像机范围
);

function render() {
    if (!currLevel || !currLevel.map) { return; }
    currFrame++;
    hideLobby();

    // 更新鼠标位置
    updateMousePositionInWorld(camera);

    const canvas = document.getElementById('gameCanvas');
    camera.setDrawRangeByCanvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const focusedPlayer = currLevel.players ? currLevel.players[currLevel.player_id] : null;
    moveCameraToFocusedPlayer(focusedPlayer);
    const indexInfo = getChunkAndTileIndexByPos(focusedPlayer.x, focusedPlayer.y);

    if (currLevel.map && currLevel.map.chunkMap) {
        const playerChunkX = indexInfo.chunkX;
        const playerChunkY = indexInfo.chunkY;
        for (let chunkX = playerChunkX - RENDER_RADIUS; chunkX <= playerChunkX + RENDER_RADIUS; chunkX++) {
            for (let chunkY = playerChunkY - RENDER_RADIUS; chunkY <= playerChunkY + RENDER_RADIUS; chunkY++) {
                const chunkKey = `${chunkX},${chunkY}`;
                const chunk = currLevel.map.chunkMap[chunkKey];
                if (chunk) {
                    chunk.tiles.forEach((row, tileY) => {
                        row.forEach((tile, tileX) => {
                            renderTile(tile, tileX, tileY, chunk.x, chunk.y, );
                        });
                    });
                }
            }
        }
    }
    renderPointingTile();
    renderPlayers();
    camera.drawAllObjects(ctx);

    renderPlayerInfo(focusedPlayer, ctx);
}

function renderTile(tile, tileX, tileY, chunkX, chunkY, ) {
    if (tile.lowerBlock) {
        const lowerBlockImage = searchImage(lowerBlockImages, tile.lowerBlock.name, tile.lowerBlock.mutate) || searchImage(lowerBlockImages, 'update', '0');
        const absolutePos = {
            x: chunkX * CHUNK_WIDTH * TILE_WIDTH + tileX * TILE_WIDTH,
            y: chunkY * CHUNK_HEIGHT * TILE_HEIGHT + tileY * TILE_HEIGHT
        };
        camera.addDrawObject(new DrawObject(
            lowerBlockImage, absolutePos.x, absolutePos.y, 1, 1, 0, TILE_WIDTH / 2, TILE_HEIGHT / 2, 1, 1, 0, 1, false, false));
    }

    if (tile.upperBlock) {
        const upperBlockImage = searchImage(upperBlockImages, tile.upperBlock.name, tile.upperBlock.mutate) || searchImage(upperBlockImages, 'update', '0');
        const absolutePos = {
            x: chunkX * CHUNK_WIDTH * TILE_WIDTH + tileX * TILE_WIDTH,
            y: chunkY * CHUNK_HEIGHT * TILE_HEIGHT + tileY * TILE_HEIGHT
        };
        camera.addDrawObject(new DrawObject(
            upperBlockImage, absolutePos.x, absolutePos.y, 1, 1, 0, upperBlockImage.width / 2, upperBlockImage.height - TILE_HEIGHT / 2, 1, 1, 0, 2, false, false));
    }
}

function renderPointingTile() {
    const mouseTile = getMouseAimingTile();
    const mouseTilePos = {
        x: mouseTile.x * TILE_WIDTH,
        y: mouseTile.y * TILE_HEIGHT
    };
    camera.addDrawObject(new DrawObject(
        selectImage, mouseTilePos.x, mouseTilePos.y, 1, 1, 0, TILE_WIDTH / 2, TILE_HEIGHT / 2, 1, 1, 0, 3, false, false));
}

const lastPlayerRenderPos = {};
function renderPlayers() {
    if (currLevel.players) {
        Object.values(currLevel.players).forEach(player => {
            if (!player.online) { return; }
            let playerFlip = false;
            if (player.mouseAngle) {
                playerFlip = player.mouseAngle > Math.PI / 2 && player.mouseAngle < 3 * Math.PI / 2;
            }
            if (!lastPlayerRenderPos[player.id]) {
                lastPlayerRenderPos[player.id] = { x: player.x, y: player.y };
            } else {
                const lerp = (start, end, t) => start + (end - start) * t;
                const smooth = 0.25;
                lastPlayerRenderPos[player.id].x = lerp(lastPlayerRenderPos[player.id].x, player.x, smooth);
                lastPlayerRenderPos[player.id].y = lerp(lastPlayerRenderPos[player.id].y, player.y, smooth);
            }
            const absolutePos = {
                x: lastPlayerRenderPos[player.id].x,
                y: lastPlayerRenderPos[player.id].y
            };
            const playerFrame = Math.floor(currFrame / FPS * 3);
            camera.addDrawObject(new DrawObject(
                playerImage, absolutePos.x, absolutePos.y, 1, 2, playerFrame, playerImage.width / 2 / 2, playerImage.height, 1, 1, 0, 2, playerFlip, false));
        });
    }
}

function moveCameraToFocusedPlayer(focusedPlayer) {
    if (focusedPlayer) {
        // 线性插值使摄像机平滑跟随玩家
        const lerp = (start, end, t) => start + (end - start) * t;
        const followSpeed = 0.1;
        camera.pos.x = lerp(camera.pos.x, focusedPlayer.x, followSpeed);
        camera.pos.y = lerp(camera.pos.y, focusedPlayer.y, followSpeed);
    }
}

function renderPlayerInfo(focusedPlayer, ctx) {
    if (!focusedPlayer) return;
    // 物品栏调试信息
    const inventoryText = focusedPlayer.inventory.map((item, idx) => {
        const selected = idx === focusedPlayer.selectIndex ? '[*]' : '';
        return `${selected}${item.name} x${item.amount}`;
    }).join(', ');
    ctx.save();
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`物品栏: ${inventoryText}`, 20, 30);
    ctx.restore();
}

setInterval(render, 1000 / FPS);
