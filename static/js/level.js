let currLevel = {};
const FPS = 60;

const CHUNK_WIDTH = 16;
const CHUNK_HEIGHT = 16;
const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 75;

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
    hideLobby();

    const canvas = document.getElementById('gameCanvas');
    camera.setDrawRangeByCanvas(canvas);
    const ctx = canvas.getContext('2d');

    // 更新鼠标位置
    updateMousePositionInWorld(camera);

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 渲染地图下部分
    if (currLevel.map && currLevel.map.chunkMap) {
        Object.values(currLevel.map.chunkMap).forEach(chunk => {
            chunk.tiles.forEach((row, tileY) => {
                row.forEach((tile, tileX) => {
                    const absolutePos = {
                        x: chunk.x * CHUNK_WIDTH * TILE_WIDTH + tileX * TILE_WIDTH - TILE_WIDTH / 2,
                        y: chunk.y * CHUNK_HEIGHT * TILE_HEIGHT + tileY * TILE_HEIGHT - TILE_HEIGHT / 2
                    };
                    const screenPos = camera.returnScalePos(absolutePos);
                    if (tile.lowerBlock) {
                        const lowerBlockImage = searchImage(lowerBlockImages, tile.lowerBlock.name, tile.lowerBlock.mutate) || searchImage(lowerBlockImages, 'update', '0');
                        ctx.drawImage(lowerBlockImage, screenPos.x, screenPos.y, TILE_WIDTH * camera.scale, TILE_HEIGHT * camera.scale);
                    }

                    if (tile.upperBlock) {
                        const upperBlockImage = searchImage(upperBlockImages, tile.upperBlock.name, tile.upperBlock.mutate) || searchImage(upperBlockImages, 'update', '0');
                        ctx.drawImage(upperBlockImage, screenPos.x, screenPos.y, TILE_WIDTH * camera.scale, TILE_HEIGHT * camera.scale);

                        if (tile.upperBlock.integrity !== 50) {
                            ctx.font = '10px Arial';
                            ctx.fillStyle = 'red';
                            ctx.fillText(`HP: ${Math.round(tile.upperBlock.integrity)}`, screenPos.x + 5, screenPos.y + 15);
                        }
                    }
                });
            });
        });
    }

    // 渲染鼠标指向的瓦片
    const mouseTile = getMouseAimingTile();
    const mouseTilePos = {
        x: mouseTile.x * TILE_WIDTH - TILE_WIDTH / 2,
        y: mouseTile.y * TILE_HEIGHT - TILE_HEIGHT / 2
    };
    const mouseScreenPos = camera.returnScalePos(mouseTilePos);
    ctx.drawImage(selectImage, mouseScreenPos.x, mouseScreenPos.y, TILE_WIDTH * camera.scale, TILE_HEIGHT * camera.scale);

    // 渲染玩家
    if (currLevel.players) {
        Object.values(currLevel.players).forEach(player => {
            if (!player.online) { return; }
            const screenPos = camera.returnScalePos({ x: player.x - PLAYER_WIDTH / 2, y: player.y - PLAYER_HEIGHT });
            ctx.drawImage(playerImage, screenPos.x, screenPos.y, PLAYER_WIDTH * camera.scale, PLAYER_HEIGHT * camera.scale);

            // 调试：在玩家上方显示物品栏内容
            const inventoryText = player.inventory.map((item, idx) => {
                const selected = idx === player.selectIndex ? '[*]' : '';
                return `${selected}${item.name} x${item.amount}`;
            }).join(', ');
            ctx.font = '12px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(inventoryText, screenPos.x, screenPos.y - 10);

            // 显示当前选中索引
            ctx.fillStyle = 'yellow';
            ctx.fillText(`selectIndex: ${player.selectIndex}`, screenPos.x, screenPos.y - 25);
        });
    }

    // 摄像机焦点聚焦于玩家
    const focusPlayer = currLevel.players ? currLevel.players[currLevel.player_id] : null;
    if (focusPlayer) {
        // 线性插值使摄像机平滑跟随玩家
        const lerp = (start, end, t) => start + (end - start) * t;
        const followSpeed = 0.1;
        camera.pos.x = lerp(camera.pos.x, focusPlayer.x, followSpeed);
        camera.pos.y = lerp(camera.pos.y, focusPlayer.y, followSpeed);
    }
}

setInterval(render, 1000 / FPS);

